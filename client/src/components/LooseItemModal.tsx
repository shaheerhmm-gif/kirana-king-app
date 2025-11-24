import React, { useState, useEffect } from 'react';
import { X, Scale } from 'lucide-react';

interface LooseItemModalProps {
    product: {
        id: string;
        name: string;
        price: number; // Selling price per unit (usually per Kg for loose items)
    };
    onConfirm: (quantity: number, totalAmount: number) => void;
    onClose: () => void;
}

const LooseItemModal: React.FC<LooseItemModalProps> = ({ product, onConfirm, onClose }) => {
    const [mode, setMode] = useState<'PRICE' | 'WEIGHT'>('PRICE'); // Input mode
    const [amount, setAmount] = useState<string>('');
    const [weight, setWeight] = useState<string>('');
    const [unit, setUnit] = useState<'Kg' | 'g'>('g'); // Default to grams for weight input

    // Auto-focus input
    useEffect(() => {
        const input = document.getElementById('loose-item-input');
        if (input) input.focus();
    }, [mode]);

    const handleAmountChange = (val: string) => {
        setAmount(val);
        if (!val) {
            setWeight('');
            return;
        }
        const amt = parseFloat(val);
        // Weight = Amount / PricePerKg
        const wKg = amt / product.price;

        if (unit === 'g') {
            setWeight((wKg * 1000).toFixed(0));
        } else {
            setWeight(wKg.toFixed(3));
        }
    };

    const handleWeightChange = (val: string) => {
        setWeight(val);
        if (!val) {
            setAmount('');
            return;
        }
        const w = parseFloat(val);
        let wKg = w;
        if (unit === 'g') {
            wKg = w / 1000;
        }

        // Amount = WeightInKg * PricePerKg
        const amt = wKg * product.price;
        setAmount(amt.toFixed(2));
    };

    const handleConfirm = () => {
        const finalAmount = parseFloat(amount);
        const finalWeightKg = unit === 'g' ? parseFloat(weight) / 1000 : parseFloat(weight);

        if (finalAmount > 0 && finalWeightKg > 0) {
            onConfirm(finalWeightKg, finalAmount);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Scale size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{product.name}</h2>
                            <p className="text-indigo-100 text-sm">₹{product.price} / Kg</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Mode Switcher */}
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                        <button
                            onClick={() => { setMode('PRICE'); setAmount(''); setWeight(''); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'PRICE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            ₹ By Price
                        </button>
                        <button
                            onClick={() => { setMode('WEIGHT'); setAmount(''); setWeight(''); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'WEIGHT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            ⚖️ By Weight
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Price Input */}
                        <div className={`transition-opacity ${mode === 'PRICE' ? 'opacity-100' : 'opacity-50'}`}>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Amount (₹)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">₹</span>
                                <input
                                    id={mode === 'PRICE' ? 'loose-item-input' : ''}
                                    type="number"
                                    value={amount}
                                    onChange={(e) => handleAmountChange(e.target.value)}
                                    disabled={mode !== 'PRICE'}
                                    placeholder="0"
                                    className="w-full pl-10 pr-4 py-3 text-3xl font-bold text-gray-800 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none transition-colors disabled:bg-gray-50"
                                />
                            </div>
                        </div>

                        {/* Weight Input */}
                        <div className={`transition-opacity ${mode === 'WEIGHT' ? 'opacity-100' : 'opacity-50'}`}>
                            <div className="flex justify-between items-end mb-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Weight
                                </label>
                                <div className="flex bg-gray-100 rounded-lg p-0.5">
                                    <button
                                        onClick={() => { setUnit('g'); handleAmountChange(amount); }}
                                        className={`px-2 py-0.5 text-xs font-bold rounded ${unit === 'g' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                                    >
                                        g
                                    </button>
                                    <button
                                        onClick={() => { setUnit('Kg'); handleAmountChange(amount); }}
                                        className={`px-2 py-0.5 text-xs font-bold rounded ${unit === 'Kg' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                                    >
                                        Kg
                                    </button>
                                </div>
                            </div>
                            <div className="relative">
                                <input
                                    id={mode === 'WEIGHT' ? 'loose-item-input' : ''}
                                    type="number"
                                    value={weight}
                                    onChange={(e) => handleWeightChange(e.target.value)}
                                    disabled={mode !== 'WEIGHT'}
                                    placeholder="0"
                                    className="w-full pl-4 pr-16 py-3 text-3xl font-bold text-gray-800 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none transition-colors disabled:bg-gray-50"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">
                                    {unit}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="mt-8 bg-indigo-50 rounded-xl p-4 flex justify-between items-center">
                        <div className="text-indigo-800">
                            <p className="text-xs font-bold uppercase opacity-70">You are selling</p>
                            <p className="text-lg font-bold">
                                {weight ? `${weight} ${unit}` : '0 g'}
                            </p>
                        </div>
                        <div className="text-right text-indigo-800">
                            <p className="text-xs font-bold uppercase opacity-70">For</p>
                            <p className="text-2xl font-bold">
                                ₹{amount || '0'}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <button
                            onClick={onClose}
                            className="py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!amount || parseFloat(amount) <= 0}
                            className="py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                        >
                            Add to Bill ↵
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LooseItemModal;
