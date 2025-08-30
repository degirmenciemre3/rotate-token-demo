import { useState, useEffect } from 'react';
import { 
  Shield, 
  RefreshCw, 
  Clock, 
  User, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Play,
  Activity
} from 'lucide-react';
import { useAuth, useAuthActions } from '../store/authStore';
import { useTranslation } from '../contexts/LanguageContext';
import { api } from '../lib/api';
import { jwtDecode } from 'jwt-decode';

export default function Dashboard() {
  const { user, tokens } = useAuth();
  const { refreshToken } = useAuthActions();
  const { t } = useTranslation();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null);

  useEffect(() => {
    loadTokenInfo();
    startExpiryCountdown();
  }, [tokens]);

  const loadTokenInfo = async () => {
    if (!tokens) return;
    
    try {
      const info = await api.getTokenInfo(tokens.refresh_token);
      setTokenInfo(info);
    } catch (error) {
      console.error('Failed to load token info:', error);
    }
  };

  const startExpiryCountdown = () => {
    if (!tokens?.access_token) return;

    const updateCountdown = () => {
      try {
        const decoded: any = jwtDecode(tokens.access_token);
        const expiryTime = decoded.exp * 1000;
        const currentTime = Date.now();
        const timeLeft = expiryTime - currentTime;
        
        setTimeUntilExpiry(timeLeft > 0 ? timeLeft : 0);
      } catch (error) {
        setTimeUntilExpiry(0);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshToken();
      setLastRefresh(new Date());
      loadTokenInfo();
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (milliseconds: number) => {
    if (milliseconds <= 0) return t('dashboard.expired');
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getTokenStatus = () => {
    if (!timeUntilExpiry) return { status: 'unknown', color: 'gray' };
    
    if (timeUntilExpiry <= 0) {
      return { status: 'expired', color: 'red' };
    } else if (timeUntilExpiry < 5 * 60 * 1000) {
      return { status: 'expiring', color: 'yellow' };
    } else {
      return { status: 'valid', color: 'green' };
    }
  };

  const tokenStatus = getTokenStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('dashboard.welcomeBack')}, {user?.username}!
            </h1>
            <p className="text-gray-600 mt-1">
              {t('dashboard.jwtDemoTitle')}
            </p>
          </div>
          <Shield className="h-12 w-12 text-primary-600" />
        </div>
      </div>

      {/* Token Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Access Token Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              tokenStatus.color === 'green' ? 'bg-green-100' :
              tokenStatus.color === 'yellow' ? 'bg-yellow-100' :
              tokenStatus.color === 'red' ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              {tokenStatus.status === 'valid' && <CheckCircle className="h-6 w-6 text-green-600" />}
              {tokenStatus.status === 'expiring' && <AlertTriangle className="h-6 w-6 text-yellow-600" />}
              {tokenStatus.status === 'expired' && <AlertTriangle className="h-6 w-6 text-red-600" />}
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">{t('dashboard.accessToken')}</h3>
              <p className={`text-sm ${
                tokenStatus.color === 'green' ? 'text-green-600' :
                tokenStatus.color === 'yellow' ? 'text-yellow-600' :
                tokenStatus.color === 'red' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {tokenStatus.status === 'valid' ? t('dashboard.valid') :
                 tokenStatus.status === 'expiring' ? t('dashboard.expiringSoon') :
                 tokenStatus.status === 'expired' ? t('dashboard.expired') : t('dashboard.unknown')}
              </p>
            </div>
          </div>
        </div>

        {/* Time Until Expiry */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">{t('dashboard.expiresIn')}</h3>
              <p className="text-sm text-blue-600 font-mono">
                {timeUntilExpiry !== null ? formatTime(timeUntilExpiry) : t('dashboard.loading')}
              </p>
            </div>
          </div>
        </div>

        {/* Token Rotation */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <RefreshCw className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">{t('dashboard.tokenRotation')}</h3>
              <p className="text-sm text-purple-600">
                {tokenInfo?.token_rotation_enabled ? t('dashboard.enabled') : t('dashboard.disabled')}
              </p>
            </div>
          </div>
        </div>

        {/* User Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">{t('dashboard.session')}</h3>
              <p className="text-sm text-indigo-600">{t('dashboard.active')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.tokenManagement')}</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? t('dashboard.refreshing') : t('dashboard.manualRefresh')}
          </button>

          <button
            onClick={() => window.open('/token-info', '_blank')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Info className="h-4 w-4 mr-2" />
            {t('dashboard.viewTokenDetails')}
          </button>

          <button
            onClick={() => window.open('/test', '_blank')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Play className="h-4 w-4 mr-2" />
            {t('dashboard.testProtectedRoute')}
          </button>
        </div>

        {lastRefresh && (
          <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
            <p className="text-sm text-green-700">
              {t('dashboard.lastManualRefresh')}: {lastRefresh.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.userInformation')}</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">{t('dashboard.userId')}</label>
              <p className="text-sm text-gray-900 font-mono">{user?.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('common.username')}</label>
              <p className="text-sm text-gray-900">{user?.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('common.email')}</label>
              <p className="text-sm text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('dashboard.accountCreated')}</label>
              <p className="text-sm text-gray-900">
                {user?.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Token Family Info */}
        {tokenInfo?.token_family && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.tokenFamily')}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('dashboard.familyId')}</label>
                <p className="text-sm text-gray-900 font-mono break-all">{tokenInfo.token_family}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('dashboard.rotationStatus')}</label>
                <p className="text-sm text-gray-900">
                  {tokenInfo.token_rotation_enabled ? t('dashboard.active') : t('dashboard.disabled')}
                </p>
              </div>
              <div className="text-xs text-gray-500">
                {t('dashboard.tokenFamilyDesc')}
              </div>
            </div>
          </div>
        )}

        {/* Demo Features */}
        {!tokenInfo?.token_family && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.demoFeatures')}</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm text-gray-900">{t('dashboard.autoTokenRefresh')}</span>
              </div>
              <div className="flex items-center">
                <RefreshCw className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm text-gray-900">{t('dashboard.tokenRotationSecurity')}</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm text-gray-900">{t('dashboard.protectedRouteHandling')}</span>
              </div>
              <div className="flex items-center">
                <Info className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="text-sm text-gray-900">{t('dashboard.realtimeTokenMonitoring')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
