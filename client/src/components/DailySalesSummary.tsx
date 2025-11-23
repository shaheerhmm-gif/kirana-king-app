import { useEffect, useState } from 'react';
import api from '../api';
import { TrendingUp, ShoppingBag, AlertCircle } from 'lucide-react';

const DailySalesSummary = () => {
    const [summary, setSummary] = useState<any>(null);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const res = await api.get('/sales/daily');
            setSummary(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    if (!summary) return <div>Loading summary...</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-lg font-bold mb-4">Today's Sales Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2 text-green-700 mb-1">
                        <TrendingUp size={20} />
                        <span className="font-semibold">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-green-800">₹{summary.totalRevenue}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-700 mb-1">
                        <ShoppingBag size={20} />
                        <span className="font-semibold">Items Sold</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-800">{summary.totalItemsSold}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-2 text-purple-700 mb-1">
                        <AlertCircle size={20} />
                        <span className="font-semibold">Transactions</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-800">{summary.totalSales}</p>
                </div>
            </div>

            {/* Item Breakdown */}
            <div className="mt-6">
                <h3 className="font-semibold mb-3 text-gray-700">Items Sold Today</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {summary.sales.length === 0 ? (
                        <p className="text-gray-500 text-sm">No sales yet today.</p>
                    ) : (
                        <ul className="space-y-2">
                            {summary.sales.flatMap((sale: any) => sale.items).map((item: any, idx: number) => (
                                <li key={idx} className="flex justify-between text-sm border-b border-gray-200 pb-1 last:border-0">
                                    <span className="font-medium text-gray-800">{item.product.name}</span>
                                    <div className="flex gap-4 text-gray-600">
                                        <span>x{item.quantity}</span>
                                        <span>₹{item.rate * item.quantity}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailySalesSummary;
