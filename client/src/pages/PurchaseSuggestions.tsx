import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerLayout from '../components/OwnerLayout';
import api from '../api';
import { ShoppingCart, CheckSquare, Square } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const PurchaseSuggestions = () => {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const fetchSuggestions = async () => {
        try {
            const res = await api.get('/purchase/suggestions');
            setSuggestions(res.data);
        } catch (error) {
            console.error(error);
            showToast('Failed to fetch suggestions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (productId: string) => {
        if (selectedItems.includes(productId)) {
            setSelectedItems(selectedItems.filter(id => id !== productId));
        } else {
            setSelectedItems([...selectedItems, productId]);
        }
    };

    const createPO = () => {
        if (selectedItems.length === 0) return;

        // Group by supplier or just pass all to PO creation page
        // For now, let's just navigate to PO creation with selected items
        // We might need to pass state or store it in local storage/context
        // Simpler: Pass as query param or state
        const itemsToOrder = suggestions.filter(s => selectedItems.includes(s.productId));
        navigate('/purchase/create', { state: { items: itemsToOrder } });
    };

    return (
        <OwnerLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Purchase Suggestions</h1>
                <button
                    onClick={createPO}
                    disabled={selectedItems.length === 0}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:bg-indigo-700"
                >
                    <ShoppingCart size={20} />
                    Create PO ({selectedItems.length})
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading suggestions...</div>
            ) : suggestions.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    <CheckSquare size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No low stock items found. Great job!</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 w-10">
                                    <button
                                        onClick={() => {
                                            if (selectedItems.length === suggestions.length) setSelectedItems([]);
                                            else setSelectedItems(suggestions.map(s => s.productId));
                                        }}
                                        className="text-gray-500 hover:text-indigo-600"
                                    >
                                        {selectedItems.length === suggestions.length ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </button>
                                </th>
                                <th className="p-4">Product</th>
                                <th className="p-4">Current Stock</th>
                                <th className="p-4">Supplier</th>
                                <th className="p-4">Suggested Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {suggestions.map((item) => (
                                <tr
                                    key={item.productId}
                                    className={`hover:bg-gray-50 cursor-pointer ${selectedItems.includes(item.productId) ? 'bg-indigo-50' : ''}`}
                                    onClick={() => toggleSelection(item.productId)}
                                >
                                    <td className="p-4">
                                        {selectedItems.includes(item.productId) ? (
                                            <CheckSquare size={20} className="text-indigo-600" />
                                        ) : (
                                            <Square size={20} className="text-gray-400" />
                                        )}
                                    </td>
                                    <td className="p-4 font-medium">{item.productName}</td>
                                    <td className="p-4 text-red-600 font-bold">{item.currentStock}</td>
                                    <td className="p-4 text-gray-600">{item.supplierName || 'Unknown'}</td>
                                    <td className="p-4">{item.suggestedQuantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </OwnerLayout>
    );
};

export default PurchaseSuggestions;
