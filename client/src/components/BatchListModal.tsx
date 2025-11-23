import React, { useState } from 'react';
import { X, Save, Edit2 } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';

interface Batch {
    id: string;
    quantity: number;
    expiryDate: string;
    purchasePrice: number;
    sellingPrice: number;
}

interface Product {
    id: string;
    name: string;
    batches: Batch[];
}

interface BatchListModalProps {
    product: Product;
    onClose: () => void;
    onUpdate: () => void;
}

const BatchListModal: React.FC<BatchListModalProps> = ({ product, onClose, onUpdate }) => {
    const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Batch>>({});
    const { showToast } = useToast();

    const handleEditClick = (batch: Batch) => {
        setEditingBatchId(batch.id);
        setEditData({
            quantity: batch.quantity,
            expiryDate: batch.expiryDate.split('T')[0],
            sellingPrice: batch.sellingPrice
        });
    };

    const handleSave = async (batchId: string) => {
        try {
            await api.put(`/inventory/batch/${batchId}`, editData);
            showToast('Batch updated successfully', 'success');
            setEditingBatchId(null);
            onUpdate(); // Refresh parent data
        } catch (error) {
            console.error(error);
            showToast('Failed to update batch', 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
            <div className="bg-white rounded-none md:rounded-xl w-full md:max-w-2xl h-full md:h-auto md:max-h-[80vh] overflow-hidden flex flex-col shadow-xl">
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Batches: {product.name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-200">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-0 md:p-0">
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0 shadow-sm">
                                <tr>
                                    <th className="p-3 text-sm font-medium text-gray-500">Expiry Date</th>
                                    <th className="p-3 text-sm font-medium text-gray-500">Quantity</th>
                                    <th className="p-3 text-sm font-medium text-gray-500">Selling Price</th>
                                    <th className="p-3 text-sm font-medium text-gray-500">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {product.batches.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500">No batches found</td>
                                    </tr>
                                ) : (
                                    product.batches.map(batch => (
                                        <tr key={batch.id} className="hover:bg-gray-50">
                                            <td className="p-3">
                                                {editingBatchId === batch.id ? (
                                                    <input
                                                        type="date"
                                                        value={editData.expiryDate}
                                                        onChange={(e) => setEditData({ ...editData, expiryDate: e.target.value })}
                                                        className="border rounded px-2 py-1 w-full focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                ) : (
                                                    new Date(batch.expiryDate).toLocaleDateString()
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {editingBatchId === batch.id ? (
                                                    <input
                                                        type="number"
                                                        value={editData.quantity}
                                                        onChange={(e) => setEditData({ ...editData, quantity: Number(e.target.value) })}
                                                        className="border rounded px-2 py-1 w-20 focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                ) : (
                                                    batch.quantity
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {editingBatchId === batch.id ? (
                                                    <input
                                                        type="number"
                                                        value={editData.sellingPrice}
                                                        onChange={(e) => setEditData({ ...editData, sellingPrice: Number(e.target.value) })}
                                                        className="border rounded px-2 py-1 w-24 focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                ) : (
                                                    `₹${batch.sellingPrice}`
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {editingBatchId === batch.id ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSave(batch.id)}
                                                            className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded"
                                                        >
                                                            <Save size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingBatchId(null)}
                                                            className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditClick(batch)}
                                                        className="text-indigo-600 hover:text-indigo-800 p-1 hover:bg-indigo-50 rounded"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y">
                        {product.batches.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No batches found</div>
                        ) : (
                            product.batches.map(batch => (
                                <div key={batch.id} className="p-4 bg-white">
                                    {editingBatchId === batch.id ? (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">Expiry Date</label>
                                                <input
                                                    type="date"
                                                    value={editData.expiryDate}
                                                    onChange={(e) => setEditData({ ...editData, expiryDate: e.target.value })}
                                                    className="border rounded px-3 py-2 w-full"
                                                />
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <label className="text-xs text-gray-500 block mb-1">Quantity</label>
                                                    <input
                                                        type="number"
                                                        value={editData.quantity}
                                                        onChange={(e) => setEditData({ ...editData, quantity: Number(e.target.value) })}
                                                        className="border rounded px-3 py-2 w-full"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-xs text-gray-500 block mb-1">Price (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={editData.sellingPrice}
                                                        onChange={(e) => setEditData({ ...editData, sellingPrice: Number(e.target.value) })}
                                                        className="border rounded px-3 py-2 w-full"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={() => handleSave(batch.id)}
                                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                                                >
                                                    <Save size={18} /> Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingBatchId(null)}
                                                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg flex items-center justify-center gap-2"
                                                >
                                                    <X size={18} /> Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-gray-800">
                                                    Exp: {new Date(batch.expiryDate).toLocaleDateString()}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">
                                                    Qty: <span className="font-medium text-gray-900">{batch.quantity}</span> • Price: <span className="font-medium text-indigo-600">₹{batch.sellingPrice}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleEditClick(batch)}
                                                className="p-2 text-indigo-600 bg-indigo-50 rounded-lg"
                                            >
                                                <Edit2 size={20} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatchListModal;
