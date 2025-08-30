import { useState, useEffect } from 'react';
import { RefreshCw, Copy, Check, Clock, Shield, Info } from 'lucide-react';
import { useAuth, useAuthActions } from '../store/authStore';
import { useTranslation } from '../contexts/LanguageContext';
import { api } from '../lib/api';
import type { TokenInfo } from '../types';

export default function TokenInfoPage() {
  const { tokens } = useAuth();
  const { refreshToken } = useAuthActions();
  const { t } = useTranslation();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    loadTokenInfo();
  }, [tokens]);

  const loadTokenInfo = async () => {
    if (!tokens) {
      setIsLoading(false);
      return;
    }

    try {
      const info = await api.getTokenInfo(tokens.refresh_token);
      setTokenInfo(info);
    } catch (error) {
      console.error('Failed to load token info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshToken();
      await loadTokenInfo();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(type);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('tokenInfo.title')}</h1>
            <p className="text-gray-600 mt-1">{t('tokenInfo.subtitle')}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('tokenInfo.refreshNow')}
          </button>
        </div>
      </div>

      {/* Token Rotation Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Shield className="h-6 w-6 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">{t('tokenInfo.securityConfig')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">{t('tokenInfo.tokenRotation')}</label>
            <p className={`text-sm font-medium ${tokenInfo?.token_rotation_enabled ? 'text-green-600' : 'text-red-600'}`}>
              {tokenInfo?.token_rotation_enabled ? t('dashboard.enabled') : t('dashboard.disabled')}
            </p>
          </div>
          {tokenInfo?.token_family && (
            <div>
              <label className="text-sm font-medium text-gray-500">Token Family</label>
              <p className="text-sm text-gray-900 font-mono break-all">{tokenInfo.token_family}</p>
            </div>
          )}
        </div>
      </div>

      {/* Access Token */}
      {tokenInfo?.access_token && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Access Token</h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              tokenInfo.access_token.is_valid 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {tokenInfo.access_token.is_valid ? 'Valid' : 'Invalid'}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-500">Token</label>
                <button
                  onClick={() => copyToClipboard(tokenInfo.access_token.token, 'access')}
                  className="flex items-center text-xs text-gray-500 hover:text-gray-700"
                >
                  {copiedToken === 'access' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <code className="text-xs text-gray-800 break-all">
                  {tokenInfo.access_token.token}
                </code>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Expires At</label>
                <p className="text-sm text-gray-900">{formatDate(tokenInfo.access_token.expires_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <p className="text-sm text-gray-900">{tokenInfo.access_token.type}</p>
              </div>
            </div>

            {tokenInfo.access_token.claims && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Claims</label>
                <div className="bg-gray-50 p-3 rounded-md">
                  <pre className="text-xs text-gray-800 overflow-auto">
                    {JSON.stringify(tokenInfo.access_token.claims, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refresh Token */}
      {tokenInfo?.refresh_token && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <RefreshCw className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Refresh Token</h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              tokenInfo.refresh_token.is_valid 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {tokenInfo.refresh_token.is_valid ? 'Valid' : 'Invalid'}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-500">Token</label>
                <button
                  onClick={() => copyToClipboard(tokenInfo.refresh_token.token, 'refresh')}
                  className="flex items-center text-xs text-gray-500 hover:text-gray-700"
                >
                  {copiedToken === 'refresh' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <code className="text-xs text-gray-800 break-all">
                  {tokenInfo.refresh_token.token}
                </code>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Expires At</label>
                <p className="text-sm text-gray-900">{formatDate(tokenInfo.refresh_token.expires_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <p className="text-sm text-gray-900">{tokenInfo.refresh_token.type}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <Info className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-2">How Token Rotation Works</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• When you refresh a token, the old refresh token is invalidated</p>
              <p>• A new access token and refresh token pair is generated</p>
              <p>• All tokens share the same "family ID" for security tracking</p>
              <p>• If a token replay attack is detected, the entire family is revoked</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
