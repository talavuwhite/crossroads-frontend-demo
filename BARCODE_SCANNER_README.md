# Global Barcode Scanner Functionality

This document describes the new global barcode scanning functionality that has been implemented in the property rental management system.

## Overview

The global barcode scanner allows users to scan barcodes from anywhere in the application and automatically find and navigate to the corresponding case. This functionality is accessible through multiple methods:

1. **Floating Action Button (FAB)** - A purple circular button in the bottom-right corner
2. **Keyboard Shortcut** - Press `Ctrl+B` (or `Cmd+B` on Mac) to open the scanner
3. **Case Selection Wizard** - The "Scan Barcode" button in case selection modals

## Features

### 🔍 **Global Access**

- Available from any page in the application
- Floating action button always visible (except on authentication pages)
- Keyboard shortcut for quick access

### 📱 **Camera Integration**

- Uses device camera to scan barcodes
- Supports multiple barcode formats (QR, Code 128, Code 39, etc.)
- Automatic camera detection and initialization

### 🎯 **Smart Case Detection**

- Scans barcode and extracts case ID
- Automatically searches for the case in the database
- Navigates directly to the case details page on successful match

### ⚡ **User Experience**

- Real-time camera preview
- Loading states and error handling
- Success notifications with case name
- Automatic modal closure after successful scan

## Technical Implementation

### Components

1. **BarcodeScannerContext** (`src/contexts/BarcodeScannerContext.tsx`)

   - Manages global scanner state
   - Handles barcode processing and case lookup
   - Provides navigation to case details

2. **GlobalBarcodeScannerHandler** (`src/components/GlobalBarcodeScannerHandler.tsx`)

   - Camera integration using ZXing library
   - Real-time barcode detection
   - Error handling and user feedback

3. **BarcodeScannerFAB** (`src/components/BarcodeScannerFAB.tsx`)

   - Floating action button for quick access
   - Positioned in bottom-right corner
   - Responsive design with hover effects

4. **useKeyboardShortcuts** (`src/hooks/useKeyboardShortcuts.ts`)
   - Keyboard shortcut handling
   - Ctrl/Cmd + B to open scanner

### Dependencies

- `@zxing/library` - Barcode scanning library
- `@zxing/browser` - Browser-specific ZXing utilities
- React Router - Navigation to case details
- React Toastify - User notifications

## Usage

### For Users

1. **Using the FAB**: Click the purple barcode icon in the bottom-right corner
2. **Using Keyboard**: Press `Ctrl+B` (Windows/Linux) or `Cmd+B` (Mac)
3. **In Case Selection**: Click "Scan Barcode" in case selection modals

### For Developers

The barcode scanner is automatically available throughout the application. To use it in custom components:

```tsx
import { useBarcodeScanner } from "@/contexts/BarcodeScannerContext";

const MyComponent = () => {
  const { openScanner } = useBarcodeScanner();

  return <button onClick={openScanner}>Scan Barcode</button>;
};
```

## API Integration

The scanner integrates with the existing case API:

- Uses `fetchCaseById` from `@/services/CaseApi`
- Automatically navigates to `/cases/{caseId}`
- Handles errors gracefully with user-friendly messages

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (requires HTTPS for camera access)
- **Mobile browsers**: Full support with camera permissions

## Security Considerations

- Camera access requires user permission
- HTTPS required for camera access in production
- Barcode data is processed locally and not stored
- Case lookup uses existing authentication and authorization

## Error Handling

The scanner handles various error scenarios:

- **No camera found**: Shows error message with retry option
- **Permission denied**: Guides user to enable camera permissions
- **Invalid barcode**: Shows error message
- **Case not found**: Shows error message with suggestion to check barcode
- **Network errors**: Shows generic error message

## Future Enhancements

Potential improvements for future versions:

1. **Barcode History**: Store recently scanned barcodes
2. **Multiple Camera Support**: Allow users to choose camera
3. **Offline Support**: Cache recently accessed cases
4. **Barcode Generation**: Generate barcodes for cases
5. **Batch Scanning**: Scan multiple barcodes at once

## Troubleshooting

### Common Issues

1. **Camera not working**: Check browser permissions and HTTPS requirement
2. **Scanner not opening**: Ensure user is authenticated
3. **Case not found**: Verify barcode format and case ID validity
4. **Performance issues**: Check device camera quality and lighting

### Debug Mode

Enable debug logging by checking browser console for detailed error messages during scanning operations.
