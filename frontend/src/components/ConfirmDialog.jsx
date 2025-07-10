import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger" // danger, warning, info
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className={`h-6 w-6 ${
              type === 'danger' ? 'text-red-600' : 
              type === 'warning' ? 'text-yellow-600' : 
              'text-blue-600'
            }`} />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              {title}
            </h3>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            {message}
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={type === 'danger' || type === 'warning' ? 'danger' : 'primary'}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
