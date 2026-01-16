import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Download, Filter } from 'lucide-react';

export default function ClientReports() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // TODO: Load client stats
    setLoading(false);
  }, [dateRange]);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rapports Clients</h3>
        <p className="text-gray-600">Module en cours de développement...</p>
      </div>
    </div>
  );
}
