import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  User,
  Bell,
  Globe,
  Lock,
  Palette,
  Database,
  Download,
  Upload,
  Zap,
  Shield,
  Eye,
  Calendar,
  DollarSign,
  Check
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  module: string;
  color: string;
  roles: string[];
}

interface UserSettings {
  id: string;
  user_id: string;
  user_role: string;
  quick_actions: QuickAction[];
  preferences: {
    theme?: 'light' | 'dark' | 'auto';
    language?: 'fr' | 'en';
    notifications?: boolean;
    autoSave?: boolean;
    compactView?: boolean;
    showWelcomeBanner?: boolean;
    dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    currency?: 'USD' | 'CDF' | 'EUR';
    itemsPerPage?: number;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [availableActions, setAvailableActions] = useState<QuickAction[]>([]);
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'quick-actions' | 'appearance' | 'security'>('general');

  // Preferences state
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [dateFormat, setDateFormat] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'>('DD/MM/YYYY');
  const [currency, setCurrency] = useState<'USD' | 'CDF' | 'EUR'>('USD');
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // For demo purposes, using a default user. In production, get from auth context
  const currentUserId = 'admin-user-1';
  const currentUserRole = 'ADMIN';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        const [userSettings, actions] = await Promise.all([
          window.electronAPI.getUserSettings(currentUserId),
          window.electronAPI.getAvailableQuickActions(currentUserRole)
        ]);

        setSettings(userSettings);
        setAvailableActions(actions);
        setSelectedActionIds(userSettings.quick_actions?.map((a: QuickAction) => a.id) || []);

        // Load preferences
        const prefs = userSettings.preferences || {};
        setTheme(prefs.theme || 'light');
        setLanguage(prefs.language || 'fr');
        setNotifications(prefs.notifications !== false);
        setAutoSave(prefs.autoSave !== false);
        setCompactView(prefs.compactView || false);
        setShowWelcomeBanner(prefs.showWelcomeBanner !== false);
        setDateFormat(prefs.dateFormat || 'DD/MM/YYYY');
        setCurrency(prefs.currency || 'USD');
        setItemsPerPage(prefs.itemsPerPage || 25);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      if (window.electronAPI && settings) {
        const selectedActions = availableActions.filter(a => selectedActionIds.includes(a.id));
        
        await window.electronAPI.saveUserSettings({
          ...settings,
          quick_actions: selectedActions,
          preferences: {
            theme,
            language,
            notifications,
            autoSave,
            compactView,
            showWelcomeBanner,
            dateFormat,
            currency,
            itemsPerPage
          }
        });
        alert('Paramètres enregistrés avec succès!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erreur lors de l\'enregistrement des paramètres');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAction = (actionId: string) => {
    if (selectedActionIds.includes(actionId)) {
      setSelectedActionIds(selectedActionIds.filter(id => id !== actionId));
    } else {
      if (selectedActionIds.length >= 4) {
        alert('Vous pouvez sélectionner un maximum de 4 actions rapides');
        return;
      }
      setSelectedActionIds([...selectedActionIds, actionId]);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Voulez-vous réinitialiser tous les paramètres par défaut?')) {
      const defaultActions = availableActions.slice(0, 4);
      setSelectedActionIds(defaultActions.map(a => a.id));
      setTheme('light');
      setLanguage('fr');
      setNotifications(true);
      setAutoSave(true);
      setCompactView(false);
      setShowWelcomeBanner(true);
      setDateFormat('DD/MM/YYYY');
      setCurrency('USD');
      setItemsPerPage(25);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des paramètres...</p>
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
            <SettingsIcon className="h-7 w-7" />
            Paramètres
          </h2>
          <p className="text-gray-600 mt-1">Gérez vos préférences et configurations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleResetToDefault}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Réinitialiser</span>
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'general'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Général</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('quick-actions')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'quick-actions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Actions Rapides</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'appearance'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span>Apparence</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'security'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Sécurité</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres Généraux</h3>
                
                {/* Language */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Globe className="h-4 w-4" />
                    Langue
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')}
                    className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Langue de l'interface utilisateur</p>
                </div>

                {/* Currency */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="h-4 w-4" />
                    Devise par Défaut
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'USD' | 'CDF' | 'EUR')}
                    className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD - Dollar Américain</option>
                    <option value="CDF">CDF - Franc Congolais</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Devise utilisée par défaut pour les transactions</p>
                </div>

                {/* Date Format */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4" />
                    Format de Date
                  </label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value as any)}
                    className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="DD/MM/YYYY">JJ/MM/AAAA (31/12/2026)</option>
                    <option value="MM/DD/YYYY">MM/JJ/AAAA (12/31/2026)</option>
                    <option value="YYYY-MM-DD">AAAA-MM-JJ (2026-12-31)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Format d'affichage des dates</p>
                </div>

                {/* Items Per Page */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Database className="h-4 w-4" />
                    Éléments par Page
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Nombre d'éléments affichés dans les listes</p>
                </div>

                {/* Notifications */}
                <div className="mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Bell className="h-4 w-4" />
                        Activer les Notifications
                      </div>
                      <p className="text-xs text-gray-500">Recevoir des notifications pour les événements importants</p>
                    </div>
                  </label>
                </div>

                {/* Auto Save */}
                <div className="mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSave}
                      onChange={(e) => setAutoSave(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Save className="h-4 w-4" />
                        Sauvegarde Automatique
                      </div>
                      <p className="text-xs text-gray-500">Enregistrer automatiquement les modifications</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions Tab */}
          {activeTab === 'quick-actions' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Actions Rapides</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sélectionnez jusqu'à 4 actions qui apparaîtront en haut de votre tableau de bord.
                  <span className="font-medium text-blue-600 ml-1">
                    ({selectedActionIds.length}/4 sélectionnées)
                  </span>
                </p>

                <div className="space-y-2">
                  {availableActions.map((action) => {
                    const isSelected = selectedActionIds.includes(action.id);
                    const position = selectedActionIds.indexOf(action.id) + 1;
                    
                    return (
                      <div
                        key={action.id}
                        onClick={() => handleToggleAction(action.id)}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="h-4 w-4 text-white" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{action.label}</p>
                            <p className="text-xs text-gray-500">Module: {action.module}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                            Position {position}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Apparence</h3>

                {/* Theme */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Palette className="h-4 w-4" />
                    Thème
                  </label>
                  <div className="grid grid-cols-3 gap-3 max-w-md">
                    <button
                      onClick={() => setTheme('light')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === 'light'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-full h-12 bg-white rounded mb-2 border border-gray-200"></div>
                      <p className="text-sm font-medium">Clair</p>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === 'dark'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-full h-12 bg-gray-800 rounded mb-2"></div>
                      <p className="text-sm font-medium">Sombre</p>
                    </button>
                    <button
                      onClick={() => setTheme('auto')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === 'auto'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-full h-12 bg-gradient-to-r from-white to-gray-800 rounded mb-2"></div>
                      <p className="text-sm font-medium">Auto</p>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Le thème sombre sera disponible dans une prochaine version</p>
                </div>

                {/* Compact View */}
                <div className="mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={compactView}
                      onChange={(e) => setCompactView(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Eye className="h-4 w-4" />
                        Vue Compacte
                      </div>
                      <p className="text-xs text-gray-500">Réduire l'espacement pour afficher plus d'informations</p>
                    </div>
                  </label>
                </div>

                {/* Show Welcome Banner */}
                <div className="mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showWelcomeBanner}
                      onChange={(e) => setShowWelcomeBanner(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Afficher la Bannière de Bienvenue
                      </div>
                      <p className="text-xs text-gray-500">Afficher la bannière sur le tableau de bord</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sécurité et Confidentialité</h3>

                {/* User Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Utilisateur Admin</p>
                      <p className="text-sm text-gray-500">Rôle: {currentUserRole}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>ID: {currentUserId}</p>
                  </div>
                </div>

                {/* Change Password */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Lock className="h-4 w-4" />
                    Changer le Mot de Passe
                  </label>
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                    Modifier le Mot de Passe
                  </button>
                  <p className="text-xs text-gray-500 mt-1">Dernière modification: Jamais</p>
                </div>

                {/* Data Export */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Download className="h-4 w-4" />
                    Exporter les Données
                  </label>
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                    Télécharger mes Données
                  </button>
                  <p className="text-xs text-gray-500 mt-1">Exporter toutes vos données personnelles</p>
                </div>

                {/* Data Import */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Upload className="h-4 w-4" />
                    Importer les Paramètres
                  </label>
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                    Importer depuis un Fichier
                  </button>
                  <p className="text-xs text-gray-500 mt-1">Restaurer vos paramètres depuis une sauvegarde</p>
                </div>

                {/* Session Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Sécurité du Compte</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Assurez-vous de toujours vous déconnecter après utilisation sur un ordinateur partagé.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
