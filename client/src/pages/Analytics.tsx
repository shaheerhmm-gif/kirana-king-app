import { useEffect, useState } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import api from '../api';
import { TrendingUp, DollarSign, Calendar, BarChart2, Trash2, Users, AlertTriangle } from 'lucide-react';

const Analytics = () => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SALES' | 'PROFIT' | 'GST' | 'INSIGHTS'>('OVERVIEW');
    const [deadStock, setDeadStock] = useState<any[]>([]);
    const [topItems, setTopItems] = useState<any[]>([]);
    const [salesData, setSalesData] = useState<any>(null);
    const [profitData, setProfitData] = useState<any>(null);
    const [gstData, setGstData] = useState<any>(null);
    const [itemMargins, setItemMargins] = useState<any[]>([]);
    const [churnData, setChurnData] = useState<any[]>([]);
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
        if (activeTab === 'GST') fetchGSTData();
        if (activeTab === 'INSIGHTS') fetchInsightsData();
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
            const [profitRes, marginRes] = await Promise.all([
                api.get(`/analytics/profit-loss?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
                api.get(`/analytics/item-margin?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
            ]);
            setProfitData(profitRes.data);
            setItemMargins(marginRes.data.slice(0, 10)); // Top 10
        } catch (error) {
            console.error(error);
        }
    };

    const fetchGSTData = async () => {
        try {
            const res = await api.get(`/analytics/gst-register?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
            setGstData(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchInsightsData = async () => {
        try {
            const res = await api.get('/analytics/churn?days=30');
            setChurnData(res.data);
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
                            <TrendingUp size={18} /> Sales
                        </button>
                        <button
                            onClick={() => setActiveTab('PROFIT')}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'PROFIT' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <DollarSign size={18} /> Profit
                        </button>
                        <button
                            onClick={() => setActiveTab('GST')}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'GST' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Calendar size={18} /> GST
                        </button>
                        <button
                            onClick={() => setActiveTab('INSIGHTS')}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'INSIGHTS' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Users size={18} /> Insights
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border flex-1 overflow-hidden flex flex-col">
                    {/* Date Filter for Reports */}
                    {(activeTab === 'SALES' || activeTab === 'PROFIT' || activeTab === 'GST') && (
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
                                {/* Top Items Heatmap Style */}
                                <div>
                                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <TrendingUp className="text-green-600" /> Top Selling Items (Heatmap)
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                        {topItems.map((item, idx) => {
                                            // Calculate intensity based on rank (0-1)
                                            const intensity = 1 - (idx / topItems.length);
                                            return (
                                                <div
                                                    key={idx}
                                                    className="p-3 rounded-lg flex flex-col justify-between h-24 transition-transform hover:scale-105"
                                                    style={{
                                                        backgroundColor: `rgba(79, 70, 229, ${0.1 + (intensity * 0.9)})`,
                                                        color: intensity > 0.5 ? 'white' : '#1e1b4b'
                                                    }}
                                                >
                                                    <span className="font-bold text-sm truncate" title={item.name}>{item.name}</span>
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-xs opacity-80">{item.soldQuantity} sold</span>
                                                        <span className="font-bold text-xs">₹{item.price}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
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

                                {/* Top Profitable Items */}
                                <div>
                                    <h3 className="font-bold text-gray-800 mb-4">🏆 Top Profitable Items</h3>
                                    <div className="overflow-x-auto border rounded-lg bg-white">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sold</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {itemMargins.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.productName}</td>
                                                        <td className="px-6 py-4 text-sm text-right text-gray-500">{item.quantitySold}</td>
                                                        <td className="px-6 py-4 text-sm text-right text-gray-900">₹{item.revenue.toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-sm text-right font-bold text-green-600">₹{item.profit.toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-sm text-right">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.margin > 20 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                {item.margin.toFixed(1)}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'GST' && gstData && (
                            <div className="space-y-6">
                                {/* GST Summary */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <div className="text-indigo-600 text-sm font-medium">Total Taxable Value</div>
                                        <div className="text-2xl font-bold text-indigo-900">₹{gstData.summary.totalTaxable.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                        <div className="text-green-600 text-sm font-medium">Total Tax Liability</div>
                                        <div className="text-2xl font-bold text-green-900">₹{gstData.summary.totalTax.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <div className="text-blue-600 text-sm font-medium">CGST + SGST</div>
                                        <div className="text-2xl font-bold text-blue-900">₹{(gstData.summary.totalCGST + gstData.summary.totalSGST).toLocaleString()}</div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                        <div className="text-purple-600 text-sm font-medium">IGST</div>
                                        <div className="text-2xl font-bold text-purple-900">₹{gstData.summary.totalIGST.toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Export Button */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => {
                                            // Simple CSV Export
                                            const headers = ['Invoice No', 'Date', 'Customer', 'GSTIN', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Grand Total'];
                                            const rows = gstData.transactions.map((t: any) => [
                                                t.invoiceNumber,
                                                new Date(t.date).toLocaleDateString(),
                                                t.customerName,
                                                t.gstin,
                                                t.taxableAmount,
                                                t.cgst,
                                                t.sgst,
                                                t.igst,
                                                t.totalTax,
                                                t.grandTotal
                                            ]);

                                            const csvContent = "data:text/csv;charset=utf-8,"
                                                + headers.join(",") + "\n"
                                                + rows.map((e: any[]) => e.join(",")).join("\n");

                                            const encodedUri = encodeURI(csvContent);
                                            const link = document.createElement("a");
                                            link.setAttribute("href", encodedUri);
                                            link.setAttribute("download", `gst_report_${dateRange.startDate}_${dateRange.endDate}.csv`);
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <Calendar size={18} /> Download GSTR-1 (CSV)
                                    </button>
                                </div>

                                {/* GST Register Table */}
                                <div>
                                    <h3 className="font-bold text-gray-800 mb-3">Sales Register (GSTR-1)</h3>
                                    <div className="overflow-x-auto border rounded-lg bg-white">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CGST</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SGST</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {gstData.transactions.map((t: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{t.invoiceNumber}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            {t.customerName}
                                                            {t.gstin !== 'N/A' && <span className="block text-xs text-indigo-600">{t.gstin}</span>}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-right text-gray-900">₹{t.taxableAmount.toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-sm text-right text-gray-500">₹{t.cgst.toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-sm text-right text-gray-500">₹{t.sgst.toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">₹{t.grandTotal.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'INSIGHTS' && (
                            <div className="space-y-6">
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-amber-900">Churn Risk Alert</h2>
                                            <p className="text-amber-800 text-sm mt-1">
                                                These customers haven't visited in the last 30 days. Reach out to them with a special offer!
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {churnData.map((customer) => (
                                        <div key={customer.id} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-800">{customer.name}</h3>
                                                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                                                    {customer.daysSince} days ago
                                                </span>
                                            </div>
                                            <p className="text-gray-500 text-sm mb-4">{customer.phone}</p>

                                            <a
                                                href={`https://wa.me/${customer.phone}?text=Hello ${customer.name}, we missed you! Here is a special offer for you.`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block w-full text-center bg-green-500 text-white py-2 rounded-lg font-bold hover:bg-green-600 transition-colors"
                                            >
                                                Send Offer (WhatsApp)
                                            </a>
                                        </div>
                                    ))}
                                    {churnData.length === 0 && (
                                        <div className="col-span-full text-center py-10 text-gray-400">
                                            No customers found at risk of churn. Great job!
                                        </div>
                                    )}
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
