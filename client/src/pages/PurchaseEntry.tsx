import { useState, useEffect } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import { Plus, Trash2, Save, Calendar, User } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';

interface PurchaseItem {
    productId: string;
    productName: string;
    quantity: number;
    rate: number;
    sellingPrice?: number;
    expiryDate: string;
}

const PurchaseEntry = () => {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<PurchaseItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Item entry state
    const [currentItem, setCurrentItem] = useState<PurchaseItem>({
        productId: '',
        productName: '',
        quantity: 1,
        rate: 0,
        sellingPrice: 0,
        expiryDate: ''
    });

    const { showToast } = useToast();

    useEffect(() => {
        fetchSuppliers();
        fetchProducts();
    }, []);

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
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddItem = () => {
        if (!currentItem.productId || currentItem.quantity <= 0 || currentItem.rate <= 0 || !currentItem.expiryDate) {
            showToast('Please fill all item details', 'error');
            return;
        }

        setItems([...items, currentItem]);
        // Reset current item but keep expiry date as it might be same batch
        setCurrentItem({
            ...currentItem,
            productId: '',
            productName: '',
            quantity: 1,
            rate: 0,
            sellingPrice: 0
        });
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!selectedSupplier) {
            showToast('Please select a supplier', 'error');
            return;
        }
        if (items.length === 0) {
            showToast('Please add at least one item', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

            await api.post('/suppliers/invoices', {
                supplierId: selectedSupplier,
                amount: totalAmount,
                invoiceDate,
                dueDate: dueDate || undefined,
                notes,
                items
            });

            showToast('Purchase recorded successfully', 'success');
            // Reset form
            setItems([]);
            setNotes('');
            setSelectedSupplier('');
        } catch (error) {
            console.error(error);
            showToast('Failed to record purchase', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

    return (
        <OwnerLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">New Purchase Entry (Inward Stock)</h1>

                <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <select
                                    value={selectedSupplier}
                                    onChange={(e) => setSelectedSupplier(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Invoice #, Remarks, etc."
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                    <h2 className="text-lg font-bold mb-4">Add Items</h2>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
                            <select
                                value={currentItem.productId}
                                onChange={(e) => {
                                    const product = products.find(p => p.id === e.target.value);
                                    setCurrentItem({
                                        ...currentItem,
                                        productId: e.target.value,
                                        productName: product?.name || ''
                                    });
                                }}
                                className="w-full p-2 border rounded-lg text-sm"
                            >
                                <option value="">Select Product</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={currentItem.quantity}
                                onChange={(e) => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })}
                                className="w-full p-2 border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Buy Rate</label>
                            <input
                                type="number"
                                min="0"
                                value={currentItem.rate}
                                onChange={(e) => setCurrentItem({ ...currentItem, rate: Number(e.target.value) })}
                                className="w-full p-2 border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Expiry</label>
                            <input
                                type="date"
                                value={currentItem.expiryDate}
                                onChange={(e) => setCurrentItem({ ...currentItem, expiryDate: e.target.value })}
                                className="w-full p-2 border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <button
                                onClick={handleAddItem}
                                className="w-full bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 flex justify-center items-center"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Items List - Responsive Table/Cards */}
                    <div className="border rounded-lg overflow-hidden">
                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 font-medium">
                                    <tr>
                                        <th className="p-3">Product</th>
                                        <th className="p-3">Qty</th>
                                        <th className="p-3">Rate</th>
                                        <th className="p-3">Total</th>
                                        <th className="p-3">Expiry</th>
                                        <th className="p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center text-gray-400">No items added</td>
                                        </tr>
                                    ) : (
                                        items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="p-3">{item.productName}</td>
                                                <td className="p-3">{item.quantity}</td>
                                                <td className="p-3">₹{item.rate}</td>
                                                <td className="p-3 font-medium">₹{item.quantity * item.rate}</td>
                                                <td className="p-3">{item.expiryDate}</td>
                                                <td className="p-3">
                                                    <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y">
                            {items.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 text-sm">No items added</div>
                            ) : (
                                items.map((item, index) => (
                                    <div key={index} className="p-4 flex justify-between items-start bg-white">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{item.productName}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Qty: {item.quantity} × ₹{item.rate}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Exp: {item.expiryDate}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="font-bold text-indigo-600">₹{item.quantity * item.rate}</div>
                                            <button onClick={() => handleRemoveItem(index)} className="text-red-500 p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Total Footer - Shared */}
                        <div className="bg-gray-50 p-3 flex justify-between items-center border-t font-bold">
                            <span className="text-gray-700">Total Amount:</span>
                            <span className="text-indigo-600 text-lg">₹{totalAmount}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || items.length === 0}
                        className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 shadow-lg"
                    >
                        <Save size={20} /> Save Purchase
                    </button>
                </div>
            </div>
        </OwnerLayout>
    );
};

export default PurchaseEntry;
