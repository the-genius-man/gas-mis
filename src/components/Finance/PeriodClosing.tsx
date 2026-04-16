import { useState, useEffect } from 'react';
import { Lock, AlertTriangle, CheckCircle, Calendar, FileText } from 'lucide-react';
import { EcritureComptable } from '../../types';

function formatDate(d: string) { return new Date(d).toLocaleDateString('fr-FR'); }

export default function PeriodClosing() {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState(new Date().toISOString().slice(0, 10));
  const [preview, setPreview] = useState<EcritureComptable[]>([]);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closedPeriods, setClosedPeriods] = useState<{ period: string; count: number; date: string }[]>([]);

  useEffect(() => { loadClosedPeriods(); }, []);

  const loadClosedPeriods = async () => {
    if (!window.electronAPI) return;
    try {
      const data = await window.electronAPI.getEcrituresComptables({ statut: 'CLOTURE' });
      // Group by month
      const byMonth = new Map<string, number>();
      for (const e of (data || [])) {
        const month = e.date_ecriture.slice(0, 7);
        byMonth.set(month, (byMonth.get(month) || 0) + 1);
      }
      setClosedPeriods(
        Array.from(byMonth.entries())
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([period, count]) => ({ period, count, date: period + '-01' }))
      );
    } catch (_) {}
  };

  const handlePreview = async () => {
    if (!window.electronAPI || !dateFin) return;
    setLoading(true);
    try {
      const data = await window.electronAPI.getEcrituresComptables({
        statut: 'VALIDE',
        date_debut: dateDebut || undefined,
        date_fin: dateFin,
      });
      setPreview(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (preview.length === 0) return;
    const periodLabel = dateDebut
      ? `${formatDate(dateDebut)} — ${formatDate(dateFin)}`
      : `jusqu'au ${formatDate(dateFin)}`;

    if (!confirm(
      `Clôturer ${preview.length} écriture(s) pour la période ${periodLabel} ?\n\n` +
      `⚠ Cette action est IRRÉVERSIBLE. Les écritures clôturées ne peuvent plus être modifiées.`
    )) return;

    setClosing(true);
    try {
      // Close each validated entry in the period
      await Promise.all(
        preview.map(e =>
          window.electronAPI!.cloturerEcriture({ ecritureId: e.id })
        )
      );
      setPreview([]);
      await loadClosedPeriods();
      alert(`✓ ${preview.length} écriture(s) clôturée(s) avec succès.`);
    } catch (err: any) {
      alert(`Erreur lors de la clôture: ${err.message}`);
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Warning banner */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800">Clôture de période — Action irréversible</p>
          <p className="text-sm text-amber-700 mt-1">
            La clôture verrouille définitivement les écritures validées. Elles ne pourront plus être modifiées.
            Seules les écritures en statut <strong>VALIDE</strong> sont concernées.
          </p>
        </div>
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Sélectionner la période à clôturer
        </h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Du (optionnel)</label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Au *</label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={handlePreview} disabled={loading || !dateFin}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
            <FileText className="w-4 h-4" />
            {loading ? 'Chargement...' : 'Prévisualiser'}
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
            <span className="font-semibold text-gray-800">
              {preview.length} écriture(s) VALIDE à clôturer
            </span>
            <button onClick={handleClose} disabled={closing}
              className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold disabled:opacity-50">
              <Lock className="w-4 h-4" />
              {closing ? 'Clôture en cours...' : 'Clôturer la période'}
            </button>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-200">
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">N° Pièce</th>
                  <th className="px-4 py-2 text-left">Libellé</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((e, i) => (
                  <tr key={e.id} className={`border-t border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-2 text-gray-600">{formatDate(e.date_ecriture)}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{e.numero_piece || '—'}</td>
                    <td className="px-4 py-2 text-gray-800">{e.libelle}</td>
                    <td className="px-4 py-2">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{e.type_operation}</span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-900">
                      {e.montant_total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {e.devise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Closed periods history */}
      {closedPeriods.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-gray-800">Périodes clôturées</span>
          </div>
          <div className="divide-y divide-gray-100">
            {closedPeriods.map(p => (
              <div key={p.period} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-800">
                    {new Date(p.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {p.count} écriture{p.count > 1 ? 's' : ''} clôturée{p.count > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
