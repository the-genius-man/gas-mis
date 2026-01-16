import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { X, Camera, CameraOff, Search, AlertCircle } from 'lucide-react';

interface QRCodeScannerProps {
  onScan: (equipmentCode: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ 
  onScan, 
  onClose
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setError(null);
    
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        { facingMode: 'environment' },
        config,
        handleScanSuccess,
        handleScanError
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Impossible d\'accéder à la caméra. Vérifiez les permissions.'
      );
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  const handleScanSuccess = (decodedText: string) => {
    // Avoid duplicate scans
    if (decodedText === lastScannedCode) return;
    
    setLastScannedCode(decodedText);
    onScan(decodedText);
    
    // Optionally stop scanning after successful scan
    stopScanner();
  };

  const handleScanError = (errorMessage: string) => {
    // Ignore "No QR code found" errors during scanning
    if (!errorMessage.includes('No QR code found')) {
      console.warn('QR scan error:', errorMessage);
    }
  };

  const handleManualSearch = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Scanner QR Code</h3>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Camera Scanner */}
          <div className="mb-6">
            <div 
              id="qr-reader" 
              ref={containerRef}
              className={`w-full aspect-square bg-gray-100 rounded-lg overflow-hidden ${
                !isScanning ? 'flex items-center justify-center' : ''
              }`}
            >
              {!isScanning && !error && (
                <div className="text-center text-gray-500">
                  <Camera className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Cliquez sur "Démarrer" pour scanner</p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700">{error}</p>
                  <p className="text-xs text-red-500 mt-1">
                    Utilisez la recherche manuelle ci-dessous.
                  </p>
                </div>
              </div>
            )}

            {/* Scanner Controls */}
            <div className="mt-4 flex justify-center">
              {!isScanning ? (
                <button
                  onClick={startScanner}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Démarrer la caméra
                </button>
              ) : (
                <button
                  onClick={stopScanner}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <CameraOff className="w-4 h-4" />
                  Arrêter la caméra
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          {/* Manual Code Entry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche manuelle par code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Entrez le code équipement..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleManualSearch}
                disabled={!manualCode.trim()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Last Scanned */}
          {lastScannedCode && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                <span className="font-medium">Dernier code scanné:</span>{' '}
                <span className="font-mono">{lastScannedCode}</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            Positionnez le QR code dans le cadre pour le scanner automatiquement
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;
