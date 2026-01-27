import React, { useState, useRef } from 'react';
import { Upload, X, File, Image, Eye, Download } from 'lucide-react';

interface FileUploadProps {
  label: string;
  accept: string;
  currentFile?: string;
  onFileSelect: (file: File | null) => void;
  onFileRemove?: () => void;
  type?: 'image' | 'document';
  maxSize?: number; // in MB
  required?: boolean;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept,
  currentFile,
  onFileSelect,
  onFileRemove,
  type = 'document',
  maxSize = 5,
  required = false,
  disabled = false
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (disabled) return;
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`Le fichier est trop volumineux. Taille maximale: ${maxSize}MB`);
      return;
    }

    // Create preview for images
    if (type === 'image' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemove = () => {
    if (disabled) return;
    
    setPreview(null);
    onFileSelect(null);
    if (onFileRemove) {
      onFileRemove();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const getFileIcon = () => {
    if (type === 'image') {
      return <Image className="w-8 h-8 text-blue-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'Fichier';
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Current file display */}
      {currentFile && !preview && (
        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            {getFileIcon()}
            <div>
              <p className="text-sm font-medium text-gray-900">{getFileName(currentFile)}</p>
              <p className="text-xs text-gray-500">Fichier actuel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.open(currentFile, '_blank')}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Voir le fichier"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className={`p-1 ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-800'}`}
              title={disabled ? 'Modification désactivée' : 'Supprimer'}
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Image preview */}
      {preview && type === 'image' && (
        <div className="relative">
          <img
            src={preview}
            alt="Aperçu"
            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            className={`absolute -top-2 -right-2 p-1 rounded-full ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'} text-white`}
            disabled={disabled}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Upload area */}
      {!currentFile && !preview && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            disabled 
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : dragOver
              ? 'border-blue-400 bg-blue-50 cursor-pointer'
              : 'border-gray-300 hover:border-gray-400 cursor-pointer'
          }`}
          onDrop={disabled ? undefined : handleDrop}
          onDragOver={disabled ? undefined : (e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={disabled ? undefined : () => setDragOver(false)}
          onClick={disabled ? undefined : openFileDialog}
        >
          <Upload className={`w-8 h-8 mx-auto mb-2 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
          <p className={`text-sm mb-1 ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
            {disabled ? 'Modification désactivée' : 'Cliquez pour sélectionner ou glissez-déposez'}
          </p>
          <p className={`text-xs ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
            {accept} • Max {maxSize}MB
          </p>
        </div>
      )}

      {/* Replace file button */}
      {(currentFile || preview) && (
        <button
          type="button"
          onClick={openFileDialog}
          className={`w-full px-3 py-2 text-sm border rounded-lg ${
            disabled 
              ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'text-blue-600 border-blue-300 hover:bg-blue-50'
          }`}
          disabled={disabled}
        >
          {disabled ? 'Modification désactivée' : 'Remplacer le fichier'}
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};

export default FileUpload;