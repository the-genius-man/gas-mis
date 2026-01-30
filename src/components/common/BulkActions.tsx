import React from 'react';
import { Trash2, UserX, Check, X } from 'lucide-react';

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant: 'danger' | 'warning' | 'primary';
  confirmMessage?: string;
}

interface BulkActionsProps {
  selectedItems: string[];
  totalItems: number;
  onSelectAll: (selected: boolean) => void;
  onClearSelection: () => void;
  actions: BulkAction[];
  onAction: (actionId: string, selectedItems: string[]) => void;
  loading?: boolean;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedItems,
  totalItems,
  onSelectAll,
  onClearSelection,
  actions,
  onAction,
  loading = false
}) => {
  const allSelected = selectedItems.length === totalItems && totalItems > 0;
  const someSelected = selectedItems.length > 0 && selectedItems.length < totalItems;

  const handleAction = (action: BulkAction) => {
    if (selectedItems.length === 0) return;

    const message = action.confirmMessage || 
      `Êtes-vous sûr de vouloir ${action.label.toLowerCase()} ${selectedItems.length} élément(s) sélectionné(s) ?`;
    
    if (window.confirm(message)) {
      onAction(action.id, selectedItems);
    }
  };

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-orange-600 hover:bg-orange-700 text-white';
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  if (selectedItems.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Select All Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) input.indeterminate = someSelected;
              }}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-blue-900">
              {selectedItems.length} sur {totalItems} sélectionné(s)
            </span>
          </div>

          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100 rounded"
          >
            <X className="w-3 h-3" />
            Désélectionner tout
          </button>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={loading}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getVariantStyles(action.variant)}`}
            >
              {action.icon}
              {action.label}
              {loading && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Common bulk actions
export const createBulkActions = {
  delete: (label: string = 'Supprimer'): BulkAction => ({
    id: 'delete',
    label,
    icon: <Trash2 className="w-4 h-4" />,
    variant: 'danger',
    confirmMessage: `Êtes-vous sûr de vouloir supprimer définitivement ces éléments ? Cette action est irréversible.`
  }),
  
  deactivate: (label: string = 'Désactiver'): BulkAction => ({
    id: 'deactivate',
    label,
    icon: <UserX className="w-4 h-4" />,
    variant: 'warning',
    confirmMessage: `Êtes-vous sûr de vouloir désactiver ces éléments ?`
  }),
  
  activate: (label: string = 'Activer'): BulkAction => ({
    id: 'activate',
    label,
    icon: <Check className="w-4 h-4" />,
    variant: 'primary',
    confirmMessage: `Êtes-vous sûr de vouloir activer ces éléments ?`
  })
};

export default BulkActions;