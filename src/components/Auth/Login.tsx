import React, { useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 [LOGIN] Tentative de connexion pour:', username);
    setError(null);
    setLoading(true);

    try {
      await signIn(username, password);
      console.log('✅ [LOGIN] Connexion réussie');
    } catch (err: any) {
      console.error('❌ [LOGIN] Erreur de connexion:', err);
      setError(err.message || 'Erreur de connexion. Veuillez vérifier vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              <Shield className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Guardian Command</h1>
            <p className="text-blue-100">GO AHEAD SECURITY</p>
            <p className="text-blue-200 text-sm mt-1">Leading the curve ahead</p>
          </div>

          <div className="p-8">
            {/* Debug Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Debug</h3>
              <button
                type="button"
                onClick={() => {
                  console.log('🧹 [DEBUG] Nettoyage manuel localStorage');
                  localStorage.clear();
                  window.location.reload();
                }}
                className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 mr-2"
              >
                Clear All Storage
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('🔍 [DEBUG] État localStorage:', localStorage.getItem('gas_current_user'));
                }}
                className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
              >
                Check Storage
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'utilisateur
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Système de gestion ERP pour la sécurité privée
              </p>
            </div>

            {/* Development credentials hint */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600 text-center">
                <strong>Identifiants par défaut:</strong><br />
                Utilisateur: <code className="bg-blue-100 px-1 rounded">admin</code><br />
                Mot de passe: <code className="bg-blue-100 px-1 rounded">admin123</code>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-blue-100 text-sm">
            Version 2.0 - Janvier 2026
          </p>
        </div>
      </div>
    </div>
  );
}
