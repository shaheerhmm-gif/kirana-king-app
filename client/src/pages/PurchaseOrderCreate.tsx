import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OwnerLayout from '../components/OwnerLayout';
import api from '../api';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const PurchaseOrderCreate = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const [poData, setPoData] = useState({
        supplierId: '',
        items: [] as any[],
        status: 'DRAFT'
    });

    useEffect(() => {
        fetchSuppliers();
        fetchProducts();

        if (location.state?.items) {
            // Pre-fill items from suggestions
            const initialItems = location.state.items.map((i: any) => ({
                productId: i.productId,
                productName: i.productName,
                quantity: i.suggestedQuantity,
                rate: 0 // We might not know the purchase price yet, or fetch it
            }));

            // Try to set supplier if all items have same supplier
            const supplierIds = [...new Set(location.state.items.map((i: any) => i.supplierId).filter(Boolean))];
            if (supplierIds.length === 1) {
                setPoData(prev => ({ ...prev, supplierId: String(supplierIds[0]), items: initialItems }));
            } else {
                setPoData(prev => ({ ...prev, items: initialItems }));
            }
        }
    }, [location.state]);

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/inventory/products');
            setProducts(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const addItem = () => {
        setPoData(prev => ({
            ...prev,
            items: [...prev.items, { productId: '', quantity: 1, rate: 0 }]
        }));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...poData.items];
        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            newItems[index] = {
                ...newItems[index],
                productId: value,
                productName: product?.name,
                // Try to pre-fill rate from last batch
                rate: product?.batches?.[0]?.purchasePrice || 0
            };
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }
        setPoData(prev => ({ ...prev, items: newItems }));
    };

    const removeItem = (index: number) => {
        setPoData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        if (!poData.supplierId) {
            showToast('Please select a supplier', 'error');
            return;
        }
        if (poData.items.length === 0) {
            showToast('Please add at least one item', 'error');
            return;
        }

        try {
            await api.post('/purchase/orders', poData);
            showToast('Purchase Order created successfully', 'success');
            navigate('/purchase/orders');
        } catch (error) {
            console.error(error);
            showToast('Failed to create Purchase Order', 'error');
        }
    };

    const totalAmount = poData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

    return (
        <OwnerLayout>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold">Create Purchase Order</h1>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                            <select
                                value={poData.supplierId}
                                onChange={(e) => setPoData({ ...poData, supplierId: e.target.value })}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={poData.status}
                                onChange={(e) => setPoData({ ...poData, status: e.target.value })}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="DRAFT">Draft</option>
                                <option value="SENT">Sent</option>
                                <option value="RECEIVED">Received</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Items</h2>
                            <button
                                onClick={addItem}
                                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                            >
                                <Plus size={18} /> Add Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {poData.items.map((item, index) => (
                                <div key={index} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg">
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">Product</label>
                                        <select
                                            value={item.productId}
                                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                                            className="w-full p-2 border rounded focus:ring-indigo-500"
                                        >
                                            <option value="">Select Product</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs text-gray-500 mb-1">Qty</label>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                            className="w-full p-2 border rounded focus:ring-indigo-500"
                                            min="1"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-xs text-gray-500 mb-1">Rate (Est.)</label>
                                        <input
                                            type="number"
                                            value={item.rate}
                                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value))}
                                            className="w-full p-2 border rounded focus:ring-indigo-500"
                                            min="0"
                                        />
                                    </div>
                                    <div className="w-24 pt-6 text-right font-medium">
                                        ₹{item.quantity * item.rate}
                                    </div>
                                    <button
                                        onClick={() => removeItem(index)}
                                        className="mt-6 text-red-500 hover:text-red-700 p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t pt-4 flex justify-between items-center">
                        <div className="text-xl font-bold">
                            Total: ₹{totalAmount}
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    if (!poData.supplierId || poData.items.length === 0) {
                                        showToast('Select supplier and items first', 'error');
                                        return;
                                    }
                                    const supplier = suppliers.find(s => s.id === poData.supplierId);
                                    const text = `Hi ${supplier?.name},\n\nI would like to place an order:\n\n${poData.items.map(i => `- ${i.productName}: ${i.quantity} units`).join('\n')}\n\nPlease confirm availability and delivery.\n\n- ${'Kirana King Store'}`; // Ideally store name from context
                                    const url = `https://wa.me/${supplier?.phone || ''}?text=${encodeURIComponent(text)}`;
                                    window.open(url, '_blank');
                                }}
                                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2"
                            >
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                Share on WhatsApp
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2"
                            >
                                <Save size={20} />
                                Create Order
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </OwnerLayout>
    );
};

export default PurchaseOrderCreate;
