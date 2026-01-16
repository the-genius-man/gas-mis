import React, { useState } from 'react';
import { X, User, Calendar, MapPin, Users, DollarSign, CheckCircle, XCircle, FileText } from 'lucide-react';
import { ActionDisciplinaire, TypeActionDisciplinaire, StatutActionDisciplinaire } from '../../types';

interface ActionDetailModalProps {
  action: ActionDisciplinaire;
  onClose: () => void;
  onUpdate: () => void;
}

const ActionDetailModal: React.FC<ActionDetailModalProps> = ({ action, onClose, onUpdate }) => {
  const [validationComment, setValidationComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const getTypeBadge = (type: TypeActionDisciplinaire) => {
    const styles: Record<TypeActionDisciplinaire, string> = {
      'AVERTISSEMENT_VERBAL': 'bg-yellow-100 text-yellow-800',
      'AVERTISSEMENT_ECRIT': 'bg-orange-100 text-orange-800',
      'SUSPENSION': 'bg-red-100 text-red-800',
      'LICENCIEMENT': 'bg-red-200 text-red-900',
    };
    const labels: Record<TypeActionDisciplinaire, string> = {
      'AVERTISSEMENT_VERBAL': 'Avertissement Verbal',
      'AVERTISSEMENT_ECRIT': 'Avertissement Écrit',
      'SUSPENSION': 'Suspension',
      'LICENCIEMENT': 'Licenciement',
    };
    return { style: styles[type], label: labels[type] };
  };

  const getStatutBadge = (statut: StatutActionDisciplinaire) => {
    const styles: Record<StatutActionDisciplinaire, string> = {
      'BROUILLON': 'bg-gray-100 text-gray-800',
      'EN_ATTENTE_SIGNATURE': 'bg-yellow-100 text-yellow-800', // Legacy - treated as validation
      'EN_ATTENTE_VALIDATION': 'bg-yellow-100 text-yellow-800',
      'VALIDE': 'bg-green-100 text-green-800',
      'REJETE': 'bg-red-100 text-red-800',
    };
    const labels: Record<StatutActionDisciplinaire, string> = {
      'BROUILLON': 'Brouillon',
      'EN_ATTENTE_SIGNATURE': 'En Attente de Validation', // Legacy - treated as validation
      'EN_ATTENTE_VALIDATION': 'En Attente de Validation',
      'VALIDE': 'Validé',
      'REJETE': 'Rejeté',
    };
    return { style: styles[statut], label: labels[statut] };
  };

  const handleValidate = async () => {
    if (!window.electronAPI?.validateDisciplinaryAction) return;
    try {
      setProcessing(true);
      await window.electronAPI.validateDisciplinaryAction({
        id: action.id,
        validePar: 'current-user', // TODO: Get from auth context
        commentaire: validationComment
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error validating action:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!window.electronAPI?.rejectDisciplinaryAction) return;
    if (!validationComment) {
      alert('Veuillez fournir un motif de rejet');
      return;
    }
    try {
      setProcessing(true);
      await window.electronAPI.rejectDisciplinaryAction({
        id: action.id,
        validePar: 'current-user', // TODO: Get from auth context
        commentaire: validationComment
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error rejecting action:', error);
    } finally {
      setProcessing(false);
    }
  };

  const typeBadge = getTypeBadge(action.type_action);
  const statutBadge = getStatutBadge(action.statut);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Détails de l'Action Disciplinaire</h3>
            <div className="flex gap-2 mt-1">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeBadge.style}`}>
                {typeBadge.label}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statutBadge.style}`}>
                {statutBadge.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{action.employe_nom}</h4>
              <p className="text-sm text-gray-500">{action.matricule}</p>
            </div>
          </div>

          {/* Incident Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Détails de l'Incident
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Date:</span>
                <span className="font-medium">
                  {new Date(action.date_incident).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {action.lieu_incident && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Lieu:</span>
                  <span className="font-medium">{action.lieu_incident}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {action.description_incident}
              </p>
            </div>

            {action.temoins && (
              <div className="flex items-start gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-gray-500">Témoins:</span>
                  <span className="ml-2 font-medium">{action.temoins}</span>
                </div>
              </div>
            )}
          </div>

          {/* Financial Impact */}
          {action.impact_financier && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" />
                Impact Financier
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {action.montant_deduction > 0 && (
                  <div>
                    <span className="text-red-600">Déduction:</span>
                    <span className="ml-2 font-bold text-red-800">
                      {action.montant_deduction} USD
                    </span>
                  </div>
                )}
                {action.jours_suspension > 0 && (
                  <div>
                    <span className="text-red-600">Suspension:</span>
                    <span className="ml-2 font-bold text-red-800">
                      {action.jours_suspension} jour(s)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Validation Info */}
          {action.statut === 'VALIDE' && action.date_validation && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4" />
                Validé
              </h4>
              <p className="text-sm text-green-600">
                Par {action.validateur_nom} le {new Date(action.date_validation).toLocaleDateString('fr-FR')}
              </p>
              {action.commentaire_validation && (
                <p className="text-sm text-gray-600 mt-1">"{action.commentaire_validation}"</p>
              )}
            </div>
          )}

          {action.statut === 'REJETE' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4" />
                Rejeté
              </h4>
              {action.commentaire_validation && (
                <p className="text-sm text-gray-600">Motif: "{action.commentaire_validation}"</p>
              )}
            </div>
          )}

          {/* Actions - Only show validation for EN_ATTENTE_VALIDATION */}
          {action.statut === 'EN_ATTENTE_VALIDATION' && (
            <div className="border-t pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaire (obligatoire pour rejet)
                </label>
                <textarea
                  value={validationComment}
                  onChange={(e) => setValidationComment(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Ajouter un commentaire..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 inline mr-2" />
                  Rejeter
                </button>
                <button
                  onClick={handleValidate}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Valider
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionDetailModal;
