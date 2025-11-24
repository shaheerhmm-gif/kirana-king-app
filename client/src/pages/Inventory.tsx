import { useState, useEffect } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import { Package, AlertTriangle, Clock, Search, Edit2, Plus } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import BatchListModal from '../components/BatchListModal';
import ProductForm from '../components/ProductForm';
import { useTranslation } from 'react-i18next';

const Inventory = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'ALL' | 'LOW' | 'EXPIRING'>('ALL');
    const [products, setProducts] = useState<any[]>([]);
    const [lowStockItems, setLowStockItems] = useState<any[]>([]);
    const [expiryAlerts, setExpiryAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [viewingBatchesFor, setViewingBatchesFor] = useState<any | null>(null);
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'ALL') {
                const res = await api.get('/inventory/products');
                // Calculate total stock for each product
                const productsWithStock = res.data.map((p: any) => ({
                    ...p,
                    totalStock: p.batches?.reduce((sum: number, b: any) => sum + b.quantity, 0) || 0
                }));
                setProducts(productsWithStock);
            } else if (activeTab === 'LOW') {
                const res = await api.get('/inventory/low-stock');
                setLowStockItems(res.data);
            } else if (activeTab === 'EXPIRING') {
                const res = await api.get('/inventory/expiry-alerts');
                setExpiryAlerts(res.data);
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to fetch inventory data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustment = async (data: any) => {
        try {
            await api.post('/inventory/adjust', data);
            showToast('Stock adjusted successfully', 'success');
            setSelectedProduct(null);
            fetchData(); // Refresh data
        } catch (error) {
            console.error(error);
            showToast('Failed to adjust stock', 'error');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.includes(searchTerm)
    );

    return (
        <OwnerLayout>
            <div className="flex flex-col h-[calc(100vh-8rem)]">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">{t('inventory.title')}</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('ALL')}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Package size={18} /> {t('inventory.all_stock')}
                        </button>
                        <button
                            onClick={() => setActiveTab('LOW')}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'LOW' ? 'bg-red-600 text-white' : 'bg-white text-red-600 hover:bg-red-50'
                                }`}
                        >
                            <AlertTriangle size={18} /> {t('inventory.low_stock')}
                        </button>
                        <button
                            onClick={() => setActiveTab('EXPIRING')}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'EXPIRING' ? 'bg-amber-600 text-white' : 'bg-white text-amber-600 hover:bg-amber-50'
                                }`}
                        >
                            <Clock size={18} /> {t('inventory.expiring')}
                        </button>
                        <button
                            onClick={() => setIsCreatingProduct(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <Plus size={18} /> {t('inventory.add_product')}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border flex-1 overflow-hidden flex flex-col">
                    {/* Toolbar */}
                    {activeTab === 'ALL' && (
                        <div className="p-4 border-b flex gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder={t('inventory.search_placeholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'ALL' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredProducts.map(product => (
                                            <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-gray-800">{product.name}</h3>
                                                        <p className="text-sm text-gray-500">{product.barcode || 'No Barcode'}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.totalStock === 0 ? 'bg-red-100 text-red-700' :
                                                        product.totalStock < 5 ? 'bg-amber-100 text-amber-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>
                                                        {product.totalStock} {t('inventory.in_stock')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mt-4">
                                                    <p className="font-bold text-indigo-600">₹{product.batches?.[0]?.sellingPrice || 0}</p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setViewingBatchesFor(product)}
                                                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title={t('inventory.view_batches')}
                                                        >
                                                            <Clock size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingProduct(product)}
                                                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title={t('inventory.edit_product')}
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedProduct(product)}
                                                            className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                                                        >
                                                            {t('inventory.adjust')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'LOW' && (
                                    <div className="space-y-3">
                                        {lowStockItems.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500">{t('inventory.no_low_stock')}</div>
                                        ) : (
                                            lowStockItems.map(item => (
                                                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-100">
                                                    <div>
                                                        <h3 className="font-bold text-gray-800">{item.name}</h3>
                                                        <p className="text-sm text-red-600 font-medium">{t('inventory.only_left', { count: item.totalStock })}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedProduct(item)}
                                                        className="px-5 py-3 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-100 font-medium shadow-sm active:bg-red-200 transition-colors"
                                                    >
                                                        {t('inventory.restock_adjust')}
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'EXPIRING' && (
                                    <div className="space-y-3">
                                        {expiryAlerts.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500">{t('inventory.no_expiring')}</div>
                                        ) : (
                                            expiryAlerts.map((alert, idx) => (
                                                <div key={idx} className={`flex items-center justify-between p-4 border rounded-lg ${alert.status === 'RED' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
                                                    }`}>
                                                    <div>
                                                        <h3 className="font-bold text-gray-800">{alert.productName}</h3>
                                                        <p className="text-sm text-gray-600">
                                                            Expires: {new Date(alert.expiryDate).toLocaleDateString()}
                                                            <span className="font-bold ml-2">{t('inventory.days_left', { days: alert.daysLeft })}</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-lg">{alert.quantity} units</p>
                                                        <p className="text-xs text-gray-500">{t('inventory.batch_qty')}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {selectedProduct && (
                <StockAdjustmentModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onConfirm={handleAdjustment}
                />
            )}

            {viewingBatchesFor && (
                <BatchListModal
                    product={viewingBatchesFor}
                    onClose={() => setViewingBatchesFor(null)}
                    onUpdate={() => {
                        fetchData();
                        setViewingBatchesFor(null);
                    }}
                />
            )}

            {(isCreatingProduct || editingProduct) && (
                <ProductForm
                    onClose={() => {
                        setIsCreatingProduct(false);
                        setEditingProduct(null);
                    }}
                    onSuccess={() => {
                        setIsCreatingProduct(false);
                        setEditingProduct(null);
                        fetchData();
                    }}
                    initialData={editingProduct}
                />
            )}
        </OwnerLayout>
    );
};

export default Inventory;
