import React, { useState, useEffect } from 'react';
import { QrCode, Download, RefreshCw, Clock, User, Copy, CheckCircle } from 'lucide-react';
import { useAuth } from '../store/authStore';
import { useTranslation } from '../contexts/LanguageContext';
import { api } from '../lib/api';

interface QRCodeResponse {
  id: string;
  qr_data: string;
  expires_at: string;
  message: string;
}

const QRGeneration: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [qrCode, setQrCode] = useState<QRCodeResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (qrCode) {
      startCountdown();
    }
  }, [qrCode]);

  const startCountdown = () => {
    if (!qrCode) return;

    const updateCountdown = () => {
      const expiryTime = new Date(qrCode.expires_at).getTime();
      const currentTime = Date.now();
      const timeLeft = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));
      
      setCountdown(timeLeft);
      
      if (timeLeft <= 0) {
        setQrCode(null);
        setCountdown(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  };

  const generateQRCode = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const response = await api.generateQRCode();
      if (response.success) {
        setQrCode(response.data);
        setCopied(false);
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyQRData = async () => {
    if (!qrCode) return;
    
    try {
      await navigator.clipboard.writeText(qrCode.qr_data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy QR data:', error);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;
    
    // Create a canvas element to generate QR code
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 300;
    canvas.height = 300;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 300, 300);
    
    // Add text
    ctx.fillStyle = 'black';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    
    const lines = [
      'QR Code Data:',
      qrCode.qr_data.substring(0, 20) + '...',
      'Expires: ' + new Date(qrCode.expires_at).toLocaleTimeString(),
      'User: ' + user.username
    ];
    
    lines.forEach((line, index) => {
      ctx.fillText(line, 150, 120 + (index * 20));
    });

    const link = document.createElement('a');
    link.download = `qr-code-${user.username}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('qrGeneration.title')}</h1>
            <p className="text-gray-600 mt-1">{t('qrGeneration.subtitle')}</p>
          </div>
          <QrCode className="h-12 w-12 text-blue-600" />
        </div>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3">
          <User className="h-6 w-6 text-gray-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('qrGeneration.userInfo')}</h2>
            <p className="text-gray-600">{user?.username} ({user?.email})</p>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <button
            onClick={generateQRCode}
            disabled={isGenerating}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center mx-auto space-x-2"
          >
            {isGenerating ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <QrCode className="h-5 w-5" />
            )}
            <span>{isGenerating ? t('qrGeneration.generating') : t('qrGeneration.generate')}</span>
          </button>
          <p className="text-sm text-gray-500 mt-2">{t('qrGeneration.generateInfo')}</p>
        </div>
      </div>

      {/* QR Code Display */}
      {qrCode && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">{t('qrGeneration.qrCode')}</h2>
            
            {/* QR Code Visual */}
            <div className="bg-gray-100 p-8 rounded-lg inline-block">
              <div className="text-center space-y-2">
                <QrCode className="h-32 w-32 text-gray-800 mx-auto" />
                <div className="text-xs text-gray-600 font-mono break-all max-w-xs">
                  {qrCode.qr_data}
                </div>
              </div>
            </div>

            {/* Countdown */}
            {countdown !== null && (
              <div className="flex items-center justify-center space-x-2">
                <Clock className="h-5 w-5 text-red-600" />
                <span className="text-lg font-semibold text-red-600">
                  {formatTime(countdown)}
                </span>
                <span className="text-gray-600">{t('qrGeneration.timeRemaining')}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={copyQRData}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? t('qrGeneration.copied') : t('qrGeneration.copy')}</span>
              </button>
              
              <button
                onClick={downloadQRCode}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>{t('qrGeneration.download')}</span>
              </button>
            </div>

            {/* Info */}
            <div className="text-sm text-gray-600 space-y-1">
              <p>• {t('qrGeneration.oneTimeUse')}</p>
              <p>• {t('qrGeneration.expiresIn')} 5 {t('qrGeneration.minutes')}</p>
              <p>• {t('qrGeneration.scanToLogin')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <QrCode className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-2">{t('qrGeneration.howToUse')}</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>1. {t('qrGeneration.step1')}</p>
              <p>2. {t('qrGeneration.step2')}</p>
              <p>3. {t('qrGeneration.step3')}</p>
              <p>4. {t('qrGeneration.step4')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRGeneration;
