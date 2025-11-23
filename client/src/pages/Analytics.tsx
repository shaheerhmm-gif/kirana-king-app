import { useEffect, useState } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import api from '../api';
import { TrendingUp, DollarSign, Calendar, BarChart2, Trash2 } from 'lucide-react';

const Analytics = () => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SALES' | 'PROFIT'>('OVERVIEW');
    const [deadStock, setDeadStock] = useState<any[]>([]);
    const [topItems, setTopItems] = useState<any[]>([]);
    const [salesData, setSalesData] = useState<any>(null);
    const [profitData, setProfitData] = useState<any>(null);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchOverviewData();
    }, []);

    useEffect(() => {
        if (activeTab === 'SALES') fetchSalesData();
        if (activeTab === 'PROFIT') fetchProfitData();
    }, [activeTab, dateRange]);

    const fetchOverviewData = async () => {
        try {
            const [deadRes, topRes] = await Promise.all([
                api.get('/analytics/dead-stock'),
                api.get('/analytics/top-items')
            ]);
            setDeadStock(deadRes.data);
            setTopItems(topRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSalesData = async () => {
        try {
            const res = await api.get(`/analytics/daily-sales?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
            setSalesData(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchProfitData = async () => {
        try {
            const res = await api.get(`/analytics/profit-loss?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
            setProfitData(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <OwnerLayout>
            <div className="flex flex-col h-[calc(100vh-8rem)]">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('OVERVIEW')}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'OVERVIEW' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <BarChart2 size={18} /> Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('SALES')}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'SALES' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <TrendingUp size={18} /> Sales Report
                        </button>
                        <button
                            onClick={() => setActiveTab('PROFIT')}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'PROFIT' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <DollarSign size={18} /> Profit & Loss
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border flex-1 overflow-hidden flex flex-col">
                    {/* Date Filter for Reports */}
                    {(activeTab === 'SALES' || activeTab === 'PROFIT') && (
                        <div className="p-4 border-b bg-gray-50 flex gap-4 items-center">
                            <Calendar size={20} className="text-gray-500" />
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                className="border rounded-lg px-3 py-1"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                className="border rounded-lg px-3 py-1"
                            />
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'OVERVIEW' && (
                            <div className="space-y-8">
                                {/* Top Items */}
                                <div>
                                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <TrendingUp className="text-green-600" /> Top Selling Items (Last 30 Days)
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                                        {topItems.map((item, idx) => (
                                            <div key={idx} className="border rounded-lg p-4 flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-gray-800">{item.name}</div>
                                                    <div className="text-sm text-gray-500">Sold: {item.soldQuantity} units</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-indigo-600">₹{item.price}</div>
                                                    <div className="text-xs text-gray-400">{item.stock} in stock</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Dead Stock */}
                                <div>
                                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Trash2 className="text-red-600" /> Dead Stock (No sales in 60+ days)
                                    </h2>
                                    <div className="overflow-x-auto border rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Product</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Stock</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Value Locked</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Last Sale</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {deadStock.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.stock}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">₹{item.valueLocked}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                            {item.lastSale === 'Never' ? 'Never' : new Date(item.lastSale).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'SALES' && salesData && (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <div className="text-indigo-600 text-sm font-medium">Total Sales</div>
                                        <div className="text-2xl font-bold text-indigo-900">₹{salesData.summary.totalSales.toLocaleString()}</div>
                                        <div className="text-xs text-indigo-400 mt-1">{salesData.summary.count} Transactions</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                        <div className="text-green-600 text-sm font-medium">Cash Collected</div>
                                        <div className="text-2xl font-bold text-green-900">₹{salesData.summary.cash.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <div className="text-blue-600 text-sm font-medium">UPI / Online</div>
                                        <div className="text-2xl font-bold text-blue-900">₹{(salesData.summary.upi + salesData.summary.card).toLocaleString()}</div>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                        <div className="text-amber-600 text-sm font-medium">Credit Given</div>
                                        <div className="text-2xl font-bold text-amber-900">₹{salesData.summary.credit.toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Transaction List */}
                                <div>
                                    <h3 className="font-bold text-gray-800 mb-3">Recent Transactions</h3>
                                    <div className="overflow-x-auto border rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Customer</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Mode</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {salesData.sales.map((sale: any) => (
                                                    <tr key={sale.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(sale.createdAt).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {sale.customer?.name || 'Walk-in Customer'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${sale.paymentMode === 'CASH' ? 'bg-green-100 text-green-800' :
                                                                sale.paymentMode === 'CREDIT' ? 'bg-amber-100 text-amber-800' :
                                                                    'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                {sale.paymentMode}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                                            ₹{sale.totalAmount}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'PROFIT' && profitData && (
                            <div className="max-w-4xl mx-auto space-y-8">
                                <div className="bg-white p-8 rounded-2xl border shadow-sm text-center">
                                    <h2 className="text-gray-500 font-medium mb-2">Gross Profit</h2>
                                    <div className={`text-5xl font-bold mb-4 ${profitData.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ₹{profitData.grossProfit.toLocaleString()}
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                                        Margin: {profitData.margin.toFixed(2)}%
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 bg-gray-50 rounded-xl border">
                                        <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
                                        <div className="text-2xl font-bold text-gray-800">₹{profitData.totalRevenue.toLocaleString()}</div>
                                        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 w-full"></div>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-gray-50 rounded-xl border">
                                        <div className="text-sm text-gray-500 mb-1">Cost of Goods Sold (COGS)</div>
                                        <div className="text-2xl font-bold text-gray-800">₹{profitData.totalCOGS.toLocaleString()}</div>
                                        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-red-500 transition-all duration-500"
                                                style={{ width: `${(profitData.totalCOGS / profitData.totalRevenue) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                    <h3 className="font-bold text-blue-900 mb-2">💡 Profit Insight</h3>
                                    <p className="text-blue-800 text-sm">
                                        Your current margin is <span className="font-bold">{profitData.margin.toFixed(1)}%</span>.
                                        {profitData.margin < 15
                                            ? " This is slightly low. Consider reviewing your pricing strategy or negotiating better rates with suppliers."
                                            : " This is a healthy margin for a retail business. Keep it up!"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </OwnerLayout>
    );
};

export default Analytics;
