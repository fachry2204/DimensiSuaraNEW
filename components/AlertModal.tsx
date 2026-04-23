import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
}

export const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message, type = 'error' }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'error': return <AlertTriangle className="text-red-500" size={24} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={24} />;
      case 'success': return <AlertTriangle className="text-green-500" size={24} />; // Using generic icon for now, can be CheckCircle
      default: return <AlertTriangle className="text-blue-500" size={24} />;
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'success': return 'text-green-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden transform transition-all scale-100 animate-scale-in">
        <div className="p-5 text-center">
          <div className="flex justify-center mb-3">
            <div className={`p-2 rounded-full bg-opacity-10 ${type === 'error' ? 'bg-red-100' : 'bg-gray-100'}`}>
              {getIcon()}
            </div>
          </div>
          
          <h3 className={`text-base font-bold mb-1 ${getHeaderColor()}`}>
            {title}
          </h3>
          
          <p className="text-slate-600 text-xs mb-4 leading-relaxed">
            {message}
          </p>
          
          <button
            onClick={onClose}
            className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              type === 'error' 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
