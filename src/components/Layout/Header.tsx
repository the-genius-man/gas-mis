import React, { useState } from 'react';
import { Bell, Search, User, Calendar, AlertTriangle, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { utilisateur, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'CEO': return 'bg-purple-100 text-purple-800';
      case 'FINANCE': return 'bg-green-100 text-green-800';
      case 'OPS_MANAGER': return 'bg-blue-100 text-blue-800';
      case 'SUPERVISOR': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Calendar className="h-5 w-5" />
            </button>
            
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </button>

            <button className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
              <AlertTriangle className="h-5 w-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">{utilisateur?.nom_complet}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{utilisateur?.nom_complet}</p>
                      <p className="text-xs text-gray-500 mt-1">@{utilisateur?.nom_utilisateur}</p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(utilisateur?.role || '')}`}>
                        {utilisateur?.role}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Se déconnecter
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}