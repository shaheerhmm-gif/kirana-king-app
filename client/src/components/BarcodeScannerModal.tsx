import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Zap, ZapOff, Camera } from 'lucide-react';

interface BarcodeScannerModalProps {
    onScan: (barcode: string) => void;
    onClose: () => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onScan, onClose }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string>('');
    const [torchEnabled, setTorchEnabled] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannerDivId = 'barcode-scanner-region';

    useEffect(() => {
        startScanner();

        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        try {
            const scanner = new Html5Qrcode(scannerDivId);
            scannerRef.current = scanner;

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.0,
                supportedScanTypes: [
                    // @ts-ignore
                    Html5Qrcode.SCAN_TYPE_CAMERA
                ]
            };

            await scanner.start(
                { facingMode: 'environment' }, // Use back camera
                config,
                (decodedText) => {
                    // Successfully scanned
                    onScan(decodedText);
                    stopScanner();
                    onClose();
                },
                // @ts-ignore - errorMessage is provided by the library
                (errorMessage) => {
                    // Scanning error (normal when no barcode is in view)
                    // Don't show these to user
                }
            );

            setIsScanning(true);
            setError('');
        } catch (err: any) {
            console.error('Scanner initialization error:', err);
            setError(err.message || 'Failed to access camera. Please check permissions.');
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err) {
                console.error('Error stopping scanner:', err);
            }
        }
    };

    const toggleTorch = async () => {
        if (scannerRef.current) {
            try {
                const capabilities = await scannerRef.current.getRunningTrackCapabilities();
                // @ts-ignore
                if (capabilities.torch) {
                    // @ts-ignore - torch is not in standard MediaTrackConstraints but supported by many browsers
                    await scannerRef.current.applyVideoConstraints({
                        // @ts-ignore - torch property not in TypeScript types
                        advanced: [{ torch: !torchEnabled }]
                    });
                    setTorchEnabled(!torchEnabled);
                }
            } catch (err) {
                console.error('Torch toggle error:', err);
            }
        }
    };

    const handleClose = () => {
        stopScanner();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black z-[1000] flex flex-col">
            {/* Header */}
            <div className="bg-black/80 backdrop-blur-sm p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <Camera size={24} />
                    <h2 className="text-lg font-bold">Scan Barcode</h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={toggleTorch}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        title="Toggle Flashlight"
                    >
                        {torchEnabled ? <Zap size={24} className="text-yellow-400" /> : <ZapOff size={24} />}
                    </button>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Scanner Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                {error ? (
                    <div className="bg-red-500/20 border border-red-500 text-white p-6 rounded-xl max-w-md text-center">
                        <p className="text-lg font-semibold mb-2">Camera Access Error</p>
                        <p className="text-sm mb-4">{error}</p>
                        <p className="text-xs opacity-75">
                            Please allow camera access in your browser settings and try again.
                        </p>
                    </div>
                ) : (
                    <div className="w-full max-w-md">
                        <div id={scannerDivId} className="rounded-xl overflow-hidden shadow-2xl"></div>
                        <div className="mt-4 text-center text-white">
                            <p className="text-sm opacity-75">
                                Point camera at barcode to scan
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="bg-black/80 backdrop-blur-sm p-4 text-white text-center">
                <p className="text-sm opacity-75">
                    Supported formats: EAN-13, EAN-8, UPC-A, UPC-E, Code-128, Code-39
                </p>
            </div>
        </div>
    );
};

export default BarcodeScannerModal;
