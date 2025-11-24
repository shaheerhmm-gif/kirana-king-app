import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Mic, LogOut, Camera, MicOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const HelperDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isListening, setIsListening] = useState(false);
    const [logMessage, setLogMessage] = useState('');
    const recognitionRef = useRef<any>(null);
    const { showToast } = useToast();

    useEffect(() => {
        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-IN'; // Works well for Hinglish/Marathi

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                handleVoiceLog(transcript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                showToast('Voice recognition failed. Try again.', 'error');
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        } else {
            showToast('Voice recognition not supported in this browser', 'error');
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
            setLogMessage('Listening... Say: "Product Name expiry Date"');
        }
    };

    const handleVoiceLog = async (transcript: string) => {
        console.log('Voice Command:', transcript);
        setLogMessage(`Heard: "${transcript}"`);

        try {
            await api.post('/inventory/log-voice', {
                voiceText: transcript,
                quantity: 1, // Default quantity
            });
            showToast(`Logged: ${transcript}`, 'success');
            setLogMessage(`✅ Logged: ${transcript}`);
        } catch (error: any) {
            console.error(error);
            const errorMsg = error.response?.data?.message || 'Failed to log';
            showToast(errorMsg, 'error');
            setLogMessage(`❌ ${errorMsg}`);
        } finally {
            setIsListening(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white flex flex-col">
            <header className="p-4 flex justify-between items-center bg-black/30 backdrop-blur-sm">
                <div>
                    <h1 className="text-2xl font-bold">Helper Mode</h1>
                    <p className="text-sm text-gray-300">{user?.name}</p>
                </div>
                <button onClick={handleLogout} className="bg-red-600 p-3 rounded-full hover:bg-red-700 transition-all">
                    <LogOut size={20} />
                </button>
            </header>

            <main className="flex-1 p-6 flex flex-col gap-6 items-center justify-center">
                <button
                    onClick={toggleListening}
                    disabled={!recognitionRef.current}
                    className={`w-72 h-72 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl ${isListening
                            ? 'bg-red-600 animate-pulse shadow-red-500/50'
                            : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-indigo-500/30'
                        }`}
                >
                    {isListening ? <MicOff size={80} /> : <Mic size={80} />}
                    <span className="mt-6 text-3xl font-bold">
                        {isListening ? 'Listening...' : 'Tap to Speak'}
                    </span>
                    <span className="text-sm mt-3 text-indigo-200 px-4 text-center">
                        Say: "Product Name expiry Date"<br />
                        Example: "Amul Butter expiry 20th"
                    </span>
                </button>

                {logMessage && (
                    <div className="bg-black/40 backdrop-blur-sm p-6 rounded-2xl text-center w-full max-w-lg border border-white/10">
                        <p className={`text-lg font-medium ${logMessage.includes('✅') ? 'text-green-400' :
                                logMessage.includes('❌') ? 'text-red-400' :
                                    'text-yellow-400'
                            }`}>
                            {logMessage}
                        </p>
                    </div>
                )}

                <button
                    className="w-full max-w-lg bg-black/40 backdrop-blur-sm p-6 rounded-2xl flex items-center justify-center gap-4 hover:bg-black/50 transition-all border border-white/10"
                    onClick={() => showToast('Invoice scanning coming soon!', 'info')}
                >
                    <Camera size={36} />
                    <span className="text-xl font-semibold">Scan Invoice</span>
                    <span className="text-xs bg-yellow-600 px-2 py-1 rounded">Coming Soon</span>
                </button>

                <div className="text-center mt-4 text-sm text-gray-400">
                    <p>Tip: Speak clearly and mention product name + expiry date</p>
                    <p className="mt-1">Format: "[Product] expiry [Date]"</p>
                </div>
            </main>
        </div>
    );
};

export default HelperDashboard;
