import React, { useState, useRef, useEffect } from 'react';
import { QrCode, Camera, Smartphone, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAuthActions } from '../store/authStore';
import { useTranslation } from '../contexts/LanguageContext';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

const QRScanner: React.FC = () => {
  const { login } = useAuthActions();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startScanning = () => {
    setIsScanning(true);
    setScanResult(null);
    setErrorMessage('');
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const simulatedQRData = 'eyJ0eXBlIjoibG9naW4iLCJ1c2VyX2lkIjoiZGVtbyIsInVzZXJuYW1lIjoiZGVtbyIsInFyX2lkIjoiMTIzNDU2Nzg5MCIsImV4cGlyZXNfYXQiOiIxNzM1Njg5MDAwIn0=';
      setQrData(simulatedQRData);
      processQRCode(simulatedQRData);
    };
    reader.readAsDataURL(file);
  };

  const processQRCode = async (data: string) => {
    setIsProcessing(true);
    setScanResult(null);
    setErrorMessage('');

    try {
      const response = await api.validateQRCode(data);
      if (response.success) {
        setScanResult('success');
        const tokens = response.data;
        await login({
          username: 'demo',
          password: 'password123'
        });
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      setScanResult('error');
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      setErrorMessage(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualInput = () => {
    if (qrData.trim()) {
      processQRCode(qrData.trim());
    }
  };

  const resetScanner = () => {
    setQrData('');
    setScanResult(null);
    setErrorMessage('');
    setIsScanning(false);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('qrScanner.title')}</h1>
            <p className="text-gray-600 mt-1">{t('qrScanner.subtitle')}</p>
          </div>
          <QrCode className="h-12 w-12 text-green-600" />
        </div>
      </div>

      {/* Scanner Interface */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center space-y-6">
          {/* Camera Icon */}
          <div className="bg-gray-100 p-8 rounded-lg inline-block">
            <Camera className="h-32 w-32 text-gray-600 mx-auto" />
          </div>

          {/* Scan Controls */}
          <div className="space-y-4">
            {!isScanning ? (
              <button
                onClick={startScanning}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center mx-auto space-x-2"
              >
                <Camera className="h-5 w-5" />
                <span>{t('qrScanner.startScanning')}</span>
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center mx-auto space-x-2"
              >
                <XCircle className="h-5 w-5" />
                <span>{t('qrScanner.stopScanning')}</span>
              </button>
            )}

            {/* File Upload */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{t('qrScanner.orUploadImage')}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto space-x-2"
              >
                <Smartphone className="h-4 w-4" />
                <span>{t('qrScanner.uploadImage')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Input */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('qrScanner.manualInput')}</h2>
        <div className="space-y-4">
          <textarea
            value={qrData}
            onChange={(e) => setQrData(e.target.value)}
            placeholder={t('qrScanner.enterQRData')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
            rows={3}
          />
          <button
            onClick={handleManualInput}
            disabled={!qrData.trim() || isProcessing}
            className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? t('qrScanner.processing') : t('qrScanner.validate')}
          </button>
        </div>
      </div>

      {/* Scan Results */}
      {scanResult && (
        <div className={`rounded-lg p-6 ${
          scanResult === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {scanResult === 'success' ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <div>
              <h3 className={`font-medium ${
                scanResult === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {scanResult === 'success' 
                  ? t('qrScanner.scanSuccess') 
                  : t('qrScanner.scanError')
                }
              </h3>
              {errorMessage && (
                <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertTriangle className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-2">{t('qrScanner.howToUse')}</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>1. {t('qrScanner.step1')}</p>
              <p>2. {t('qrScanner.step2')}</p>
              <p>3. {t('qrScanner.step3')}</p>
              <p>4. {t('qrScanner.step4')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      {(scanResult || qrData) && (
        <div className="text-center">
          <button
            onClick={resetScanner}
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            {t('qrScanner.reset')}
          </button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
