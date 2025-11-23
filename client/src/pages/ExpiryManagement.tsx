import { useState, useEffect } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import { Calendar, TrendingDown, AlertCircle } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';

interface ExpiryItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    expiryDate: string;
    sellingPrice: number;
    purchasePrice: number;
}

interface ExpiryData {
    expired: ExpiryItem[];
    expiring15Days: ExpiryItem[];
    expiring30Days: ExpiryItem[];
    totalValue: {
        expired: number;
        expiring15Days: number;
        expiring30Days: number;
    };
}

export const ExpiryManagement = () => {
    const [data, setData] = useState<ExpiryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [discountPercent, setDiscountPercent] = useState(20);
    const { showToast } = useToast();

    useEffect(() => {
        fetchExpiringItems();
    }, []);

    const fetchExpiringItems = async () => {
        setLoading(true);
        try {
            const res = await api.get('/expiry/items');
            setData(res.data);
        } catch (error) {
            console.error(error);
            showToast('Failed to load expiry data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMoveToDiscount = async (batchId: string) => {
        try {
            await api.put(`/expiry/${batchId}/discount`, { discountPercent });
            showToast(`Applied ${discountPercent}% discount!`, 'success');
            fetchExpiringItems();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to apply discount', 'error');
        }
    };

    const getDaysUntilExpiry = (expiryDate: string) => {
        const expiry = new Date(expiryDate);
        const today = new Date();
        const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    if (loading) {
        return (
            <OwnerLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </OwnerLayout>
        );
    }

    if (!data) return null;

    return (
        <OwnerLayout>
            <div className="max-w-6xl mx-auto p-4 space-y-6">
                <h1 className="text-3xl font-bold text-gray-800">Expiry Management</h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-red-800">Expired</h3>
                            <AlertCircle size={24} className="text-red-600" />
                        </div>
                        <p className="text-3xl font-bold text-red-800">{data.expired.length}</p>
                        <p className="text-sm text-red-600">Value: ₹{data.totalValue.expired.toFixed(0)}</p>
                    </div>
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-orange-800">15 Days</h3>
                            <TrendingDown size={24} className="text-orange-600" />
                        </div>
                        <p className="text-3xl font-bold text-orange-800">{data.expiring15Days.length}</p>
                        <p className="text-sm text-orange-600">Value: ₹{data.totalValue.expiring15Days.toFixed(0)}</p>
                    </div>
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-yellow-800">30 Days</h3>
                            <Calendar size={24} className="text-yellow-600" />
                        </div>
                        <p className="text-3xl font-bold text-yellow-800">{data.expiring30Days.length}</p>
                        <p className="text-sm text-yellow-600">Value: ₹{data.totalValue.expiring30Days.toFixed(0)}</p>
                    </div>
                </div>

                {/* Discount Control */}
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <label className="block text-sm font-medium mb-2">Default Discount %</label>
                    <input
                        type="number"
                        className="border rounded-lg px-3 py-2 w-32"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                        min="0"
                        max="100"
                    />
                </div>

                {/* Expired Items */}
                {data.expired.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="bg-red-500 text-white p-4 rounded-t-xl">
                            <h2 className="text-xl font-bold">Expired Items</h2>
                        </div>
                        <div className="divide-y">
                            {data.expired.map(item => (
                                <div key={item.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg">{item.productName}</h3>
                                            <p className="text-sm text-gray-600">
                                                Qty: {item.quantity} | Expired: {new Date(item.expiryDate).toLocaleDateString()}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Purchase: ₹{item.purchasePrice} | Selling: ₹{item.sellingPrice}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleMoveToDiscount(item.id)}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                                        >
                                            Apply {discountPercent}% OFF
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Expiring in 15 Days */}
                {data.expiring15Days.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="bg-orange-500 text-white p-4 rounded-t-xl">
                            <h2 className="text-xl font-bold">Expiring in 15 Days</h2>
                        </div>
                        <div className="divide-y">
                            {data.expiring15Days.map(item => {
                                const daysLeft = getDaysUntilExpiry(item.expiryDate);
                                return (
                                    <div key={item.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg">{item.productName}</h3>
                                                <p className="text-sm text-gray-600">
                                                    Qty: {item.quantity} | Expires in: {daysLeft} days
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Purchase: ₹{item.purchasePrice} | Selling: ₹{item.sellingPrice}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleMoveToDiscount(item.id)}
                                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                                            >
                                                Apply {discountPercent}% OFF
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Expiring in 30 Days */}
                {data.expiring30Days.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="bg-yellow-500 text-yellow-900 p-4 rounded-t-xl">
                            <h2 className="text-xl font-bold">Expiring in 30 Days</h2>
                        </div>
                        <div className="divide-y">
                            {data.expiring30Days.map(item => {
                                const daysLeft = getDaysUntilExpiry(item.expiryDate);
                                return (
                                    <div key={item.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg">{item.productName}</h3>
                                                <p className="text-sm text-gray-600">
                                                    Qty: {item.quantity} | Expires in: {daysLeft} days
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Purchase: ₹{item.purchasePrice} | Selling: ₹{item.sellingPrice}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleMoveToDiscount(item.id)}
                                                className="px-4 py-2 bg-yellow-600 text-yellow-900 rounded-lg hover:bg-yellow-700 text-sm font-medium"
                                            >
                                                Apply {discountPercent}% OFF
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {data.expired.length === 0 && data.expiring15Days.length === 0 && data.expiring30Days.length === 0 && (
                    <div className="bg-white rounded-xl p-8 text-center">
                        <Calendar size={48} className="mx-auto mb-4 text-green-500" />
                        <p className="text-gray-600 font-medium">All clear! No items expiring soon.</p>
                    </div>
                )}
            </div>
        </OwnerLayout>
    );
};
