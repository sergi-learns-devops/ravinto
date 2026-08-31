'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';
import { Button } from './Button';
import { useTranslation } from '@/i18n';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<any>(null);
  const { t } = useTranslation();

  useEffect(() => {
    let scanner: any = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        scanner = new Html5Qrcode('barcode-reader');
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.5,
          },
          (decodedText: string) => {
            // Barcode detected
            scanner.stop().catch(() => {});
            onScan(decodedText);
          },
          () => {
            // Scan error (ignore, keep scanning)
          }
        );
      } catch (err) {
        setError(t.scanner_error);
      }
    };

    startScanner();

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5" />
          <span className="font-medium text-sm">{t.scanner_title}</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Scanner viewport */}
      <div className="flex-1 flex items-center justify-center px-4">
        {error ? (
          <div className="text-center">
            <p className="text-white/70 text-sm mb-4">{error}</p>
            <Button variant="secondary" onClick={onClose}>{t.scanner_close}</Button>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div
              id="barcode-reader"
              ref={scannerRef}
              className="rounded-2xl overflow-hidden"
            />
            <p className="text-center text-white/50 text-xs mt-4">
              {t.scanner_hint}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
