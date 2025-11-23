import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';

interface VoiceInputProps {
    onResult: (transcript: string) => void;
    isProcessing?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onResult, isProcessing = false }) => {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-IN'; // Default to Indian English, often captures Hindi words too

            recognition.onstart = () => {
                setIsListening(true);
                setError('');
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                onResult(transcript);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setError('Mic Error');
                setIsListening(false);
            };

            setRecognition(recognition);
        } else {
            setError('Not Supported');
        }
    }, [onResult]);

    const toggleListening = () => {
        if (!recognition) return;

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    };

    if (error === 'Not Supported') return null;

    return (
        <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`
                fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-xl transition-all active:scale-95
                ${isListening
                    ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }
                ${isProcessing ? 'opacity-75 cursor-wait' : ''}
            `}
            title="Jhatpat Voice Mode"
        >
            {isProcessing ? (
                <Loader className="animate-spin" size={24} />
            ) : isListening ? (
                <MicOff size={24} />
            ) : (
                <Mic size={24} />
            )}
        </button>
    );
};

export default VoiceInput;
