import { useEffect, useState } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import api from '../api';
import { AlertTriangle, TrendingDown, Clock, Moon } from 'lucide-react';
import DailySalesSummary from '../components/DailySalesSummary';
import NightCloseModal from '../components/NightCloseModal';

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
        <OwnerLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Morning Briefing</h1>
                <button
                    onClick={() => setShowNightClose(true)}
                    className="bg-indigo-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-800 shadow-md transition-all"
                >
                    <Moon size={18} />
                    <span>Night Close</span>
                </button>
            </div>

            <DailySalesSummary />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-700 font-semibold">Critical Expiry</p>
                            <h3 className="text-3xl font-bold text-red-800">{redAlerts.length}</h3>
                        </div>
                        <AlertTriangle className="text-red-500" size={32} />
                    </div>
                    <p className="text-sm text-red-600 mt-2">Items expiring in &lt; 48 hours</p>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-700 font-semibold">Approaching Expiry</p>
                            <h3 className="text-3xl font-bold text-yellow-800">{amberAlerts.length}</h3>
                        </div>
                        <Clock className="text-yellow-500" size={32} />
                    </div>
                    <p className="text-sm text-yellow-600 mt-2">Items expiring in 7 days</p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-700 font-semibold">Dead Stock</p>
                            <h3 className="text-3xl font-bold text-blue-800">--</h3>
                        </div>
                        <TrendingDown className="text-blue-500" size={32} />
                    </div>
                    <p className="text-sm text-blue-600 mt-2">Items not sold in 60 days</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold mb-4">Action Items</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : redAlerts.length === 0 ? (
                    <p className="text-gray-500">No critical alerts today. Good job!</p>
                ) : (
                    <div className="space-y-4">
                        {redAlerts.map((alert, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-red-50 p-4 rounded border border-red-100">
                                <div>
                                    <p className="font-semibold text-red-800">{alert.productName}</p>
                                    <p className="text-sm text-red-600">Expires: {new Date(alert.expiryDate).toLocaleDateString()} ({alert.quantity} units)</p>
                                </div>
                                <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">
                                    Discount Now
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <NightCloseModal isOpen={showNightClose} onClose={() => setShowNightClose(false)} />
        </OwnerLayout>
    );
};

export default OwnerDashboard;
