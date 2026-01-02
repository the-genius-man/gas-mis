import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Facture, StatutFacture } from '../../types';
import { FileText, Plus, Search, Filter, Eye, Edit2, Trash2, Send, Check, X } from 'lucide-react';
import InvoiceForm from './InvoiceForm';

export default function InvoicesManagement() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [filteredFactures, setFilteredFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingFacture, setEditingFacture] = useState<Facture | null>(null);

  useEffect(() => {
    loadFactures();
  }, []);

  useEffect(() => {
    filterFactures();
  }, [searchTerm, statusFilter, factures]);

  const loadFactures = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('factures_clients')
        .select(`
          *,
          clients (
            id,
            raison_sociale,
            contact_principal_nom,
            devise_facturation
          ),
          factures_details (
            id,
            site_id,
            nombre_gardiens_site,
            montant_forfaitaire_site,
            sites (nom)
          )
        `)
        .order('date_emission', { ascending: false });

      if (error) throw error;
      setFactures(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterFactures = () => {
    let filtered = factures;

    if (searchTerm) {
      filtered = filtered.filter(
        (f) =>
          f.numero_facture.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.clients?.raison_sociale.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== 'ALL') {
      filtered = filtered.filter((f) => f.statut_paiement === statusFilter);
    }

    setFilteredFactures(filtered);
  };

  const handleAddFacture = () => {
    setEditingFacture(null);
    setShowForm(true);
  };

  const handleEditFacture = (facture: Facture) => {
    setEditingFacture(facture);
    setShowForm(true);
  };

  const handleDeleteFacture = async (factureId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;

    try {
      const { error } = await supabase
        .from('factures_clients')
        .delete()
        .eq('id', factureId);

      if (error) throw error;
      await loadFactures();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Erreur lors de la suppression de la facture');
    }
  };

  const handleChangeStatus = async (factureId: string, newStatus: StatutFacture) => {
    try {
      const { error } = await supabase
        .from('factures_clients')
        .update({ statut_paiement: newStatus })
        .eq('id', factureId);

      if (error) throw error;
      await loadFactures();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingFacture(null);
    loadFactures();
  };

  const getStatusBadge = (status: StatutFacture) => {
    const badges = {
      BROUILLON: 'bg-gray-100 text-gray-800',
      ENVOYE: 'bg-blue-100 text-blue-800',
      PAYE_PARTIEL: 'bg-yellow-100 text-yellow-800',
      PAYE_TOTAL: 'bg-green-100 text-green-800',
      ANNULE: 'bg-red-100 text-red-800',
    };
    return badges[status] || badges.BROUILLON;
  };

  const getStatusLabel = (status: StatutFacture) => {
    const labels = {
      BROUILLON: 'Brouillon',
      ENVOYE: 'Envoyé',
      PAYE_PARTIEL: 'Payé Partiel',
      PAYE_TOTAL: 'Payé Total',
      ANNULE: 'Annulé',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number, devise: string) => {
    return `${amount.toLocaleString('fr-FR')} ${devise}`;
  };

  if (showForm) {
    return <InvoiceForm facture={editingFacture} onClose={handleFormClose} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Factures</h2>
          <p className="text-gray-600 mt-1">
            {filteredFactures.length} facture{filteredFactures.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleAddFacture}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nouvelle Facture</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro de facture ou client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="BROUILLON">Brouillon</option>
              <option value="ENVOYE">Envoyé</option>
              <option value="PAYE_PARTIEL">Payé Partiel</option>
              <option value="PAYE_TOTAL">Payé Total</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {filteredFactures.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune facture trouvée</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Aucune facture ne correspond à vos critères de recherche'
              : 'Commencez par créer votre première facture'}
          </p>
          {!searchTerm && statusFilter === 'ALL' && (
            <button
              onClick={handleAddFacture}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Créer une facture</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFactures.map((facture) => (
            <div
              key={facture.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {facture.numero_facture}
                    </h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(facture.statut_paiement)}`}>
                      {getStatusLabel(facture.statut_paiement)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-600">Client</p>
                      <p className="font-medium text-gray-900">{facture.clients?.raison_sociale}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Période</p>
                      <p className="font-medium text-gray-900">
                        {`${String(facture.periode_mois).padStart(2, '0')}/${facture.periode_annee}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date d'émission</p>
                      <p className="font-medium text-gray-900">{formatDate(facture.date_emission)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date d'échéance</p>
                      <p className="font-medium text-gray-900">{formatDate(facture.date_echeance)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Montant Total</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(facture.montant_total_du_client, facture.devise)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gardiens facturés</p>
                      <p className="font-medium text-gray-900">{facture.total_gardiens_factures}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 ml-4">
                  {facture.statut_paiement === 'BROUILLON' && (
                    <>
                      <button
                        onClick={() => handleEditFacture(facture)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleChangeStatus(facture.id, 'ENVOYE')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Marquer comme envoyé"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFacture(facture.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  {facture.statut_paiement === 'ENVOYE' && (
                    <>
                      <button
                        onClick={() => handleChangeStatus(facture.id, 'PAYE_TOTAL')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Marquer comme payé"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleChangeStatus(facture.id, 'ANNULE')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Annuler"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
