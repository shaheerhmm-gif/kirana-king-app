// Barcode Scanner Hook
import { useEffect, useRef } from 'react';

interface BarcodeScannerOptions {
    onScan: (barcode: string) => void;
    minLength?: number;
    timeout?: number;
}

export const useBarcodeScanner = ({ onScan, minLength = 8, timeout = 100 }: BarcodeScannerOptions) => {
    const barcodeBuffer = useRef<string>('');
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Don't capture if user is typing in an input field
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            // Barcode scanners typically send Enter at the end
            if (event.key === 'Enter') {
                if (barcodeBuffer.current.length >= minLength) {
                    onScan(barcodeBuffer.current);
                }
                barcodeBuffer.current = '';
                return;
            }

            // Build barcode buffer
            if (event.key.length === 1) {
                barcodeBuffer.current += event.key;

                // Clear buffer after timeout (barcode scanners are fast)
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                timeoutRef.current = setTimeout(() => {
                    barcodeBuffer.current = '';
                }, timeout);
            }
        };

        window.addEventListener('keypress', handleKeyPress);
        return () => {
            window.removeEventListener('keypress', handleKeyPress);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [onScan, minLength, timeout]);
};

// Web Barcode Detection API Hook (for camera scanning)
export const useWebBarcodeDetector = () => {
    const detect = async (imageSource: ImageBitmapSource): Promise<string[]> => {
        try {
            // @ts-ignore - BarcodeDetector is experimental
            if ('BarcodeDetector' in window) {
                // @ts-ignore
                const barcodeDetector = new BarcodeDetector({
                    formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']
                });
                const barcodes = await barcodeDetector.detect(imageSource);
                return barcodes.map((barcode: any) => barcode.rawValue);
            }
            return [];
        } catch (error) {
            console.error('Barcode detection failed:', error);
            return [];
        }
    };

    return { detect };
};
