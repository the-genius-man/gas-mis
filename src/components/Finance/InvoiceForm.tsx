import { useState, useEffect, useMemo } from 'react';
import { X, Save, FileText, Building2, Calendar, Trash2, Check } from 'lucide-react';
import { FactureGAS, FactureDetailGAS, ClientGAS, SiteGAS } from '../../types';

interface InvoiceFormProps {
  facture: FactureGAS | null;
  clients: ClientGAS[];
  sites: SiteGAS[];
  onClose: () => void;
  onSuccess: () => void;
}

const isElectron = () => {
  if (typeof window !== 'undefined') {
    return !!(window.electronAPI?.isElectron || window.require || (window as any).process?.versions?.electron);
  }
  return false;
};

const MONTHS = [
  { value: 1,  label: 'Janvier' },
  { value: 2,  label: 'Février' },
  { value: 3,  label: 'Mars' },
  { value: 4,  label: 'Avril' },
  { value: 5,  label: 'Mai' },
  { value: 6,  label: 'Juin' },
  { value: 7,  label: 'Juillet' },
  { value: 8,  label: 'Août' },
  { value: 9,  label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

const generateInvoiceNumber = (mois: number, annee: number) => {
  const monthStr = String(mois).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 9000) + 1000);
  return `FAC-${annee}-${monthStr}-${random}`;
};

