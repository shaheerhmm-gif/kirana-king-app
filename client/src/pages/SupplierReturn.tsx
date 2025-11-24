import { useState, useEffect } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import api from '../api';
import { Package, Trash2, Search } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const SupplierReturn = () => {
    const { showToast } = useToast();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [returnItems, setReturnItems] = useState<any[]>([]);
    const [returnReason, setReturnReason] = useState('');

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
            const res = await api.get('/inventory/products');
            setProducts(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredProducts = products.filter((p: any) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (!selectedSupplier || p.supplierId === selectedSupplier)
    );

    const addToReturn = (product: any) => {
        if (returnItems.find((i: any) => i.productId === product.id)) return;

        setReturnItems([...returnItems, {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            rate: product.batches?.[0]?.purchasePrice || 0,
            reason: 'DAMAGED'
        }]);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...returnItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setReturnItems(newItems);
    };

    const removeItem = (index: number) => {
        setReturnItems(returnItems.filter((_: any, i: number) => i !== index));
    };

    const handleSubmit = async () => {
        if (!selectedSupplier) {
            showToast('Please select a supplier', 'error');
            return;
        }
        if (returnItems.length === 0) {
            showToast('Please add items to return', 'error');
            return;
        }

        try {
            const totalAmount = returnItems.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);

            await api.post('/returns', {
                supplierId: selectedSupplier,
                items: returnItems,
                reason: returnReason,
                totalAmount
            });

            showToast('Return processed successfully', 'success');
            setReturnItems([]);
            setReturnReason('');
            setSelectedSupplier('');
        } catch (error) {
            console.error(error);
            showToast('Failed to process return', 'error');
        }
    };

    return (
        <OwnerLayout>
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Supplier Returns</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
                    {/* Left: Product Selection */}
                    <div className="lg:col-span-2 flex flex-col bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Supplier</label>
                                <select
                                    value={selectedSupplier}
                                    onChange={(e) => setSelectedSupplier(e.target.value)}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    <option value="">All Suppliers</option>
                                    {suppliers.map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full pl-10 p-2 border rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {filteredProducts.map((product: any) => {
                                    const stock = product.batches?.reduce((sum: number, b: any) => sum + b.quantity, 0) || 0;
                                    return (
                                        <button
                                            key={product.id}
                                            onClick={() => addToReturn(product)}
                                            className="p-3 border rounded-lg text-left hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                                        >
                                            <p className="font-medium truncate">{product.name}</p>
                                            <p className="text-sm text-gray-500">Stock: {stock}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right: Return Cart */}
                    <div className="flex flex-col bg-white rounded-lg shadow h-full overflow-hidden">
                        <div className="p-4 border-b bg-gray-50">
                            <h2 className="font-bold text-lg">Return Items</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {returnItems.length === 0 ? (
                                <div className="text-center text-gray-400 py-10">
                                    No items selected
                                </div>
                            ) : (
                                returnItems.map((item: any, index: number) => (
                                    <div key={index} className="bg-gray-50 p-3 rounded-lg border">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-sm">{item.productName}</span>
                                            <button onClick={() => removeItem(index)} className="text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <div>
                                                <label className="text-xs text-gray-500">Qty</label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                                    className="w-full p-1 border rounded text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Rate</label>
                                                <input
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value))}
                                                    className="w-full p-1 border rounded text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Reason</label>
                                            <select
                                                value={item.reason}
                                                onChange={(e) => updateItem(index, 'reason', e.target.value)}
                                                className="w-full p-1 border rounded text-sm"
                                            >
                                                <option value="DAMAGED">Damaged</option>
                                                <option value="EXPIRED">Expired</option>
                                                <option value="SLOW_MOVING">Slow Moving</option>
                                                <option value="WRONG_ITEM">Wrong Item</option>
                                            </select>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t p-4 space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Return Notes</label>
                                <textarea
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    className="w-full p-2 border rounded-lg text-sm"
                                    rows={2}
                                    placeholder="Optional notes..."
                                />
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={returnItems.length === 0}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Package size={20} />
                                Process Return ({returnItems.length} items)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </OwnerLayout>
    );
};

export default SupplierReturn;
