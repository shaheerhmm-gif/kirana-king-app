// Keyboard Shortcut Hook
import { useEffect } from 'react';

interface KeyboardShortcuts {
    [key: string]: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts, enabled: boolean = true) => {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in input fields
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement
            ) {
                // Allow only F-keys and Escape in inputs
                if (!event.key.startsWith('F') && event.key !== 'Escape') {
                    return;
                }
            }

            const key = event.ctrlKey
                ? `Ctrl+${event.key}`
                : event.key;

            if (shortcuts[key]) {
                event.preventDefault();
                shortcuts[key]();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, enabled]);
};
