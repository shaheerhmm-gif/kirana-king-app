import { useEffect, useState } from 'react';
import MobileLayout from '../components/MobileLayout';
import api from '../api';
import { AlertTriangle, TrendingDown, Clock, Moon, Package, TrendingUp } from 'lucide-react';
import DailySalesSummary from '../components/DailySalesSummary';
import NightCloseModal from '../components/NightCloseModal';
import { motion } from 'framer-motion';

const OwnerDashboard = () => {
    const [expiryAlerts, setExpiryAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNightClose, setShowNightClose] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/inventory/expiry-alerts');
                setExpiryAlerts(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const redAlerts = expiryAlerts.filter((a) => a.status === 'RED');
    const amberAlerts = expiryAlerts.filter((a) => a.status === 'AMBER');

    return (
        <MobileLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-dark">Morning Briefing</h1>
                        <p className="text-sm text-secondary">Here's what's happening today</p>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowNightClose(true)}
                        className="bg-secondary-dark text-white p-3 rounded-full shadow-lg shadow-secondary-dark/20"
                    >
                        <Moon size={20} />
                    </motion.button>
                </div>

                {/* Sales Summary Card */}
                <DailySalesSummary />

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white p-4 rounded-2xl shadow-card border border-gray-50"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                                <AlertTriangle size={18} />
                            </div>
                            <span className="text-xs font-medium text-secondary">Critical</span>
                        </div>
                        <h3 className="text-2xl font-bold text-secondary-dark">{redAlerts.length}</h3>
                        <p className="text-[10px] text-red-500 font-medium">Expiring &lt; 48h</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white p-4 rounded-2xl shadow-card border border-gray-50"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                                <Clock size={18} />
                            </div>
                            <span className="text-xs font-medium text-secondary">Warning</span>
                        </div>
                        <h3 className="text-2xl font-bold text-secondary-dark">{amberAlerts.length}</h3>
                        <p className="text-[10px] text-amber-500 font-medium">Expiring in 7d</p>
                    </motion.div>
                </div>

                {/* Dead Stock Banner */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 rounded-2xl shadow-lg shadow-blue-500/20 text-white relative overflow-hidden"
                >
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />

                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-blue-100 text-xs font-medium mb-1">Inventory Health</p>
                            <h3 className="text-lg font-bold">Check Dead Stock</h3>
                            <p className="text-xs text-blue-100 mt-1">Items not sold in 60+ days</p>
                        </div>
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <TrendingDown size={20} />
                        </div>
                    </div>
                </motion.div>

                {/* Action Items List */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-secondary-dark">Action Items</h2>
                        <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded-full">
                            {redAlerts.length} Pending
                        </span>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : redAlerts.length === 0 ? (
                        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <TrendingUp size={24} />
                            </div>
                            <p className="text-green-800 font-medium">All clear!</p>
                            <p className="text-green-600 text-xs mt-1">No critical expiry alerts today.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {redAlerts.map((alert, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white p-4 rounded-2xl shadow-card border border-gray-50 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-secondary-dark text-sm">{alert.productName}</p>
                                            <p className="text-xs text-red-500 font-medium">
                                                Expires {new Date(alert.expiryDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                                        Discount
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <NightCloseModal isOpen={showNightClose} onClose={() => setShowNightClose(false)} />
        </MobileLayout>
    );
};

export default OwnerDashboard;
