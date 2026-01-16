import React, { useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, X, Copy, Check } from 'lucide-react';
import { Equipement } from '../../types';

interface QRCodeGeneratorProps {
  equipment: Equipement;
  onClose: () => void;
  size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  equipment, 
  onClose,
  size = 200 
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Generate QR code value - use equipment code or ID
  const qrValue = equipment.qr_code || equipment.code_equipement || equipment.id;

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `QR_${equipment.code_equipement}.png`;
      link.href = url;
      link.click();
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const canvas = canvasRef.current?.querySelector('canvas');
      if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>QR Code - ${equipment.code_equipement}</title>
              <style>
                body {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  margin: 0;
                  font-family: Arial, sans-serif;
                }
                .qr-container {
                  text-align: center;
                  padding: 20px;
                  border: 2px solid #000;
                  border-radius: 8px;
                }
                .qr-code {
                  margin-bottom: 15px;
                }
                .equipment-code {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 5px;
                }
                .equipment-name {
                  font-size: 14px;
                  color: #666;
                }
                @media print {
                  body { margin: 0; }
                }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <div class="qr-code">
                  <img src="${imgData}" alt="QR Code" />
                </div>
                <div class="equipment-code">${equipment.code_equipement}</div>
                <div class="equipment-name">${equipment.designation}</div>
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  window.onafterprint = function() { window.close(); };
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Code QR - Équipement</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* QR Code Display */}
          <div className="flex flex-col items-center mb-6">
            <div 
              ref={canvasRef}
              className="p-4 bg-white border-2 border-gray-200 rounded-lg mb-4"
            >
              <QRCodeCanvas
                value={qrValue}
                size={size}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            
            {/* SVG version for display (hidden, used for reference) */}
            <div className="hidden">
              <QRCodeSVG
                value={qrValue}
                size={size}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Equipment Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Code Équipement</span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copié!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copier
                  </>
                )}
              </button>
            </div>
            <p className="text-lg font-mono font-bold text-gray-900">
              {equipment.code_equipement}
            </p>
            <p className="text-sm text-gray-600 mt-1">{equipment.designation}</p>
            {equipment.categorie && (
              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {equipment.categorie}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger PNG
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
