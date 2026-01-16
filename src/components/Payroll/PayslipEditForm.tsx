import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { BulletinPaie } from '../../types';

interface PayslipEditFormProps {
  payslip: BulletinPaie;
  onSave: (updatedPayslip: Partial<BulletinPaie>) => Promise<void>;
  onCancel: () => void;
}

export default function PayslipEditForm({ payslip, onSave, onCancel }: PayslipEditFormProps) {
  const [formData, setFormData] = useState({
    salaire_base: payslip.salaire_base,
    jours_travailles: payslip.jours_travailles || 0,
    taux_journalier: payslip.taux_journalier || 0,
    primes: payslip.primes || 0,
    arrieres: payslip.arrieres || 0,
    retenues_disciplinaires: payslip.retenues_disciplinaires || 0,
    autres_retenues: payslip.autres_retenues || 0,
  });
  
  const [saving, setSaving] = useState(false);
  const [taxRates, setTaxRates] = useState({
    cnss: 0,
    onem: 0,
    inpp: 0,
    iprBrackets: [] as any[]
  });
  const [loadingTaxRates, setLoadingTaxRates] = useState(true);

  // Load tax rates from database
  useEffect(() => {
    loadTaxRates();
  }, []);

  const loadTaxRates = async () => {
    if (!window.electronAPI) return;
    
    try {
      const taxSettings = await window.electronAPI.getTaxSettings();
      console.log('=== TAX SETTINGS DEBUG ===');
      console.log('Raw tax settings from DB:', taxSettings);
      
      const cnssSettings = taxSettings.find((s: any) => s.setting_name === 'CNSS_RATE');
      const onemSettings = taxSettings.find((s: any) => s.setting_name === 'ONEM_RATE');
      const inppSettings = taxSettings.find((s: any) => s.setting_name === 'INPP_RATE');
      const iprSettings = taxSettings.find((s: any) => s.setting_name === 'IPR_BRACKETS');
      
      console.log('CNSS Settings found:', cnssSettings);
      console.log('ONEM Settings found:', onemSettings);
      console.log('INPP Settings found:', inppSettings);
      console.log('IPR Settings found:', iprSettings);
      
      const cnssRate = cnssSettings?.setting_value ?? 0;
      const onemRate = onemSettings?.setting_value ?? 0;
      const inppRate = inppSettings?.setting_value ?? 0;
      const iprBrackets = iprSettings?.setting_value ?? [];
      
      console.log('Final rates before setting state:');
      console.log('- CNSS:', cnssRate, '(type:', typeof cnssRate, ')');
      console.log('- ONEM:', onemRate, '(type:', typeof onemRate, ')');
      console.log('- INPP:', inppRate, '(type:', typeof inppRate, ')');
      
      setTaxRates({
        cnss: cnssRate,
        onem: onemRate,
        inpp: inppRate,
        iprBrackets: Array.isArray(iprBrackets) ? iprBrackets : []
      });
      
      console.log('Tax rates set in state:', { cnss: cnssRate, onem: onemRate, inpp: inppRate });
      console.log('=== END TAX SETTINGS DEBUG ===');
    } catch (error) {
      console.error('Error loading tax rates:', error);
      // Keep default rates if loading fails
    } finally {
      setLoadingTaxRates(false);
    }
  };

  // Recalculate derived values using actual tax rates
  // NOTE: Arriérés are NOT included in salaire_brut calculation
  // They are tracked separately for display purposes only
  const salaireBrut = payslip.mode_remuneration === 'JOURNALIER'
    ? formData.jours_travailles * formData.taux_journalier + formData.primes
    : formData.salaire_base + formData.primes;

  const cnss = salaireBrut * taxRates.cnss;
  const onem = salaireBrut * taxRates.onem;
  const inpp = salaireBrut * taxRates.inpp;
  const totalRetenuesSociales = cnss + onem + inpp;
  
  const salaireImposable = salaireBrut - totalRetenuesSociales;
  
  // IPR calculation using actual brackets from database
  const calculateIPR = (imposable: number) => {
    if (!taxRates.iprBrackets || taxRates.iprBrackets.length === 0) {
      // Fallback to simplified calculation if brackets not loaded
      if (imposable <= 72000) return 0;
      if (imposable <= 144000) return (imposable - 72000) * 0.03;
      if (imposable <= 288000) return 2160 + (imposable - 144000) * 0.05;
      return imposable * 0.10;
    }
    
    let ipr = 0;
    let remainingIncome = imposable;
    
    for (const bracket of taxRates.iprBrackets) {
      if (remainingIncome <= 0) break;
      
      const bracketMin = bracket.min || 0;
      const bracketMax = bracket.max === Infinity ? Infinity : (bracket.max || 0);
      const bracketRate = bracket.taux || 0;
      
      if (imposable > bracketMin) {
        const taxableInThisBracket = Math.min(remainingIncome, bracketMax - bracketMin);
        ipr += taxableInThisBracket * bracketRate;
        remainingIncome -= taxableInThisBracket;
      }
    }
    
    return ipr;
  };
  
  const ipr = calculateIPR(salaireImposable);
  
  const totalRetenues = totalRetenuesSociales + ipr + 
                        formData.retenues_disciplinaires + 
                        formData.autres_retenues + 
                        (payslip.avances || 0);
  
  const salaireNet = salaireBrut - totalRetenues;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirm('Enregistrer les modifications de ce bulletin?')) {
      return;
    }
    
    setSaving(true);
    try {
      await onSave({
        ...formData,
        salaire_brut: salaireBrut,
        cnss,
        onem,
        inpp,
        total_retenues_sociales: totalRetenuesSociales,
        salaire_imposable: salaireImposable,
        ipr,
        total_retenues: totalRetenues,
        salaire_net: salaireNet,
      });
    } catch (error) {
      console.error('Error saving payslip:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loadingTaxRates) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des paramètres fiscaux...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Modifier le Bulletin de Paie</h2>
            <p className="text-sm text-gray-600 mt-1">
              {payslip.nom_complet} - {payslip.matricule}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Attention</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Les modifications affecteront le calcul du salaire net. Les cotisations sociales et l'IPR sont calculés selon les paramètres fiscaux actuels 
                  (CNSS: {(taxRates.cnss * 100).toFixed(1)}%, ONEM: {(taxRates.onem * 100).toFixed(1)}%, INPP: {(taxRates.inpp * 100).toFixed(1)}%).
                </p>
              </div>
            </div>
          </div>

          {/* Salary Base Section */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rémunération de Base</h3>
              <div className="grid grid-cols-2 gap-4">
                {payslip.mode_remuneration === 'MENSUEL' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salaire de Base (USD)
                    </label>
                    <input
                      type="number"
                      value={formData.salaire_base}
                      onChange={(e) => setFormData({ ...formData, salaire_base: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jours Travaillés
                      </label>
                      <input
                        type="number"
                        value={formData.jours_travailles}
                        onChange={(e) => setFormData({ ...formData, jours_travailles: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="31"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Taux Journalier (USD)
                      </label>
                      <input
                        type="number"
                        value={formData.taux_journalier}
                        onChange={(e) => setFormData({ ...formData, taux_journalier: parseFloat(e.target.value) || 0 })}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bonuses and Deductions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Primes et Retenues</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primes (USD)
                  </label>
                  <input
                    type="number"
                    value={formData.primes}
                    onChange={(e) => setFormData({ ...formData, primes: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Primes de performance, transport, etc.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arriérés (USD)
                  </label>
                  <input
                    type="number"
                    value={formData.arrieres}
                    onChange={(e) => setFormData({ ...formData, arrieres: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    Calculé automatiquement: salaires validés non payés des périodes précédentes
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retenues Disciplinaires (USD)
                  </label>
                  <input
                    type="number"
                    value={formData.retenues_disciplinaires}
                    onChange={(e) => setFormData({ ...formData, retenues_disciplinaires: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Amendes, sanctions, etc.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Autres Retenues (USD)
                  </label>
                  <input
                    type="number"
                    value={formData.autres_retenues}
                    onChange={(e) => setFormData({ ...formData, autres_retenues: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Prêts, avances remboursées, etc.</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avances (Non modifiable)
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {(payslip.avances || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Géré dans l'onglet Avances</p>
                </div>
              </div>
            </div>

            {/* Calculation Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Récapitulatif du Calcul</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Salaire Brut:</span>
                  <span className="font-semibold text-blue-900">
                    {salaireBrut.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD
                  </span>
                </div>
                <div className="border-t border-blue-200 pt-2">
                  <div className="flex justify-between text-blue-600">
                    <span>CNSS ({(taxRates.cnss * 100).toFixed(1)}%):</span>
                    <span>-{cnss.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>ONEM ({(taxRates.onem * 100).toFixed(1)}%):</span>
                    <span>-{onem.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>INPP ({(taxRates.inpp * 100).toFixed(1)}%):</span>
                    <span>-{inpp.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</span>
                  </div>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2">
                  <span className="text-blue-700">Salaire Imposable:</span>
                  <span className="font-semibold text-blue-900">
                    {salaireImposable.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD
                  </span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>IPR:</span>
                  <span>-{ipr.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>Retenues Disciplinaires:</span>
                  <span>-{formData.retenues_disciplinaires.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>Avances:</span>
                  <span>-{(payslip.avances || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>Autres Retenues:</span>
                  <span>-{formData.autres_retenues.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</span>
                </div>
                <div className="flex justify-between border-t-2 border-blue-300 pt-2 text-lg">
                  <span className="font-bold text-blue-900">Salaire Net:</span>
                  <span className="font-bold text-green-600">
                    {salaireNet.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer les Modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
