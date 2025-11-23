import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface Payment {
    mode: 'CASH' | 'UPI' | 'CARD';
    amount: number;
    reference?: string;
}

interface SplitPaymentModalProps {
    totalAmount: number;
    onConfirm: (payments: Payment[]) => void;
    onClose: () => void;
}

const SplitPaymentModal = ({ totalAmount, onConfirm, onClose }: SplitPaymentModalProps) => {
    const [payments, setPayments] = useState<Payment[]>([
        { mode: 'CASH', amount: 0 }
    ]);

    const addPayment = () => {
        setPayments([...payments, { mode: 'CASH', amount: 0 }]);
    };

    const updatePayment = (index: number, field: keyof Payment, value: any) => {
        const updated = [...payments];
        updated[index] = { ...updated[index], [field]: value };
        setPayments(updated);
    };

    const removePayment = (index: number) => {
        if (payments.length > 1) {
            setPayments(payments.filter((_, i) => i !== index));
        }
    };

    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const remaining = totalAmount - totalPaid;
    const isValid = Math.abs(remaining) < 0.01;

    const handleConfirm = () => {
        if (isValid) {
            onConfirm(payments);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold">Split Payment</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4">
                    {/* Total Amount */}
                    <div className="bg-indigo-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-indigo-600 mb-1">Total Bill Amount</p>
                        <p className="text-3xl font-bold text-indigo-900">₹{totalAmount.toFixed(2)}</p>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3 mb-4">
                        {payments.map((payment, index) => (
                            <div key={index} className="border rounded-lg p-3 bg-gray-50">
                                <div className="flex gap-2 mb-2">
                                    <select
                                        value={payment.mode}
                                        onChange={(e) => updatePayment(index, 'mode', e.target.value)}
                                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="CASH">💵 Cash</option>
                                        <option value="UPI">📱 UPI</option>
                                        <option value="CARD">💳 Card</option>
                                    </select>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={payment.amount || ''}
                                        onChange={(e) => updatePayment(index, 'amount', parseFloat(e.target.value) || 0)}
                                        placeholder="Amount"
                                        className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {payments.length > 1 && (
                                        <button
                                            onClick={() => removePayment(index)}
                                            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                                {(payment.mode === 'UPI' || payment.mode === 'CARD') && (
                                    <input
                                        type="text"
                                        value={payment.reference || ''}
                                        onChange={(e) => updatePayment(index, 'reference', e.target.value)}
                                        placeholder={payment.mode === 'UPI' ? 'UPI Transaction ID' : 'Card Last 4 Digits'}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add Payment Button */}
                    <button
                        onClick={addPayment}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center gap-2 mb-4"
                    >
                        <Plus size={18} /> Add Payment Method
                    </button>

                    {/* Summary */}
                    <div className="bg-gray-100 p-3 rounded-lg mb-4">
                        <div className="flex justify-between mb-1">
                            <span className="text-gray-600">Total Paid:</span>
                            <span className="font-bold">₹{totalPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Remaining:</span>
                            <span className={`font-bold ${remaining > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                                ₹{remaining.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Confirm Button */}
                    <button
                        onClick={handleConfirm}
                        disabled={!isValid}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isValid ? 'Confirm Split Payment' : `₹${Math.abs(remaining).toFixed(2)} ${remaining > 0 ? 'Short' : 'Excess'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SplitPaymentModal;
