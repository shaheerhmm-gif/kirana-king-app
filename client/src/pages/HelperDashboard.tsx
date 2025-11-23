import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Mic, LogOut, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HelperDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isListening, setIsListening] = useState(false);
    const [logMessage, setLogMessage] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleVoiceLog = () => {
        setIsListening(true);
        // Stub: Simulate voice input after 2 seconds
        setTimeout(async () => {
            const dummyText = "Amul Butter expiry 20th";
            setLogMessage(`Heard: "${dummyText}"`);
            try {
                await api.post('/inventory/log-voice', {
                    voiceText: dummyText,
                    quantity: 5,
                });
                alert('Logged: Amul Butter (Expiry 20th)');
            } catch (error) {
                console.error(error);
                alert('Failed to log');
            } finally {
                setIsListening(false);
            }
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <header className="p-4 flex justify-between items-center bg-gray-800">
                <div>
                    <h1 className="text-xl font-bold">Helper Mode</h1>
                    <p className="text-sm text-gray-400">{user?.name}</p>
                </div>
                <button onClick={handleLogout} className="bg-red-600 p-2 rounded-full">
                    <LogOut size={20} />
                </button>
            </header>

            <main className="flex-1 p-6 flex flex-col gap-6 items-center justify-center">
                <button
                    onClick={handleVoiceLog}
                    disabled={isListening}
                    className={`w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all ${isListening ? 'bg-red-600 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                >
                    <Mic size={64} />
                    <span className="mt-4 text-2xl font-bold">{isListening ? 'Listening...' : 'Tap to Speak'}</span>
                    <span className="text-sm mt-2 text-indigo-200">"Product Name expiry Date"</span>
                </button>

                {logMessage && (
                    <div className="bg-gray-800 p-4 rounded text-center w-full max-w-md">
                        <p className="text-green-400">{logMessage}</p>
                    </div>
                )}

                <button className="w-full max-w-md bg-gray-800 p-6 rounded-lg flex items-center justify-center gap-4 hover:bg-gray-700">
                    <Camera size={32} />
                    <span className="text-xl">Scan Invoice</span>
                </button>
            </main>
        </div>
    );
};

export default HelperDashboard;
