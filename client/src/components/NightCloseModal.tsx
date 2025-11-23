import React, { useState, useEffect } from 'react';
import { Moon, CheckCircle, AlertTriangle, XCircle, Loader, ArrowRight, X } from 'lucide-react';
import api from '../api';

interface NightCloseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'IDLE' | 'LOADING' | 'INPUT' | 'RESULT';
type Status = 'GREEN' | 'YELLOW' | 'RED';

interface ChecksData {
    expectedCash: number;
    totalPendingUdhaar: number;
    lowStockItems: { name: string; currentStock: number }[];
}

const NightCloseModal: React.FC<NightCloseModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<Step>('IDLE');
    const [checks, setChecks] = useState<ChecksData | null>(null);
    const [cashInput, setCashInput] = useState('');
    const [status, setStatus] = useState<Status>('GREEN');
    const [issues, setIssues] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setStep('IDLE');
            setChecks(null);
            setCashInput('');
            setIssues([]);
        }
    }, [isOpen]);

    const startRitual = async () => {
        setStep('LOADING');
        try {
            // Simulate a small delay for "Ritual" feel
            await new Promise(resolve => setTimeout(resolve, 2000));

            const res = await api.get('/ritual/checks');
            setChecks(res.data);
            setStep('INPUT');
        } catch (error) {
            console.error(error);
            alert('Error running checks. Please try again.');
            onClose();
        }
    };

    const calculateResult = () => {
        if (!checks) return;

        const entered = parseFloat(cashInput) || 0;
        const diff = Math.abs(entered - checks.expectedCash);
        const newIssues: string[] = [];
        let newStatus: Status = 'GREEN';

        // 1. Cash Check
        if (diff > 100) { // Tolerance ₹100
            newStatus = 'YELLOW';
            newIssues.push(`Cash difference: ₹${diff} (Expected: ₹${checks.expectedCash})`);
        }

        // 2. Udhaar Check
        if (checks.totalPendingUdhaar > 10000) { // Threshold ₹10k
            newStatus = newStatus === 'GREEN' ? 'YELLOW' : 'RED';
            newIssues.push(`High Udhaar Pending: ₹${checks.totalPendingUdhaar}`);
        }

        // 3. Stock Check
        if (checks.lowStockItems.length > 0) {
            newStatus = newStatus === 'GREEN' ? 'YELLOW' : 'RED';
            const items = checks.lowStockItems.map(i => i.name).join(', ');
            newIssues.push(`Low Stock: ${items}`);
        }

        setStatus(newStatus);
        setIssues(newIssues);
        setStep('RESULT');

        // Save closure in background
        api.post('/ritual/close', {
            cashEntered: entered,
            status: newStatus,
            notes: newIssues.join('; ')
        }).catch(console.error);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative min-h-[400px] flex flex-col">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>

                {step === 'IDLE' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="bg-indigo-100 p-6 rounded-full mb-6">
                            <Moon size={48} className="text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Aaj ki dukaan band karein?</h2>
                        <p className="text-gray-500 mb-8">
                            We'll check your cash, udhaar, and stock for tomorrow.
                        </p>
                        <button
                            onClick={startRitual}
                            className="w-full bg-indigo-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                        >
                            Start Check <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {step === 'LOADING' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <Loader size={48} className="text-indigo-600 animate-spin mb-6" />
                        <h3 className="text-xl font-semibold text-gray-700">Thoda check kar rahe hain...</h3>
                        <p className="text-gray-500 mt-2">Checking sales, udhaar, and stock...</p>
                    </div>
                )}

                {step === 'INPUT' && checks && (
                    <div className="flex-1 flex flex-col p-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Cash Verification</h3>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Aaj galle mein kitna cash hai?
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₹</span>
                                <input
                                    type="number"
                                    value={cashInput}
                                    onChange={(e) => setCashInput(e.target.value)}
                                    className="w-full pl-8 pr-4 py-3 text-xl border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-0"
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                System expects: ₹{checks.expectedCash}
                            </p>
                        </div>

                        <div className="mt-auto">
                            <button
                                onClick={calculateResult}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700"
                            >
                                Verify & Close
                            </button>
                        </div>
                    </div>
                )}

                {step === 'RESULT' && (
                    <div className="flex-1 flex flex-col p-8 text-center">
                        <div className="flex-1 flex flex-col items-center justify-center">
                            {status === 'GREEN' && (
                                <>
                                    <CheckCircle size={64} className="text-green-500 mb-4" />
                                    <h2 className="text-2xl font-bold text-green-700 mb-2">Shabash!</h2>
                                    <p className="text-gray-600">Aaj ka din safe & set hai 👌</p>
                                </>
                            )}
                            {status === 'YELLOW' && (
                                <>
                                    <AlertTriangle size={64} className="text-yellow-500 mb-4" />
                                    <h2 className="text-2xl font-bold text-yellow-700 mb-2">Overall Theek Hai</h2>
                                    <p className="text-gray-600">Bas ye 1-2 cheezein dekh lena:</p>
                                </>
                            )}
                            {status === 'RED' && (
                                <>
                                    <XCircle size={64} className="text-red-500 mb-4" />
                                    <h2 className="text-2xl font-bold text-red-700 mb-2">Attention Needed</h2>
                                    <p className="text-gray-600">Kuch important issues hain:</p>
                                </>
                            )}

                            {issues.length > 0 && (
                                <div className="mt-6 bg-gray-50 rounded-lg p-4 w-full text-left">
                                    <ul className="space-y-2">
                                        {issues.map((issue, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                                <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                                {issue}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full mt-6 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900"
                        >
                            Done / Ho gaya
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NightCloseModal;
