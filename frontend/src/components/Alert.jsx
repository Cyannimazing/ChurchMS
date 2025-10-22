import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  onClose, 
  className = '', 
  autoClose = true,
  autoCloseDelay = 5000, // 5 seconds default
  action // { text: 'Button Text', onClick: () => {} }
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: CheckCircle,
          iconColor: 'text-green-400'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: XCircle,
          iconColor: 'text-red-400'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: AlertTriangle,
          iconColor: 'text-yellow-400'
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: AlertTriangle,
          iconColor: 'text-blue-400'
        };
    }
  };

  const { container, icon: Icon, iconColor } = getAlertStyles();

  // Show animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Handle smooth close
  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 200); // Wait for animation to complete
  };

  // Auto-dismiss functionality
  useEffect(() => {
    if (autoClose && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay]);

  return (
    <div className={`border rounded-lg p-4 transition-all duration-200 ease-in-out transform ${
      isVisible && !isLeaving 
        ? 'opacity-100 translate-y-0 scale-100' 
        : 'opacity-0 -translate-y-2 scale-95'
    } ${container} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium">
              {title}
            </h3>
          )}
          {message && (
            <div className={`text-sm ${title ? 'mt-1' : ''}`}>
              {message}
            </div>
          )}
          {action && (
            <div className="mt-3">
              <button
                onClick={action.onClick}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-xs leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 ${
                  type === 'success' ? 'text-green-800 bg-green-100 hover:bg-green-200 focus:ring-green-500' :
                  type === 'error' ? 'text-red-800 bg-red-100 hover:bg-red-200 focus:ring-red-500' :
                  type === 'warning' ? 'text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500' :
                  'text-blue-800 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500'
                }`}
              >
                {action.text}
              </button>
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={handleClose}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 ${
                  type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' :
                  type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' :
                  type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600' :
                  'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
                }`}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
