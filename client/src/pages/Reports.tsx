import { useState, useEffect } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import api from '../api';
import { BarChart2, PieChart, TrendingUp, Package } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Reports = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'sales' | 'stock' | 'profit' | 'gst' | 'slow' | 'margin'>('sales');
    const [loading, setLoading] = useState(false);

    // Data States
    const [salesData, setSalesData] = useState<any>(null);
    const [stockData, setStockData] = useState<any>(null);
    const [profitData, setProfitData] = useState<any>(null);
    const [gstData, setGstData] = useState<any>(null);
    const [slowData, setSlowData] = useState<any>(null);
    const [marginData, setMarginData] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'sales') {
                const res = await api.get('/analytics/sales-analytics');
                setSalesData(res.data);
            } else if (activeTab === 'stock') {
                const res = await api.get('/analytics/stock-valuation');
                setStockData(res.data);
            } else if (activeTab === 'profit') {
                const res = await api.get('/analytics/profit-loss');
                setProfitData(res.data);
            } else if (activeTab === 'gst') {
                const res = await api.get('/analytics/gst-register');
                setGstData(res.data);
            } else if (activeTab === 'slow') {
                const res = await api.get('/analytics/slow-moving');
                setSlowData(res.data);
            } else if (activeTab === 'margin') {
                const res = await api.get('/analytics/item-margin');
                setMarginData(res.data);
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to fetch report data', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <OwnerLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Advanced Reports</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'sales' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
                    >
                        <BarChart2 size={18} /> Sales
                    </button>
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'stock' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
                    >
                        <Package size={18} /> Stock
                    </button>
                    <button
                        onClick={() => setActiveTab('profit')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'profit' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
                    >
                        <TrendingUp size={18} /> Profit
                    </button>
                    <button
                        onClick={() => setActiveTab('gst')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'gst' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
                    >
                        GST
                    </button>
                    <button
                        onClick={() => setActiveTab('slow')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'slow' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
                    >
                        Slow Items
                    </button>
                    <button
                        onClick={() => setActiveTab('margin')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'margin' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
                    >
                        Margins
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow p-6">
                    {activeTab === 'sales' && salesData && (
                        <div>
                            <h2 className="text-lg font-bold mb-4">Category-wise Sales</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    {salesData.categoryData.map((cat: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="font-medium">{cat.name}</span>
                                            <span className="font-bold">₹{cat.value.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {salesData.categoryData.length === 0 && (
                                        <p className="text-gray-500">No sales data available for this period.</p>
                                    )}
                                </div>
                                <div className="flex items-center justify-center bg-gray-50 rounded-lg p-6">
                                    <PieChart size={64} className="text-indigo-200" />
                                    <span className="ml-4 text-gray-500">Chart visualization coming soon</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'stock' && stockData && (
                        <div>
                            <h2 className="text-lg font-bold mb-4">Stock Valuation</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-blue-600 font-medium">Total Value</p>
                                    <p className="text-2xl font-bold text-blue-800">₹{stockData.totalValue.toFixed(2)}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-sm text-green-600 font-medium">Total Items</p>
                                    <p className="text-2xl font-bold text-green-800">{stockData.totalItems}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <p className="text-sm text-purple-600 font-medium">Unique Products</p>
                                    <p className="text-2xl font-bold text-purple-800">{stockData.productCount}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profit' && profitData && (
                        <div>
                            <h2 className="text-lg font-bold mb-4">Profit & Loss (Estimated)</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium">Total Revenue</span>
                                        <span className="font-bold text-green-600">₹{profitData.totalRevenue.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium">Cost of Goods Sold (COGS)</span>
                                        <span className="font-bold text-red-600">₹{profitData.totalCOGS.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                        <span className="font-bold text-indigo-900">Gross Profit</span>
                                        <span className="font-bold text-indigo-700">₹{profitData.grossProfit.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-6">
                                    <div className="text-4xl font-bold text-indigo-600 mb-2">{profitData.margin.toFixed(1)}%</div>
                                    <p className="text-gray-500 font-medium">Gross Margin</p>
                                </div>
                            </div>
                            <p className="mt-4 text-xs text-gray-400">
                                * Note: COGS is calculated based on the purchase price of the latest batch. Actual FIFO/LIFO tracking requires more advanced batch tracking.
                            </p>
                        </div>
                    )}

                    {activeTab === 'gst' && gstData && (
                        <div>
                            <h2 className="text-lg font-bold mb-4">GST Register</h2>
                            <div className="mb-6 grid grid-cols-3 md:grid-cols-6 gap-4">
                                <div className="bg-blue-50 p-3 rounded">
                                    <p className="text-xs font-medium text-blue-600">Taxable</p>
                                    <p className="font-bold text-blue-800">₹{gstData.summary.totalTaxable.toFixed(2)}</p>
                                </div>
                                <div className="bg-green-50 p-3 rounded">
                                    <p className="text-xs font-medium text-green-600">CGST</p>
                                    <p className="font-bold text-green-800">₹{gstData.summary.totalCGST.toFixed(2)}</p>
                                </div>
                                <div className="bg-green-50 p-3 rounded">
                                    <p className="text-xs font-medium text-green-600">SGST</p>
                                    <p className="font-bold text-green-800">₹{gstData.summary.totalSGST.toFixed(2)}</p>
                                </div>
                                <div className="bg-purple-50 p-3 rounded">
                                    <p className="text-xs font-medium text-purple-600">IGST</p>
                                    <p className="font-bold text-purple-800">₹{gstData.summary.totalIGST.toFixed(2)}</p>
                                </div>
                                <div className="bg-orange-50 p-3 rounded">
                                    <p className="text-xs font-medium text-orange-600">Total Tax</p>
                                    <p className="font-bold text-orange-800">₹{gstData.summary.totalTax.toFixed(2)}</p>
                                </div>
                                <div className="bg-indigo-50 p-3 rounded">
                                    <p className="text-xs font-medium text-indigo-600">Grand Total</p>
                                    <p className="font-bold text-indigo-800">₹{gstData.summary.grandTotal.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="p-2 text-left">Invoice</th>
                                            <th className="p-2 text-left">Customer</th>
                                            <th className="p-2 text-right">Taxable</th>
                                            <th className="p-2 text-right">CGST</th>
                                            <th className="p-2 text-right">SGST</th>
                                            <th className="p-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {gstData.transactions.map((t: any, i: number) => (
                                            <tr key={i} className="border-b hover:bg-gray-50">
                                                <td className="p-2">{t.invoiceNumber}</td>
                                                <td className="p-2">{t.customerName}</td>
                                                <td className="p-2 text-right">₹{t.taxableAmount.toFixed(2)}</td>
                                                <td className="p-2 text-right">₹{t.cgst.toFixed(2)}</td>
                                                <td className="p-2 text-right">₹{t.sgst.toFixed(2)}</td>
                                                <td className="p-2 text-right font-bold">₹{t.grandTotal.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'slow' && slowData && (
                        <div>
                            <h2 className="text-lg font-bold mb-4">Slow-moving Items</h2>
                            <div className="space-y-3">
                                {slowData.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                                        <div>
                                            <p className="font-medium">{item.productName}</p>
                                            <p className="text-sm text-gray-500">Stock: {item.currentStock} | Sales (30d): {item.salesInPeriod}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-red-600">₹{item.stockValue.toFixed(2)}</p>
                                            <p className="text-xs text-gray-500">{item.turnoverRate.toFixed(2)} units/day</p>
                                        </div>
                                    </div>
                                ))}
                                {slowData.length === 0 && (
                                    <p className="text-gray-500 text-center py-8">No slow-moving items found!</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'margin' && marginData && (
                        <div>
                            <h2 className="text-lg font-bold mb-4">Item-wise Profit Margin</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="p-3 text-left">Product</th>
                                            <th className="p-3 text-right">Qty Sold</th>
                                            <th className="p-3 text-right">Revenue</th>
                                            <th className="p-3 text-right">Cost</th>
                                            <th className="p-3 text-right">Profit</th>
                                            <th className="p-3 text-right">Margin %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {marginData.map((item: any, i: number) => (
                                            <tr key={i} className="border-b hover:bg-gray-50">
                                                <td className="p-3 font-medium">{item.productName}</td>
                                                <td className="p-3 text-right">{item.quantitySold}</td>
                                                <td className="p-3 text-right">₹{item.revenue.toFixed(2)}</td>
                                                <td className="p-3 text-right text-red-600">₹{item.cost.toFixed(2)}</td>
                                                <td className="p-3 text-right font-bold text-green-600">₹{item.profit.toFixed(2)}</td>
                                                <td className="p-3 text-right">
                                                    <span className={`px-2 py-1 rounded ${item.margin > 20 ? 'bg-green-100 text-green-800' : item.margin > 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                        {item.margin.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </OwnerLayout>
    );
};

export default Reports;

