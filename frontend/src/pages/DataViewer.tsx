import React, { useState, useEffect } from 'react';
import { Database, Users, Key, QrCode, BarChart3, RefreshCw, Eye, EyeOff, Search } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { api } from '../lib/api';

interface DatabaseView {
  users: Array<{
    id: string;
    username: string;
    email: string;
    created_at: string;
    last_login?: string;
  }>;
  tokens: Array<{
    token: string;
    user_id: string;
    token_family: string;
    created_at: string;
    expires_at: string;
    is_revoked: boolean;
  }>;
  qr_codes: Array<{
    id: string;
    user_id: string;
    created_at: string;
    expires_at: string;
    is_used: boolean;
    used_at?: string;
    ip_address?: string;
  }>;
  stats: {
    total_users: number;
    active_tokens: number;
    revoked_tokens: number;
    expired_tokens: number;
    active_qr_codes: number;
    used_qr_codes: number;
    expired_qr_codes: number;
  };
  timestamp: string;
}

const DataViewer: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<DatabaseView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tokens' | 'qrCodes'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getDatabaseView();
      if (response.success) {
        const safeData = {
          ...response.data,
          users: response.data.users || [],
          tokens: response.data.tokens || [],
          qr_codes: response.data.qr_codes || []
        };
        setData(safeData);
      } else {
        setError(response.error || 'Failed to fetch data');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const maskSensitiveData = (data: string, show: boolean) => {
    if (!data) return 'N/A';
    if (show) return data;
    return data.length > 8 ? `${data.substring(0, 8)}...` : '***';
  };

  const filteredUsers = (data?.users || []).filter(user => 
    user && user.username && user.email &&
    (user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredTokens = (data?.tokens || []).filter(token => 
    token && token.user_id && token.token_family &&
    (token.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.token_family.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredQRCodes = (data?.qr_codes || []).filter(qr => 
    qr && qr.user_id && qr.id &&
    (qr.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qr.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('dataViewer.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Database className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('dataViewer.error')}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            {t('dataViewer.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('dataViewer.title')}</h1>
            <p className="text-gray-600 mt-1">{t('dataViewer.subtitle')}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showSensitiveData ? t('dataViewer.hideData') : t('dataViewer.showData')}</span>
            </button>
            <button
              onClick={fetchData}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{t('dataViewer.refresh')}</span>
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {t('dataViewer.lastUpdated')}: {formatDate(data.timestamp)}
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('dataViewer.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: t('dataViewer.overview'), icon: BarChart3 },
              { id: 'users', label: t('dataViewer.users'), icon: Users },
              { id: 'tokens', label: t('dataViewer.tokens'), icon: Key },
              { id: 'qrCodes', label: t('dataViewer.qrCodes'), icon: QrCode }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-600">{t('dataViewer.totalUsers')}</p>
                    <p className="text-2xl font-bold text-blue-900">{data.stats.total_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <Key className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-600">{t('dataViewer.activeTokens')}</p>
                    <p className="text-2xl font-bold text-green-900">{data.stats.active_tokens}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <Key className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-red-600">{t('dataViewer.revokedTokens')}</p>
                    <p className="text-2xl font-bold text-red-900">{data.stats.revoked_tokens}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <QrCode className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-600">{t('dataViewer.activeQRCodes')}</p>
                    <p className="text-2xl font-bold text-purple-900">{data.stats.active_qr_codes}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dataViewer.user')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dataViewer.email')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dataViewer.createdAt')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dataViewer.lastLogin')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    user && (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.username || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{maskSensitiveData(user.id || '', showSensitiveData)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.created_at ? formatDate(user.created_at) : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.last_login ? formatDate(user.last_login) : '-'}
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tokens Tab */}
          {activeTab === 'tokens' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dataViewer.token')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dataViewer.userId')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dataViewer.family')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dataViewer.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dataViewer.expiresAt')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTokens.map((token) => (
                    token && (
                      <tr key={token.token}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {maskSensitiveData(token.token || '', showSensitiveData)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {maskSensitiveData(token.user_id || '', showSensitiveData)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {maskSensitiveData(token.token_family || '', showSensitiveData)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            token.is_revoked
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {token.is_revoked ? t('dataViewer.revoked') : t('dataViewer.active')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{token.expires_at ? formatDate(token.expires_at) : 'N/A'}</td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* QR Codes Tab */}
          {activeTab === 'qrCodes' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dataViewer.qrId')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dataViewer.userId')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dataViewer.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dataViewer.createdAt')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dataViewer.expiresAt')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dataViewer.usedAt')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredQRCodes.map((qr) => (
                    qr && (
                      <tr key={qr.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {maskSensitiveData(qr.id || '', showSensitiveData)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {maskSensitiveData(qr.user_id || '', showSensitiveData)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            qr.is_used
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {qr.is_used ? t('dataViewer.used') : t('dataViewer.active')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{qr.created_at ? formatDate(qr.created_at) : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{qr.expires_at ? formatDate(qr.expires_at) : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {qr.used_at ? formatDate(qr.used_at) : '-'}
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataViewer;
