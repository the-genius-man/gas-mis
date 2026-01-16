import { useState, useEffect, useMemo } from 'react';
import { X, Save, Building2, User, FileText, MapPin, CreditCard, Plus, Trash2, Users, DollarSign } from 'lucide-react';
import { ClientGAS, SiteGAS } from '../../types';

interface SiteFormData {
  nom_site: string;
  adresse_physique: string;
  effectif_jour_requis: number;
  effectif_nuit_requis: number;
  cout_unitaire_garde: number;
  tarif_mensuel_client: number;
  consignes_specifiques: string;
  est_actif: boolean;
}

interface ClientFormProps {
  client: ClientGAS | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Check if running in Electron
const isElectron = () => {
  if (typeof window !== 'undefined') {
    return !!(window.electronAPI?.isElectron || window.require || (window as any).process?.versions?.electron);
  }
  return false;
};

const initialFormData: Omit<ClientGAS, 'id' | 'cree_le'> = {
  type_client: 'MORALE',
  nom_entreprise: '',
  nif: '',
  rccm: '',
  id_national: '',
  numero_contrat: '',
  contrat_url: '',
  contact_nom: '',
  contact_email: '',
  telephone: '',
  contact_urgence_nom: '',
  contact_urgence_telephone: '',
  adresse_facturation: '',
  devise_preferee: 'USD',
  delai_paiement_jours: 30,
};

const initialSiteData: SiteFormData = {
  nom_site: '',
  adresse_physique: '',
  effectif_jour_requis: 1,
  effectif_nuit_requis: 1,
  cout_unitaire_garde: 0,
  tarif_mensuel_client: 0,
  consignes_specifiques: '',
  est_actif: true,
};

export default function ClientForm({ client, onClose, onSuccess }: ClientFormProps) {
  const electronMode = useMemo(() => isElectron(), []);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [activeSection, setActiveSection] = useState<'general' | 'legal' | 'contact' | 'billing' | 'sites'>('general');
  const [sites, setSites] = useState<SiteFormData[]>([]);
  const [showAddSite, setShowAddSite] = useState(false);
  const [currentSite, setCurrentSite] = useState<SiteFormData>(initialSiteData);

  useEffect(() => {
    if (client) {
      setFormData({
        type_client: client.type_client,
        nom_entreprise: client.nom_entreprise,
        nif: client.nif || '',
        rccm: client.rccm || '',
        id_national: client.id_national || '',
        numero_contrat: client.numero_contrat || '',
        contrat_url: client.contrat_url || '',
        contact_nom: client.contact_nom || '',
        contact_email: client.contact_email || '',
        telephone: client.telephone || '',
        contact_urgence_nom: client.contact_urgence_nom || '',
        contact_urgence_telephone: client.contact_urgence_telephone || '',
        adresse_facturation: client.adresse_facturation || '',
        devise_preferee: client.devise_preferee,
        delai_paiement_jours: client.delai_paiement_jours,
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!electronMode) return;
    
    setLoading(true);

    try {
      const clientId = client?.id || crypto.randomUUID();
      const clientData: ClientGAS = {
        ...formData,
        id: clientId,
        cree_le: client?.cree_le || new Date().toISOString(),
      };

      if (window.electronAPI) {
        if (client) {
          await window.electronAPI.updateClientGAS(clientData);
        } else {
          await window.electronAPI.addClientGAS(clientData);
          
          // Save sites for new client
          for (const site of sites) {
            const siteData: SiteGAS = {
              id: crypto.randomUUID(),
              client_id: clientId,
              nom_site: site.nom_site,
              adresse_physique: site.adresse_physique,
              effectif_jour_requis: site.effectif_jour_requis,
              effectif_nuit_requis: site.effectif_nuit_requis,
              cout_unitaire_garde: site.cout_unitaire_garde,
              tarif_mensuel_client: site.tarif_mensuel_client,
              consignes_specifiques: site.consignes_specifiques,
              est_actif: site.est_actif,
            };
            await window.electronAPI.addSiteGAS(siteData);
          }
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du client');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  // Site handling functions
  const handleSiteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      const numValue = parseFloat(value) || 0;
      
      // Auto-calculate tarif_mensuel_client when effectif or cout_unitaire changes
      if (name === 'effectif_jour_requis' || name === 'effectif_nuit_requis' || name === 'cout_unitaire_garde') {
        const newEffectifJour = name === 'effectif_jour_requis' ? numValue : currentSite.effectif_jour_requis;
        const newEffectifNuit = name === 'effectif_nuit_requis' ? numValue : currentSite.effectif_nuit_requis;
        const newCoutUnitaire = name === 'cout_unitaire_garde' ? numValue : currentSite.cout_unitaire_garde;
        const totalEffectif = newEffectifJour + newEffectifNuit;
        const tarifMensuel = totalEffectif * newCoutUnitaire;
        setCurrentSite(prev => ({ 
          ...prev, 
          [name]: numValue,
          tarif_mensuel_client: Math.round(tarifMensuel * 100) / 100
        }));
      } else {
        setCurrentSite(prev => ({ ...prev, [name]: numValue }));
      }
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCurrentSite(prev => ({ ...prev, [name]: checked }));
    } else {
      setCurrentSite(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSiteToList = () => {
    if (!currentSite.nom_site) {
      alert('Le nom du site est obligatoire');
      return;
    }
    if (currentSite.cout_unitaire_garde <= 0) {
      alert('Le coût unitaire par garde est obligatoire');
      return;
    }
    setSites(prev => [...prev, currentSite]);
    setCurrentSite(initialSiteData);
    setShowAddSite(false);
  };

  const handleRemoveSite = (index: number) => {
    setSites(prev => prev.filter((_, i) => i !== index));
  };

  const sections = [
    { id: 'general', label: 'Informations Générales', icon: Building2 },
    { id: 'legal', label: 'Identifiants Légaux', icon: FileText },
    { id: 'contact', label: 'Contacts', icon: User },
    { id: 'billing', label: 'Facturation', icon: CreditCard },
    ...(!client ? [{ id: 'sites', label: 'Sites', icon: MapPin }] : []),
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {client ? 'Modifier le Client' : 'Nouveau Client'}
              </h2>
              <p className="text-blue-100 text-sm">
                {client ? 'Mise à jour des informations' : 'Enregistrement d\'un nouveau client'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-6">
          <nav className="flex space-x-4 overflow-x-auto" aria-label="Sections">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id as typeof activeSection)}
                  className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Section: Informations Générales */}
          {activeSection === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type_client"
                    value={formData.type_client}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  >
                    <option value="MORALE">Personne Morale (Entreprise)</option>
                    <option value="PHYSIQUE">Personne Physique (Individu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.type_client === 'MORALE' ? 'Raison Sociale' : 'Nom Complet'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom_entreprise"
                    value={formData.nom_entreprise}
                    onChange={handleChange}
                    required
                    placeholder={formData.type_client === 'MORALE' ? 'Ex: RAWBANK SARL' : 'Ex: Jean MUKENDI'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de Contrat
                </label>
                <input
                  type="text"
                  name="numero_contrat"
                  value={formData.numero_contrat}
                  onChange={handleChange}
                  placeholder="Ex: GAS-2026-001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
                <p className="mt-1 text-xs text-gray-500">Référence unique du contrat signé</p>
              </div>
            </div>
          )}

          {/* Section: Identifiants Légaux */}
          {activeSection === 'legal' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Important :</strong> Le NIF est obligatoire pour la facturation officielle en RDC.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIF (Numéro d'Identification Fiscale)
                  </label>
                  <input
                    type="text"
                    name="nif"
                    value={formData.nif}
                    onChange={handleChange}
                    placeholder="Ex: A1234567B"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RCCM
                  </label>
                  <input
                    type="text"
                    name="rccm"
                    value={formData.rccm}
                    onChange={handleChange}
                    placeholder="Ex: CD/GOM/RCCM/12-B-1234"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID National
                  </label>
                  <input
                    type="text"
                    name="id_national"
                    value={formData.id_national}
                    onChange={handleChange}
                    placeholder="Pour personne physique"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Contacts */}
          {activeSection === 'contact' && (
            <div className="space-y-8">
              {/* Contact Principal */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Contact Principal (Destinataire des factures)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <input
                      type="text"
                      name="contact_nom"
                      value={formData.contact_nom}
                      onChange={handleChange}
                      placeholder="Ex: Marie KABILA"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleChange}
                      placeholder="Ex: finance@client.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      placeholder="Ex: +243 999 123 456"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Urgence */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-red-600" />
                  Contact d'Urgence (Interventions hors heures)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <input
                      type="text"
                      name="contact_urgence_nom"
                      value={formData.contact_urgence_nom}
                      onChange={handleChange}
                      placeholder="Ex: Pierre MUTOMBO"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      name="contact_urgence_telephone"
                      value={formData.contact_urgence_telephone}
                      onChange={handleChange}
                      placeholder="Ex: +243 999 789 012"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  Adresse de Facturation
                </h4>
                <textarea
                  name="adresse_facturation"
                  value={formData.adresse_facturation}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Ex: 123 Avenue du Commerce, Quartier Himbi, Goma, Nord-Kivu, RDC"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>
          )}

          {/* Section: Facturation */}
          {activeSection === 'billing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Devise Préférée <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="devise_preferee"
                    value={formData.devise_preferee}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  >
                    <option value="USD">USD - Dollar Américain</option>
                    <option value="CDF">CDF - Franc Congolais</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Devise utilisée pour les factures</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Délai de Paiement (jours) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="delai_paiement_jours"
                    value={formData.delai_paiement_jours}
                    onChange={handleChange}
                    required
                    min="0"
                    max="90"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                  <p className="mt-1 text-xs text-gray-500">Net 30, Net 15, etc.</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Récapitulatif des Conditions</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Facturation en <strong>{formData.devise_preferee}</strong></li>
                  <li>• Paiement attendu sous <strong>{formData.delai_paiement_jours} jours</strong> après émission</li>
                  <li>• Le coût unitaire par garde est défini au niveau de chaque site</li>
                  <li>• Le montant total sera calculé automatiquement selon le nombre de gardes par site</li>
                </ul>
              </div>
            </div>
          )}

          {/* Section: Sites (only for new clients) */}
          {activeSection === 'sites' && !client && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Optionnel :</strong> Vous pouvez ajouter des sites maintenant ou les créer plus tard depuis l'onglet Sites.
                </p>
              </div>

              {/* Sites List */}
              {sites.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Sites à créer ({sites.length})</h4>
                  {sites.map((site, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{site.nom_site}</p>
                        <p className="text-sm text-gray-500">
                          {site.effectif_jour_requis + site.effectif_nuit_requis} gardes × ${site.cout_unitaire_garde} = ${site.tarif_mensuel_client.toLocaleString()}/mois
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSite(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Site Form */}
              {showAddSite ? (
                <div className="border border-green-300 rounded-lg p-4 bg-green-50 space-y-4">
                  <h4 className="text-sm font-semibold text-green-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Nouveau Site
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du Site <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nom_site"
                        value={currentSite.nom_site}
                        onChange={handleSiteChange}
                        placeholder="Ex: Entrepôt Kyeshero"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                      <input
                        type="text"
                        name="adresse_physique"
                        value={currentSite.adresse_physique}
                        onChange={handleSiteChange}
                        placeholder="Ex: Avenue du Lac, Goma"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Users className="h-3 w-3 inline mr-1" />
                        Effectif Jour
                      </label>
                      <input
                        type="number"
                        name="effectif_jour_requis"
                        value={currentSite.effectif_jour_requis}
                        onChange={handleSiteChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Users className="h-3 w-3 inline mr-1" />
                        Effectif Nuit
                      </label>
                      <input
                        type="number"
                        name="effectif_nuit_requis"
                        value={currentSite.effectif_nuit_requis}
                        onChange={handleSiteChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <DollarSign className="h-3 w-3 inline mr-1" />
                        Coût Unitaire/Garde <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="cout_unitaire_garde"
                        value={currentSite.cout_unitaire_garde}
                        onChange={handleSiteChange}
                        min="0"
                        step="0.01"
                        placeholder="Ex: 150"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">$/garde/mois</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tarif Mensuel (Auto)
                      </label>
                      <input
                        type="number"
                        value={currentSite.tarif_mensuel_client}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">= {currentSite.effectif_jour_requis + currentSite.effectif_nuit_requis} gardes × ${currentSite.cout_unitaire_garde}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleAddSiteToList}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Ajouter ce site
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddSite(false); setCurrentSite(initialSiteData); }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddSite(true)}
                  className="w-full py-3 border-2 border-dashed border-green-300 rounded-lg text-green-600 hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Ajouter un site</span>
                </button>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            <span className="text-red-500">*</span> Champs obligatoires
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.nom_entreprise}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
