import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import OwnerLayout from '../components/OwnerLayout';
import { TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const OwnerDashboard = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        totalSales: 0,
        lowStockCount: 0,
        expiringSoonCount: 0,
        todaysSales: 0
    });
    const [salesData, setSalesData] = useState<any[]>([]);
    const [topItems, setTopItems] = useState<any[]>([]);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        fetchDashboardData();
        setGreeting(getGreeting());
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const fetchDashboardData = async () => {
        try {
            const [expiryRes, salesRes, topRes] = await Promise.all([
                api.get('/inventory/expiry-alerts'),
                api.get(`/analytics/daily-sales?startDate=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}&endDate=${new Date().toISOString()}`),
                api.get('/analytics/top-items')
            ]);

            const today = new Date().toISOString().split('T')[0];
            const todaysSales = salesRes.data.sales
                .filter((s: any) => s.createdAt.startsWith(today))
                .reduce((sum: number, s: any) => sum + s.totalAmount, 0);

            setStats({
                totalSales: salesRes.data.summary.totalSales,
                lowStockCount: 0, // TODO: Add endpoint
                expiringSoonCount: expiryRes.data.expiringSoon.length + expiryRes.data.expired.length,
                todaysSales
            });

            // Process sales data for chart
            const chartData = salesRes.data.sales.reduce((acc: any[], sale: any) => {
                const date = new Date(sale.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
                const existing = acc.find(d => d.name === date);
                if (existing) {
                    existing.sales += sale.totalAmount;
                } else {
                    acc.push({ name: date, sales: sale.totalAmount });
                }
                return acc;
            }, []).slice(-7); // Last 7 days

            setSalesData(chartData);
            setTopItems(topRes.data.slice(0, 5));

        } catch (error) {
            console.error(error);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <OwnerLayout>
            <motion.div
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header Section */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                            {greeting}, {user?.name || 'Owner'}! 👋
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.welcome')}</p>
                    </div>
                    <div className="hidden md:block">
                        <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-full text-sm font-medium">
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Sales</p>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{stats.todaysSales.toLocaleString()}</h3>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
                            <TrendingUp size={16} className="mr-1" />
                            <span>+12% from yesterday</span>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{stats.totalSales.toLocaleString()}</h3>
                            </div>
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <Package size={24} />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Critical Expiry</p>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.expiringSoonCount}</h3>
                            </div>
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                                <AlertTriangle size={24} />
                            </div>
                        </div>
                        <Link to="/owner/expiry" className="mt-4 inline-block text-sm text-red-600 dark:text-red-400 hover:underline">
                            View Details &rarr;
                        </Link>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
                        <h3 className="font-bold text-lg mb-2">Quick Actions</h3>
                        <div className="space-y-2">
                            <Link to="/owner/quick-sale" className="block w-full bg-white/20 hover:bg-white/30 transition-colors py-2 px-4 rounded-lg text-sm font-medium text-center backdrop-blur-sm">
                                New Sale (POS)
                            </Link>
                            <Link to="/purchase/orders" className="block w-full bg-white/20 hover:bg-white/30 transition-colors py-2 px-4 rounded-lg text-sm font-medium text-center backdrop-blur-sm">
                                Order Stock
                            </Link>
                            <button
                                onClick={() => {
                                    const url = `${window.location.origin}/store/${user?.storeId}`;
                                    const text = `🛒 Order online from *${user?.name || 'Kirana King'}*!\n\nClick here: ${url}`;
                                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                                className="block w-full bg-white text-indigo-700 hover:bg-gray-100 transition-colors py-2 px-4 rounded-lg text-sm font-bold text-center shadow-sm"
                            >
                                🔗 Share Store Link
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Charts & Insights Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sales Chart */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Sales Trend (Last 7 Days)</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Top Movers & Dead Stock */}
                    <div className="space-y-6">
                        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Top Movers 🚀</h3>
                            <div className="space-y-4">
                                {topItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{item.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{item.soldQuantity} sold</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">₹{item.price}</span>
                                    </div>
                                ))}
                                {topItems.length === 0 && <p className="text-gray-400 text-sm">No sales data yet.</p>}
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 p-6 rounded-2xl">
                            <h3 className="text-lg font-bold text-orange-800 dark:text-orange-300 mb-2">Dead Stock Alert ⚠️</h3>
                            <p className="text-sm text-orange-700 dark:text-orange-400 mb-4">
                                You have items that haven't sold in 60+ days. Clear them out to free up cash!
                            </p>
                            <Link to="/owner/analytics" className="w-full block text-center bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 py-2 rounded-lg font-bold text-sm shadow-sm hover:shadow-md transition-shadow">
                                View Inventory Insight
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </OwnerLayout>
    );
};

export default OwnerDashboard;
