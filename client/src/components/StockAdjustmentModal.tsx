import React, { useState } from 'react';
import { X } from 'lucide-react';

interface StockAdjustmentModalProps {
    product: any;
    onClose: () => void;
    onConfirm: (data: any) => void;
}

const StockAdjustmentModal = ({ product, onClose, onConfirm }: StockAdjustmentModalProps) => {
    const [batchId, setBatchId] = useState<string>('');
    const [type, setType] = useState<'ADD' | 'REMOVE'>('REMOVE');
    const [quantity, setQuantity] = useState<number>(1);
    const [reason, setReason] = useState<string>('Damage');
    const [customReason, setCustomReason] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm({
            productId: product.id,
            batchId,
            type,
            quantity: Number(quantity),
            reason: reason === 'Other' ? customReason : reason
        });
    };

    const selectedBatch = product.batches.find((b: any) => b.id === batchId);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold">Adjust Stock</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-semibold text-gray-800">{product.name}</p>
                        <p className="text-sm text-gray-500">Current Total Stock: {product.totalStock}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
                        <select
                            value={batchId}
                            onChange={(e) => setBatchId(e.target.value)}
                            required
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">-- Select Batch --</option>
                            {product.batches.map((batch: any) => (
                                <option key={batch.id} value={batch.id}>
                                    Qty: {batch.quantity} | Exp: {new Date(batch.expiryDate).toLocaleDateString()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <label className="flex-1 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="REMOVE"
                                checked={type === 'REMOVE'}
                                onChange={() => setType('REMOVE')}
                                className="sr-only peer"
                            />
                            <div className="p-3 text-center border rounded-lg peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-700 hover:bg-gray-50">
                                Remove Stock
                            </div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="ADD"
                                checked={type === 'ADD'}
                                onChange={() => setType('ADD')}
                                className="sr-only peer"
                            />
                            <div className="p-3 text-center border rounded-lg peer-checked:bg-green-50 peer-checked:border-green-500 peer-checked:text-green-700 hover:bg-gray-50">
                                Add Stock
                            </div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            max={type === 'REMOVE' ? selectedBatch?.quantity : undefined}
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="Damage">Damage</option>
                            <option value="Theft">Theft</option>
                            <option value="Expired">Expired</option>
                            <option value="Correction">Inventory Correction</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {reason === 'Other' && (
                        <input
                            type="text"
                            placeholder="Specify reason..."
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            className={`w-full py-3 rounded-lg font-bold text-white shadow-lg ${type === 'REMOVE' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            Confirm Adjustment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockAdjustmentModal;
