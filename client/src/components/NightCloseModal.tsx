import React, { useState, useEffect } from 'react';
import { Moon, CheckCircle, AlertTriangle, XCircle, Loader2, ArrowRight, X, ChevronDown } from 'lucide-react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

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
            await new Promise(resolve => setTimeout(resolve, 1500)); // Aesthetic delay
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

        if (diff > 100) {
            newStatus = 'YELLOW';
            newIssues.push(`Cash diff: ₹${diff} (Exp: ₹${checks.expectedCash})`);
        }

        if (checks.totalPendingUdhaar > 10000) {
            newStatus = newStatus === 'GREEN' ? 'YELLOW' : 'RED';
            newIssues.push(`High Udhaar: ₹${checks.totalPendingUdhaar}`);
        }

        if (checks.lowStockItems.length > 0) {
            newStatus = newStatus === 'GREEN' ? 'YELLOW' : 'RED';
            const items = checks.lowStockItems.map(i => i.name).join(', ');
            newIssues.push(`Low Stock: ${items}`);
        }

        setStatus(newStatus);
        setIssues(newIssues);
        setStep('RESULT');

        api.post('/ritual/close', {
            cashEntered: entered,
            status: newStatus,
            notes: newIssues.join('; ')
        }).catch(console.error);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-50 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                    >
                        {/* Drag Handle */}
                        <div className="w-full flex justify-center pt-4 pb-2" onClick={onClose}>
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
                        </div>

                        <div className="p-6 pb-10 overflow-y-auto">
                            {step === 'IDLE' && (
                                <div className="text-center space-y-6">
                                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                                        <Moon size={40} className="text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-secondary-dark">Night Close Ritual</h2>
                                        <p className="text-secondary mt-2">Ready to close the shop for today?</p>
                                    </div>
                                    <button
                                        onClick={startRitual}
                                        className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        Start Checking <ArrowRight size={20} />
                                    </button>
                                </div>
                            )}

                            {step === 'LOADING' && (
                                <div className="text-center py-12 space-y-4">
                                    <Loader2 size={48} className="text-primary animate-spin mx-auto" />
                                    <p className="text-secondary font-medium">Analyzing today's business...</p>
                                </div>
                            )}

                            {step === 'INPUT' && checks && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-secondary-dark">Cash Verification</h3>
                                        <p className="text-sm text-secondary">Count the cash in your galla</p>
                                    </div>

                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">₹</span>
                                        <input
                                            type="number"
                                            value={cashInput}
                                            onChange={(e) => setCashInput(e.target.value)}
                                            className="w-full pl-10 pr-4 py-4 text-2xl font-bold text-center border-2 border-gray-100 rounded-2xl focus:border-primary focus:ring-0 outline-none bg-gray-50"
                                            placeholder="0"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center text-sm">
                                        <span className="text-blue-700 font-medium">System Expects</span>
                                        <span className="text-blue-800 font-bold">₹{checks.expectedCash}</span>
                                    </div>

                                    <button
                                        onClick={calculateResult}
                                        className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
                                    >
                                        Verify & Close
                                    </button>
                                </div>
                            )}

                            {step === 'RESULT' && (
                                <div className="text-center space-y-6">
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={cn(
                                            "w-24 h-24 rounded-full flex items-center justify-center mx-auto",
                                            status === 'GREEN' ? "bg-green-50 text-green-500" :
                                                status === 'YELLOW' ? "bg-yellow-50 text-yellow-500" :
                                                    "bg-red-50 text-red-500"
                                        )}
                                    >
                                        {status === 'GREEN' && <CheckCircle size={48} />}
                                        {status === 'YELLOW' && <AlertTriangle size={48} />}
                                        {status === 'RED' && <XCircle size={48} />}
                                    </motion.div>

                                    <div>
                                        <h2 className={cn("text-2xl font-bold mb-2",
                                            status === 'GREEN' ? "text-green-700" :
                                                status === 'YELLOW' ? "text-yellow-700" : "text-red-700"
                                        )}>
                                            {status === 'GREEN' ? "All Good!" :
                                                status === 'YELLOW' ? "Check These" : "Attention Needed"}
                                        </h2>
                                        <p className="text-secondary">
                                            {status === 'GREEN' ? "Great job today! See you tomorrow." :
                                                "Review these items before leaving."}
                                        </p>
                                    </div>

                                    {issues.length > 0 && (
                                        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
                                            {issues.map((issue, idx) => (
                                                <div key={idx} className="flex items-start gap-3 text-sm text-secondary-dark">
                                                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                                    <span>{issue}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        onClick={onClose}
                                        className="w-full bg-secondary-dark text-white py-4 rounded-xl font-bold shadow-lg active:scale-[0.98] transition-all"
                                    >
                                        Done for the Day
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NightCloseModal;