export default function InvoiceForm({ facture, clients, sites, onClose, onSuccess }: InvoiceFormProps) {
  const electronMode = useMemo(() => isElectron(), []);
  const [loading, setLoading] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Core fields
  const [clientId, setClientId] = useState(facture?.client_id || '');
  const [dateEmission, setDateEmission] = useState(
    facture?.date_emission || new Date().toISOString().split('T')[0]
  );
  const [dateEcheance, setDateEcheance] = useState(facture?.date_echeance || '');
  const [annee, setAnnee] = useState(facture?.periode_annee || currentYear);
  // Multi-select months — for edit mode pre-select the existing month
  const [selectedMonths, setSelectedMonths] = useState<number[]>(
    facture?.periode_mois ? [facture.periode_mois] : [currentMonth]
  );
  const [fraisSupp, setFraisSupp] = useState(facture?.montant_frais_supp || 0);
  const [motifFrais, setMotifFrais] = useState(facture?.motif_frais_supp || '');
  const [notes, setNotes] = useState(facture?.notes_facture || '');
  const [details, setDetails] = useState<Partial<FactureDetailGAS>[]>(facture?.details || []);

  const clientSites = sites.filter(s => s.client_id === clientId && s.est_actif);

  // Auto-set echeance when client or emission date changes
  useEffect(() => {
    if (clientId && dateEmission) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        const d = new Date(dateEmission);
        d.setDate(d.getDate() + (client.delai_paiement_jours || 30));
        setDateEcheance(d.toISOString().split('T')[0]);
      }
    }
  }, [clientId, dateEmission, clients]);

  // Clear details when client changes
  useEffect(() => {
    if (!facture) setDetails([]);
  }, [clientId]);

  const devise = clients.find(c => c.id === clientId)?.devise_preferee || 'USD';

  const montantHT = details.reduce((s, d) => s + (d.montant_forfaitaire_site || 0), 0);
  const montantTTC = montantHT + fraisSupp;
  const totalGardiens = details.reduce((s, d) => s + (d.nombre_gardiens_site || 0), 0);

  const toggleMonth = (m: number) => {
    // In edit mode only one month allowed
    if (facture) return;
    setSelectedMonths(prev =>
      prev.includes(m) ? (prev.length > 1 ? prev.filter(x => x !== m) : prev) : [...prev, m].sort((a, b) => a - b)
    );
  };

  const addSiteDetail = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    if (!site || details.some(d => d.site_id === siteId)) return;
    const totalEffectif = (site.effectif_jour_requis || 0) + (site.effectif_nuit_requis || 0);
    setDetails(prev => [...prev, {
      id: crypto.randomUUID(),
      site_id: siteId,
      nombre_gardiens_site: totalEffectif,
      montant_forfaitaire_site: site.tarif_mensuel_client || 0,
      description_ligne: `Gardiennage ${site.nom_site}`,
      site,
    }]);
  };

  const removeDetail = (index: number) => setDetails(prev => prev.filter((_, i) => i !== index));

  const updateDetail = (index: number, field: string, value: number | string) =>
    setDetails(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!electronMode || !clientId || selectedMonths.length === 0) return;
    setLoading(true);

    try {
      if (facture) {
        // Edit mode — update single invoice
        const updated: FactureGAS = {
          ...facture,
          client_id: clientId,
          date_emission: dateEmission,
          date_echeance: dateEcheance,
          periode_mois: selectedMonths[0],
          periode_annee: annee,
          total_gardiens_factures: totalGardiens,
          montant_ht_prestation: montantHT,
          montant_frais_supp: fraisSupp,
          motif_frais_supp: motifFrais,
          creances_anterieures: facture.creances_anterieures,
          montant_total_ttc: montantTTC,
          montant_total_du_client: montantTTC,
          devise,
          statut_paiement: facture.statut_paiement,
          notes_facture: notes,
          details: details.map(d => ({
            ...d,
            id: d.id || crypto.randomUUID(),
            facture_id: facture.id,
          })) as FactureDetailGAS[],
        };
        await window.electronAPI!.updateFactureGAS(updated);
      } else {
        // Create mode — one invoice per selected month
        for (const mois of selectedMonths) {
          const id = crypto.randomUUID();
          const clientObj = clients.find(c => c.id === clientId);
          const invoice: FactureGAS = {
            id,
            client_id: clientId,
            client_nom: clientObj?.nom_entreprise,
            numero_facture: generateInvoiceNumber(mois, annee),
            date_emission: dateEmission,
            date_echeance: dateEcheance,
            periode_mois: mois,
            periode_annee: annee,
            total_gardiens_factures: totalGardiens,
            montant_ht_prestation: montantHT,
            montant_frais_supp: fraisSupp,
            motif_frais_supp: motifFrais,
            creances_anterieures: 0,
            montant_total_ttc: montantTTC,
            montant_total_du_client: montantTTC,
            devise,
            statut_paiement: 'BROUILLON',
            notes_facture: notes,
            details: details.map(d => ({
              ...d,
              id: crypto.randomUUID(),
              facture_id: id,
            })) as FactureDetailGAS[],
          };
          await window.electronAPI!.addFactureGAS(invoice);
        }
      }
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la facture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {facture ? 'Modifier la Facture' : 'Nouvelle Facture'}
              </h2>
              {facture && <p className="text-blue-100 text-sm">{facture.numero_facture}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Client & Invoice Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="h-4 w-4 inline mr-1" />
                Client <span className="text-red-500">*</span>
              </label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Sélectionner un client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nom_entreprise}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
              <input
                type="text"
                value={devise}
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date Émission <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dateEmission}
                onChange={e => setDateEmission(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Échéance</label>
              <input
                type="date"
                value={dateEcheance}
                onChange={e => setDateEcheance(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Year + Month multi-select */}
          <div>
            <div className="flex items-center gap-4 mb-3">
              <label className="block text-sm font-medium text-gray-700">Année</label>
              <input
                type="number"
                value={annee}
                onChange={e => setAnnee(parseInt(e.target.value) || currentYear)}
                min="2020"
                max="2035"
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mois de facturation
              {!facture && <span className="ml-2 text-xs text-gray-500">(sélection multiple)</span>}
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {MONTHS.map(m => {
                const selected = selectedMonths.includes(m.value);
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => toggleMonth(m.value)}
                    disabled={!!facture}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-1
                      ${selected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      } ${facture ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                  >
                    {selected && <Check className="h-3 w-3" />}
                    {m.label.slice(0, 3)}
                  </button>
                );
              })}
            </div>
            {selectedMonths.length > 1 && (
              <p className="text-xs text-blue-600 mt-2">
                {selectedMonths.length} factures seront créées — une par mois sélectionné
              </p>
            )}
          </div>

          {/* Site Details */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Détails par Site</h4>
              {clientId && clientSites.length > 0 && (
                <select
                  onChange={e => { if (e.target.value) { addSiteDetail(e.target.value); e.target.value = ''; } }}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">+ Ajouter un site</option>
                  {clientSites.filter(s => !details.some(d => d.site_id === s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.nom_site}</option>
                  ))}
                </select>
              )}
            </div>

            {details.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">
                  {clientId ? 'Ajoutez des sites pour cette facture' : 'Sélectionnez d\'abord un client'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {details.map((detail, index) => {
                  const site = sites.find(s => s.id === detail.site_id);
                  return (
                    <div key={detail.id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-gray-900">{site?.nom_site || 'Site'}</h5>
                          <p className="text-xs text-gray-500">{site?.adresse_physique}</p>
                        </div>
                        <button type="button" onClick={() => removeDetail(index)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Gardiens</label>
                          <input
                            type="number"
                            value={detail.nombre_gardiens_site || 0}
                            onChange={e => updateDetail(index, 'nombre_gardiens_site', parseInt(e.target.value) || 0)}
                            min="0"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Montant ({devise})</label>
                          <input
                            type="number"
                            value={detail.montant_forfaitaire_site || 0}
                            onChange={e => updateDetail(index, 'montant_forfaitaire_site', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Description</label>
                          <input
                            type="text"
                            value={detail.description_ligne || ''}
                            onChange={e => updateDetail(index, 'description_ligne', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Additional Charges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frais Supplémentaires ({devise})
              </label>
              <input
                type="number"
                value={fraisSupp}
                onChange={e => setFraisSupp(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Motif des Frais</label>
              <input
                type="text"
                value={motifFrais}
                onChange={e => setMotifFrais(e.target.value)}
                placeholder="Ex: Heures supplémentaires"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">Récapitulatif</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-blue-700">Gardiens</p>
                <p className="text-lg font-bold text-blue-900">{totalGardiens}</p>
              </div>
              <div>
                <p className="text-blue-700">Montant HT</p>
                <p className="text-lg font-bold text-blue-900">{devise} {montantHT.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-blue-700">Total à Payer</p>
                <p className="text-xl font-bold text-green-700">{devise} {montantTTC.toLocaleString()}</p>
              </div>
            </div>
            {selectedMonths.length > 1 && (
              <p className="text-xs text-blue-700 mt-2 font-medium">
                Total pour {selectedMonths.length} mois: {devise} {(montantTTC * selectedMonths.length).toLocaleString()}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Notes ou commentaires..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
          <p className="text-xs text-gray-500"><span className="text-red-500">*</span> Champs obligatoires</p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !clientId || selectedMonths.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>
                {loading
                  ? 'Enregistrement...'
                  : facture
                    ? 'Enregistrer'
                    : selectedMonths.length > 1
                      ? `Créer ${selectedMonths.length} factures`
                      : 'Créer la facture'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
