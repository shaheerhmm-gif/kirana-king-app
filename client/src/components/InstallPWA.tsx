import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) {
            setShowInstallBanner(false);
            return;
        }

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);
            setShowInstallBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for app installed event
        const handleAppInstalled = () => {
            setShowInstallBanner(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        setDeferredPrompt(null);
        setShowInstallBanner(false);
    };

    const handleDismiss = () => {
        setShowInstallBanner(false);
    };

    if (!showInstallBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-2xl border-t-4 border-indigo-400">
            <div className="max-w-md mx-auto p-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">📲</span>
                            <h3 className="font-bold text-lg">Install Kirana King App</h3>
                        </div>
                        <p className="text-xs text-indigo-100 leading-relaxed">
                            Is button ko dabaiye, app seedha aapke mobile ki screen par aa jayega.
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-white/80 hover:text-white p-1"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>
                <button
                    onClick={handleInstallClick}
                    className="w-full mt-3 bg-white text-indigo-700 font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-indigo-50 transition-colors text-base"
                >
                    Install Now
                </button>
            </div>
        </div>
    );
};

export default InstallPWA;
