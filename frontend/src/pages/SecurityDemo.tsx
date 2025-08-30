import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Clock, RefreshCw, Eye, EyeOff, CheckCircle, XCircle, Info } from 'lucide-react';
import { useAuth, useAuthActions } from '../store/authStore';
import { useTranslation } from '../contexts/LanguageContext';
import { api } from '../lib/api';

const SecurityDemo: React.FC = () => {
  const { tokens } = useAuth();
  const { refreshToken } = useAuthActions();
  const { t } = useTranslation();
  const [tokenStatus, setTokenStatus] = useState<any>(null);
  const [stolenToken, setStolenToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [theftSimulated, setTheftSimulated] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState<Array<{timestamp: Date, reason: string}>>([]);

  useEffect(() => {
    if (tokens?.refresh_token) {
      setStolenToken(tokens.refresh_token);
      checkTokenStatus();
    }
  }, [tokens]);

  useEffect(() => {
    if (tokens?.access_token) {
      startCountdown();
    }
  }, [tokens?.access_token]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefreshEnabled && countdown !== null && countdown < 30) {
      // Auto refresh when 30 seconds or less remaining
      handleAutoRefresh();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown, autoRefreshEnabled]);

  const startCountdown = () => {
    if (!tokens?.access_token) return;

    const updateCountdown = () => {
      try {
        // Simple JWT decode for demo (in production, use proper JWT library)
        const payload = JSON.parse(atob(tokens.access_token.split('.')[1]));
        const expiryTime = payload.exp * 1000;
        const currentTime = Date.now();
        const timeLeft = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));
        
        setCountdown(timeLeft);
      } catch (error) {
        setCountdown(0);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  };

  const checkTokenStatus = async () => {
    if (!tokens?.refresh_token) return;
    
    try {
      const response = await fetch(`http://localhost:8080/api/v1/security/token-status?refresh_token=${tokens.refresh_token}`);
      const data = await response.json();
      if (data.success) {
        setTokenStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to check token status:', error);
    }
  };

  const simulateTokenTheft = async () => {
    if (!stolenToken) return;

    try {
      const response = await api.simulateTokenTheft(stolenToken);
      if (response.success) {
        setTheftSimulated(true);
        await checkTokenStatus();

        alert('🚨 Token Çalınma Simülasyonu: Tüm token ailesi güvenlik için iptal edildi!\n\nGüvenlik için oturum sonlandırılıyor...');
        
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth-store');
        
        window.dispatchEvent(new CustomEvent('tokenRevoked', { 
          detail: { reason: 'Token theft simulation' } 
        }));

        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to simulate token theft:', error);
      alert('Token çalınma simülasyonu başarısız oldu.');
    }
  };

  const handleAutoRefresh = async () => {
    try {
      await refreshToken();
      setRefreshHistory(prev => [...prev, {
        timestamp: new Date(),
        reason: 'Otomatik yenileme (token süresi dolmadan önce)'
      }]);
      await checkTokenStatus();
    } catch (error) {
      console.error('Auto refresh failed:', error);
      setRefreshHistory(prev => [...prev, {
        timestamp: new Date(),
        reason: 'Otomatik yenileme başarısız - yeniden giriş gerekli'
      }]);
    }
  };

  const handleManualRefresh = async () => {
    try {
      await refreshToken();
      setRefreshHistory(prev => [...prev, {
        timestamp: new Date(),
        reason: 'Manuel yenileme'
      }]);
      await checkTokenStatus();
    } catch (error) {
      console.error('Manual refresh failed:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (!countdown) return 'red';
    if (countdown < 30) return 'red';
    if (countdown < 60) return 'yellow';
    return 'green';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Güvenlik Demo</h1>
            <p className="text-gray-600 mt-1">Token güvenlik senaryoları ve otomatik yenileme</p>
          </div>
          <Shield className="h-12 w-12 text-red-600" />
        </div>
      </div>

      {/* Token Expiry Countdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Access Token Süresi</h2>
          </div>
          <div className="flex items-center space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefreshEnabled}
                onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Otomatik Yenileme</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-4xl font-bold ${
              getStatusColor() === 'green' ? 'text-green-600' :
              getStatusColor() === 'yellow' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {countdown !== null ? formatTime(countdown) : '--:--'}
            </div>
            <p className="text-sm text-gray-500 mt-1">Kalan Süre</p>
          </div>

          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">2:00</div>
            <p className="text-sm text-gray-500 mt-1">Toplam Süre</p>
          </div>

          <div className="text-center">
            <button
              onClick={handleManualRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2 inline" />
              Manuel Yenile
            </button>
          </div>
        </div>

        {countdown !== null && countdown < 30 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-700">
                ⚠️ Token süreniz çok kısa! {autoRefreshEnabled ? 'Otomatik yenileme aktif.' : 'Manuel yenileme yapın.'}
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Token Çalınma Simülasyonu</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mevcut Refresh Token
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={stolenToken}
                  onChange={(e) => setStolenToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                  placeholder="Refresh token buraya yapıştırın"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  {showToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={simulateTokenTheft}
              disabled={!stolenToken || theftSimulated}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              🚨 Token Çalınmasını Simüle Et
            </button>

            <button
              onClick={() => {setTheftSimulated(false); checkTokenStatus();}}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Simülasyonu Sıfırla
            </button>
          </div>

          {theftSimulated && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <XCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Güvenlik İhlali Tespit Edildi!</h3>
                  <div className="text-sm text-red-700 mt-1 space-y-1">
                    <p>• Token ailesi tamamen iptal edildi</p>
                    <p>• Tüm ilgili oturumlar sonlandırıldı</p>
                    <p>• Kullanıcı yeniden giriş yapmalı</p>
                    <p>• Güvenlik günlüğüne kaydedildi</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Token Status */}
      {tokenStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Info className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Token Durumu</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Geçerli:</span>
                <div className="flex items-center">
                  {tokenStatus.valid ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`ml-2 text-sm ${tokenStatus.valid ? 'text-green-600' : 'text-red-600'}`}>
                    {tokenStatus.valid ? 'Evet' : 'Hayır'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">İptal Edildi:</span>
                <span className={`text-sm ${tokenStatus.revoked ? 'text-red-600' : 'text-green-600'}`}>
                  {tokenStatus.revoked ? 'Evet' : 'Hayır'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Süresi Doldu:</span>
                <span className={`text-sm ${tokenStatus.expired ? 'text-red-600' : 'text-green-600'}`}>
                  {tokenStatus.expired ? 'Evet' : 'Hayır'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Token Ailesi:</span>
                <p className="text-sm text-gray-900 font-mono break-all">{tokenStatus.token_family}</p>
              </div>

              <div>
                <span className="text-sm text-gray-500">Süre Dolum:</span>
                <p className="text-sm text-gray-900">
                  {new Date(tokenStatus.expires_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refresh History */}
      {refreshHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <RefreshCw className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Token Yenileme Geçmişi</h2>
          </div>

          <div className="space-y-2">
            {refreshHistory.slice(-5).reverse().map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-900">{entry.reason}</span>
                <span className="text-sm text-gray-500">{entry.timestamp.toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <Info className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Senaryoları</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <strong>Kısa Token Süresi:</strong> Access token 2 dakikada süresi doluyor</p>
              <p>• <strong>Otomatik Yenileme:</strong> Son 30 saniyede otomatik refresh</p>
              <p>• <strong>Token Çalınma:</strong> Tüm aile iptal edilir, yeniden giriş gerekir</p>
              <p>• <strong>Güvenlik Takibi:</strong> Her işlem gerçek zamanlı izlenir</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDemo;
