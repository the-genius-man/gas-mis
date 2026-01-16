import React from 'react';
import { AlertTriangle, Shield, Car, Calendar, CheckCircle, Clock, X } from 'lucide-react';
import { AlerteSysteme } from '../../types';

interface AlertCardProps {
  alert: AlerteSysteme;
  onAcknowledge?: (id: string) => void;
  compact?: boolean;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onAcknowledge, compact = false }) => {
  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'CRITIQUE': return 'bg-red-100 border-red-500 text-red-800';
      case 'HAUTE': return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'MOYENNE': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'BASSE': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getPriorityBadge = (priorite: string) => {
    switch (priorite) {
      case 'CRITIQUE': return 'bg-red-600 text-white';
      case 'HAUTE': return 'bg-orange-600 text-white';
      case 'MOYENNE': return 'bg-yellow-600 text-white';
      case 'BASSE': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ASSURANCE': return <Shield className="w-5 h-5" />;
      case 'CONTROLE_TECHNIQUE': return <Car className="w-5 h-5" />;
      case 'CERTIFICATION': return <CheckCircle className="w-5 h-5" />;
      case 'CONGE': return <Calendar className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ASSURANCE': return 'Assurance';
      case 'CONTROLE_TECHNIQUE': return 'Contrôle Technique';
      case 'CERTIFICATION': return 'Certification';
      case 'CONGE': return 'Congé';
      default: return 'Autre';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const getDaysRemaining = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date();
    const deadline = new Date(dateStr);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining(alert.date_echeance);

  if (compact) {
    return (
      <div className={`p-3 rounded-lg border-l-4 ${getPriorityColor(alert.priorite)}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {getTypeIcon(alert.type_alerte)}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{alert.titre}</p>
              {daysRemaining !== null && (
                <p className="text-xs mt-1">
                  {daysRemaining > 0 ? `${daysRemaining} jours restants` : 
                   daysRemaining === 0 ? "Aujourd'hui" : 
                   `Expiré depuis ${Math.abs(daysRemaining)} jours`}
                </p>
              )}
            </div>
          </div>
          {alert.statut === 'ACTIVE' && onAcknowledge && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="p-1 hover:bg-white/50 rounded"
              title="Acquitter"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border-l-4 ${getPriorityColor(alert.priorite)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {getTypeIcon(alert.type_alerte)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{alert.titre}</h4>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(alert.priorite)}`}>
                {alert.priorite}
              </span>
            </div>
            <p className="text-sm opacity-80 mb-2">{alert.message}</p>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getTypeLabel(alert.type_alerte)}
              </span>
              {alert.date_echeance && (
                <span>
                  Échéance: {formatDate(alert.date_echeance)}
                  {daysRemaining !== null && (
                    <span className={`ml-1 ${daysRemaining <= 0 ? 'text-red-600 font-bold' : ''}`}>
                      ({daysRemaining > 0 ? `J-${daysRemaining}` : 
                        daysRemaining === 0 ? "Aujourd'hui" : 
                        `+${Math.abs(daysRemaining)}j`})
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        {alert.statut === 'ACTIVE' && onAcknowledge && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="px-3 py-1 bg-white/50 hover:bg-white/80 rounded text-sm font-medium transition-colors"
          >
            Acquitter
          </button>
        )}
        {alert.statut === 'ACQUITTEE' && (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
            Acquittée
          </span>
        )}
        {alert.statut === 'EXPIREE' && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
            Expirée
          </span>
        )}
      </div>
    </div>
  );
};

export default AlertCard;
