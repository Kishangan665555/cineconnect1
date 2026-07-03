import React from 'react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toast } = useApp();
  if (!toast) return null;

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl text-white shadow-2xl ${colors[toast.type]} animate-slideIn`}>
      <span className="text-lg font-bold">{icons[toast.type]}</span>
      <span className="font-medium">{toast.message}</span>
    </div>
  );
};
