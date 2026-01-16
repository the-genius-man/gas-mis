import { useState, useEffect, useMemo } from 'react';
import { X, Building2, User, FileText, MapPin, ChevronRight, ChevronLeft, Check, Plus, Trash2, Users, DollarSign, Edit } from 'lucide-react';
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

interface ClientFormWizardProps {
  client: ClientGAS | null;
  onClose: () => void;
  onSuccess: () => void;
}

const isElectron = () => {
  if (typeof window !== 'undefined') {
    return !!(window.electronAPI?.isElectron || window.require || (window as any).process?.versions?.electron);
  }
  return false;
};

const initialFormData: Omit<ClientGAS, 'id' | 'cree_le'> = {
  type_client: 'PHYSIQUE',
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
  statut: 'ACTIF',
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

export default function ClientFormWizard({ client, onClose, onSuccess }: ClientFormWizardProps) {
  const electronMode = useMemo(() => isElectron(), []);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [sites, setSites] = useState<SiteFormData[]>([]);
  const [showAddSite, setShowAddSite] = useState(false);
  const [currentSite, setCurrentSite] = useState<SiteFormData>(initialSiteData);
  const [editingSiteIndex, setEditingSiteIndex] = useState<number | null>(null);

  const totalSteps = client ? 3 : 4; // 4 steps for new clients (includes sites), 3 for editing

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
        statut: client.statut || 'ACTIF',
      });
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseInt(value) || 0 : value;
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue,
      };
      
      // Auto-sync contact_nom with nom_entreprise for Personne Physique
      if (name === 'nom_entreprise' && updated.type_client === 'PHYSIQUE') {
        updated.contact_nom = newValue as string;
      }
      
      // Clear contact_nom when switching to Personne Physique (will auto-fill from nom_entreprise)
      if (name === 'type_client' && newValue === 'PHYSIQUE') {
        updated.contact_nom = updated.nom_entreprise;
      }
      
      return updated;
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Étape 1: Informations générales
        if (!formData.nom_entreprise.trim()) {
          alert('Le nom est obligatoire');
          return false;
        }
        // For Personne Morale, contact_nom must be filled separately
        if (formData.type_client === 'MORALE' && !formData.contact_nom?.trim()) {
          alert('Le contact principal est obligatoire pour une personne morale');
          return false;
        }
        // For Personne Physique, contact_nom is auto-filled from nom_entreprise
        if (formData.type_client === 'PHYSIQUE' && !formData.contact_nom?.trim()) {
          // Auto-fill if somehow empty
          setFormData(prev => ({ ...prev, contact_nom: prev.nom_entreprise }));
        }
        return true;
      case 2:
        // Étape 2: Identifiants légaux (optionnels)
        return true;
      case 3:
        // Étape 3: Facturation (avec valeurs par défaut)
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!electronMode) return;
    
    if (!validateStep(currentStep)) return;
    
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
    } else {
      setCurrentSite(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSiteToList = () => {
    if (!currentSite.nom_site.trim()) {
      alert('Le nom du site est obligatoire');
      return;
    }
    if (currentSite.cout_unitaire_garde <= 0) {
      alert('Le coût unitaire par garde est obligatoire');
      return;
    }
    
    if (editingSiteIndex !== null) {
      // Update existing site
      setSites(prev => prev.map((site, idx) => idx === editingSiteIndex ? { ...currentSite } : site));
      setEditingSiteIndex(null);
    } else {
      // Add new site
      setSites(prev => [...prev, { ...currentSite }]);
    }
    
    setCurrentSite({ ...initialSiteData });
    setShowAddSite(false);
  };

  const handleEditSite = (index: number) => {
    setCurrentSite({ ...sites[index] });
    setEditingSiteIndex(index);
    setShowAddSite(true);
  };

  const handleRemoveSite = (index: number) => {
    setSites(prev => prev.filter((_, i) => i !== index));
    // If we're editing this site, cancel the edit
    if (editingSiteIndex === index) {
      setEditingSiteIndex(null);
      setCurrentSite({ ...initialSiteData });
      setShowAddSite(false);
    }
  };

  const handleCancelAddSite = () => {
    setCurrentSite({ ...initialSiteData });
    setEditingSiteIndex(null);
    setShowAddSite(false);
  };

  const steps = client ? [
    { number: 1, title: 'Informations Générales', icon: Building2 },
    { number: 2, title: 'Identifiants Légaux', icon: FileText },
    { number: 3, title: 'Facturation', icon: MapPin },
  ] : [
    { number: 1, title: 'Informations Générales', icon: Building2 },
    { number: 2, title: 'Identifiants Légaux', icon: FileText },
    { number: 3, title: 'Facturation', icon: User },
    { number: 4, title: 'Sites (Optionnel)', icon: MapPin },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
                Étape {currentStep} sur {totalSteps}
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

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isActive ? 'bg-blue-600 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <p className={`text-xs mt-2 font-medium ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Étape 1: Informations Générales */}
          {currentStep === 1 && (
            <div className="space-y-6">
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
                  <option value="PHYSIQUE">Personne Physique (Individu)</option>
                  <option value="MORALE">Personne Morale (Entreprise)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Par défaut: Personne Physique</p>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Principal <span className="text-red-500">*</span>
                </label>
                {formData.type_client === 'PHYSIQUE' ? (
                  <div>
                    <input
                      type="text"
                      name="contact_nom"
                      value={formData.contact_nom}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-blue-600">
                      <strong>Auto-rempli:</strong> Pour une personne physique, le contact principal est le client lui-même
                    </p>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      name="contact_nom"
                      value={formData.contact_nom}
                      onChange={handleChange}
                      required
                      placeholder="Ex: Marie KABILA (Responsable Financier)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Personne à contacter dans l'entreprise pour la facturation
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
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
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact d'Urgence (Optionnel)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Nom</label>
                    <input
                      type="text"
                      name="contact_urgence_nom"
                      value={formData.contact_urgence_nom}
                      onChange={handleChange}
                      placeholder="Ex: Pierre MUTOMBO"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      name="contact_urgence_telephone"
                      value={formData.contact_urgence_telephone}
                      onChange={handleChange}
                      placeholder="Ex: +243 999 789 012"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Identifiants Légaux */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Information :</strong> Ces champs sont optionnels mais recommandés pour la facturation officielle en RDC.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <p className="mt-1 text-xs text-gray-500">Pour personnes morales</p>
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
                  <p className="mt-1 text-xs text-gray-500">Registre de commerce</p>
                </div>

                <div className="md:col-span-2">
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
                  <p className="mt-1 text-xs text-gray-500">Carte d'identité ou passeport</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse de Facturation
                </label>
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

          {/* Étape 3: Facturation */}
          {currentStep === 3 && (
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

              {!client && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Prochaine étape :</strong> Vous pourrez ajouter des sites pour ce client (optionnel).
                  </p>
                </div>
              )}

              {client && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h4 className="text-sm font-semibold text-green-900 mb-4">Récapitulatif du Client</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Type:</span>
                      <span className="font-medium text-green-900">
                        {formData.type_client === 'MORALE' ? 'Personne Morale' : 'Personne Physique'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Nom:</span>
                      <span className="font-medium text-green-900">{formData.nom_entreprise || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Contact Principal:</span>
                      <span className="font-medium text-green-900">{formData.contact_nom || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Téléphone:</span>
                      <span className="font-medium text-green-900">{formData.telephone || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Email:</span>
                      <span className="font-medium text-green-900">{formData.contact_email || '-'}</span>
                    </div>
                    <div className="border-t border-green-300 pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="text-green-700">Facturation:</span>
                        <span className="font-medium text-green-900">{formData.devise_preferee}</span>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-green-700">Délai de paiement:</span>
                        <span className="font-medium text-green-900">{formData.delai_paiement_jours} jours</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Étape 4: Sites (only for new clients) */}
          {currentStep === 4 && !client && (
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
                    <div key={`site-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{site.nom_site}</p>
                        <p className="text-sm text-gray-500">
                          {site.effectif_jour_requis + site.effectif_nuit_requis} gardes × ${site.cout_unitaire_garde} = ${site.tarif_mensuel_client.toLocaleString()}/mois
                        </p>
                        {site.adresse_physique && (
                          <p className="text-xs text-gray-400 mt-1">{site.adresse_physique}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditSite(index)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier ce site"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSite(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer ce site"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Site Form */}
              {showAddSite ? (
                <div className="border border-green-300 rounded-lg p-4 bg-green-50 space-y-4">
                  <h4 className="text-sm font-semibold text-green-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {editingSiteIndex !== null ? 'Modifier le Site' : 'Nouveau Site'}
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

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Consignes Spécifiques</label>
                      <textarea
                        name="consignes_specifiques"
                        value={currentSite.consignes_specifiques}
                        onChange={handleSiteChange}
                        rows={2}
                        placeholder="Instructions particulières pour ce site..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleAddSiteToList}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      {editingSiteIndex !== null ? 'Mettre à jour' : 'Ajouter ce site'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAddSite}
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

              {/* Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="text-sm font-semibold text-green-900 mb-4">Récapitulatif Final</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Client:</span>
                    <span className="font-medium text-green-900">{formData.nom_entreprise}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Contact Principal:</span>
                    <span className="font-medium text-green-900">{formData.contact_nom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Facturation:</span>
                    <span className="font-medium text-green-900">{formData.devise_preferee} - Net {formData.delai_paiement_jours} jours</span>
                  </div>
                  <div className="border-t border-green-300 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-green-700">Sites à créer:</span>
                      <span className="font-medium text-green-900">{sites.length}</span>
                    </div>
                    {sites.length > 0 && (
                      <div className="flex justify-between mt-2">
                        <span className="text-green-700">Revenu mensuel total:</span>
                        <span className="font-bold text-green-900">
                          ${sites.reduce((sum, s) => sum + s.tarif_mensuel_client, 0).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Navigation */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i + 1 === currentStep ? 'bg-blue-600 w-8' :
                  i + 1 < currentStep ? 'bg-green-500' :
                  'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
              <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
