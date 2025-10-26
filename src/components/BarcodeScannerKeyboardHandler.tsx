import React from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const BarcodeScannerKeyboardHandler: React.FC = () => {
  useKeyboardShortcuts();
  return null; // This component doesn't render anything
};

export default BarcodeScannerKeyboardHandler;
