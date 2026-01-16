import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Percent,
  DollarSign,
  AlertCircle,
  Info
} from 'lucide-react';

interface TaxSetting {
  id: string;
  setting_name: string;
  setting_value: number | any[];
  description: string;
  category: string;
  updated_at: string;
  updated_by: string;
}

export default function TaxSettings() {
  const [settings, setSettings] = useState<TaxSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Local state for editing
  const [cnssRate, setCnssRate] = useState(5);
  const [onemRate, setOnemRate] = useState(1.5);
  const [inppRate, setInppRate] = useState(0.5);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        const data = await window.electronAPI.getTaxSettings();
        console.log('Tax settings loaded:', data);
        setSettings(data);
        
        // Set local state
        const cnss = data.find((s: TaxSetting) => s.setting_name === 'CNSS_RATE');
        const onem = data.find((s: TaxSetting) => s.setting_name === 'ONEM_RATE');
        const inpp = data.find((s: TaxSetting) => s.setting_name === 'INPP_RATE');
        
        if (cnss) setCnssRate(cnss.setting_value * 100);
        if (onem) setOnemRate(onem.setting_value * 100);
        if (inpp) setInppRate(inpp.setting_value * 100);
      }
    } catch (error) {
      console.error('Error loading tax settings:', error);
      alert(`Erreur lors du chargement des paramètres fiscaux:\n${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!window.electronAPI) return;
    
    if (!confirm('Voulez-vous enregistrer ces modifications?\n\nCela affectera tous les futurs calculs de paie.')) {
      return;
    }
    
    setSaving(true);
    try {
      await Promise.all([
        window.electronAPI.updateTaxSetting({
          setting_name: 'CNSS_RATE',
          setting_value: cnssRate / 100,
          updated_by: 'current_user'
        }),
        window.electronAPI.updateTaxSetting({
          setting_name: 'ONEM_RATE',
          setting_value: onemRate / 100,
          updated_by: 'current_user'
        }),
        window.electronAPI.updateTaxSetting({
          setting_name: 'INPP_RATE',
          setting_value: inppRate / 100,
          updated_by: 'current_user'
        })
      ]);
      
      await loadSettings();
      alert('Paramètres fiscaux enregistrés avec succès!');
    } catch (error) {
      console.error('Error saving tax settings:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.electronAPI) return;
    
    if (!confirm('Voulez-vous réinitialiser tous les paramètres fiscaux aux valeurs par défaut (RDC)?\n\nCNSS: 5%\nONEM: 1.5%\nINPP: 0.5%\nIPR: Barème progressif RDC')) {
      return;
    }
    
    try {
      await window.electronAPI.resetTaxSettings();
      await loadSettings();
      alert('Paramètres fiscaux réinitialisés avec succès!');
    } catch (error) {
      console.error('Error resetting tax settings:', error);
      alert(`Erreur lors de la réinitialisation:\n${error.message || error}`);
    }
  };

  const handleDiagnostic = async () => {
    if (!window.electronAPI) {
      alert('Mode Electron non détecté!\n\nCette fonctionnalité nécessite le mode Electron.');
      return;
    }
    
    try {
      const data = await window.electronAPI.getTaxSettings();
      const diagnosticInfo = `
=== DIAGNOSTIC PARAMÈTRES FISCAUX ===

Nombre de paramètres: ${data.length}

Détails:
${data.map(s => `
- ${s.setting_name}
  Valeur: ${typeof s.setting_value === 'object' ? 'JSON Array' : s.setting_value}
  Catégorie: ${s.category}
  Description: ${s.description}
`).join('\n')}

Statut: ${data.length === 4 ? '✓ OK' : '⚠ Incomplet'}
      `.trim();
      
      console.log(diagnosticInfo);
      alert(diagnosticInfo);
    } catch (error) {
      const errorInfo = `
=== ERREUR DIAGNOSTIC ===

Message: ${error.message || error}

Vérifiez:
1. L'application Electron est bien lancée
2. Le fichier database.sqlite existe
3. La table tax_settings existe
4. Les handlers IPC sont enregistrés

Consultez la console (F12) pour plus de détails.
      `.trim();
      
      console.error('Diagnostic error:', error);
      alert(errorInfo);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des paramètres fiscaux...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-7 w-7" />
            Paramètres Fiscaux
          </h2>
          <p className="text-gray-600 mt-1">Configuration des taux de cotisations et d'impôts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDiagnostic}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            title="Vérifier l'état des paramètres fiscaux"
          >
            <AlertCircle className="h-4 w-4" />
            <span>Diagnostic</span>
          </button>
          <button
            onClick={handleReset}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Réinitialiser</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Attention</p>
            <p className="text-sm text-yellow-700 mt-1">
              Les modifications de ces paramètres affecteront tous les futurs calculs de paie. 
              Les périodes de paie déjà calculées ne seront pas affectées.
            </p>
          </div>
        </div>
      </div>

      {/* Social Deductions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Cotisations Sociales (RDC)
          </h3>
          <p className="text-sm text-gray-600">
            Taux de cotisations sociales obligatoires prélevés sur le salaire brut
          </p>
        </div>

        <div className="space-y-6">
          {/* CNSS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CNSS - Caisse Nationale de Sécurité Sociale
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-xs">
                <div className="relative">
                  <input
                    type="number"
                    value={cnssRate}
                    onChange={(e) => setCnssRate(parseFloat(e.target.value) || 0)}
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Exemple: Sur 1,000 USD → {(cnssRate / 100 * 1000).toFixed(2)} USD
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Taux légal RDC: 5%</p>
          </div>

          {/* ONEM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ONEM - Office National de l'Emploi
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-xs">
                <div className="relative">
                  <input
                    type="number"
                    value={onemRate}
                    onChange={(e) => setOnemRate(parseFloat(e.target.value) || 0)}
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Exemple: Sur 1,000 USD → {(onemRate / 100 * 1000).toFixed(2)} USD
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Taux légal RDC: 1.5%</p>
          </div>

          {/* INPP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              INPP - Institut National de Préparation Professionnelle
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-xs">
                <div className="relative">
                  <input
                    type="number"
                    value={inppRate}
                    onChange={(e) => setInppRate(parseFloat(e.target.value) || 0)}
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Exemple: Sur 1,000 USD → {(inppRate / 100 * 1000).toFixed(2)} USD
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Taux légal RDC: 0.5%</p>
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Cotisations Sociales</span>
              <span className="text-lg font-bold text-blue-600">{(cnssRate + onemRate + inppRate).toFixed(2)}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Sur un salaire de 1,000 USD: {((cnssRate + onemRate + inppRate) / 100 * 1000).toFixed(2)} USD de déductions
            </p>
          </div>
        </div>
      </div>

      {/* IPR Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            IPR - Impôt Professionnel sur les Rémunérations
          </h3>
          <p className="text-sm text-gray-600">
            Barème progressif de l'impôt sur le revenu (RDC)
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Barème Progressif</p>
              <p className="text-sm text-blue-700 mt-1">
                L'IPR est calculé selon un barème progressif à 11 tranches (0% à 45%). 
                La modification du barème IPR nécessite une intervention technique.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tranche</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">De (CDF)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">À (CDF)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taux</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr><td className="px-4 py-2 text-sm">1</td><td className="px-4 py-2 text-sm">0</td><td className="px-4 py-2 text-sm">72,000</td><td className="px-4 py-2 text-sm font-medium">0%</td></tr>
              <tr><td className="px-4 py-2 text-sm">2</td><td className="px-4 py-2 text-sm">72,001</td><td className="px-4 py-2 text-sm">144,000</td><td className="px-4 py-2 text-sm font-medium">3%</td></tr>
              <tr><td className="px-4 py-2 text-sm">3</td><td className="px-4 py-2 text-sm">144,001</td><td className="px-4 py-2 text-sm">288,000</td><td className="px-4 py-2 text-sm font-medium">5%</td></tr>
              <tr><td className="px-4 py-2 text-sm">4</td><td className="px-4 py-2 text-sm">288,001</td><td className="px-4 py-2 text-sm">576,000</td><td className="px-4 py-2 text-sm font-medium">10%</td></tr>
              <tr><td className="px-4 py-2 text-sm">5</td><td className="px-4 py-2 text-sm">576,001</td><td className="px-4 py-2 text-sm">1,152,000</td><td className="px-4 py-2 text-sm font-medium">15%</td></tr>
              <tr><td className="px-4 py-2 text-sm">6</td><td className="px-4 py-2 text-sm">1,152,001</td><td className="px-4 py-2 text-sm">2,304,000</td><td className="px-4 py-2 text-sm font-medium">20%</td></tr>
              <tr><td className="px-4 py-2 text-sm">7</td><td className="px-4 py-2 text-sm">2,304,001</td><td className="px-4 py-2 text-sm">4,608,000</td><td className="px-4 py-2 text-sm font-medium">25%</td></tr>
              <tr><td className="px-4 py-2 text-sm">8</td><td className="px-4 py-2 text-sm">4,608,001</td><td className="px-4 py-2 text-sm">9,216,000</td><td className="px-4 py-2 text-sm font-medium">30%</td></tr>
              <tr><td className="px-4 py-2 text-sm">9</td><td className="px-4 py-2 text-sm">9,216,001</td><td className="px-4 py-2 text-sm">18,432,000</td><td className="px-4 py-2 text-sm font-medium">35%</td></tr>
              <tr><td className="px-4 py-2 text-sm">10</td><td className="px-4 py-2 text-sm">18,432,001</td><td className="px-4 py-2 text-sm">36,864,000</td><td className="px-4 py-2 text-sm font-medium">40%</td></tr>
              <tr><td className="px-4 py-2 text-sm">11</td><td className="px-4 py-2 text-sm">36,864,001</td><td className="px-4 py-2 text-sm">+</td><td className="px-4 py-2 text-sm font-medium">45%</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Last Updated Info */}
      {settings.length > 0 && settings[0].updated_at && (
        <div className="text-sm text-gray-500 text-center">
          Dernière modification: {new Date(settings[0].updated_at).toLocaleString('fr-FR')}
          {settings[0].updated_by && ` par ${settings[0].updated_by}`}
        </div>
      )}
    </div>
  );
}
