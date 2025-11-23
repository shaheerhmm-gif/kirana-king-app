import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/MobileLayout';
import {
    Users, FileText, Package, Wheat, Calendar, HelpCircle,
    LogOut, ChevronRight, Truck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Menu = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const menuItems = [
        {
            title: 'Credit / Udhaar',
            desc: 'Manage customer debts',
            icon: Users,
            path: '/owner/credit',
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            title: 'Invoices',
            desc: 'View past customer bills',
            icon: FileText,
            path: '/owner/invoices',
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        },
        {
            title: 'Suppliers',
            desc: 'Manage supplier bills',
            icon: Truck,
            path: '/owner/suppliers',
            color: 'text-orange-600',
            bg: 'bg-orange-50'
        },
        {
            title: 'Purchase Entry',
            desc: 'Add incoming stock',
            icon: Package,
            path: '/owner/purchase',
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            title: 'Loose Items',
            desc: 'Sugar, Rice, Oil etc.',
            icon: Wheat,
            path: '/owner/loose-inventory',
            color: 'text-yellow-600',
            bg: 'bg-yellow-50'
        },
        {
            title: 'Expiry Check',
            desc: 'Track expiring items',
            icon: Calendar,
            path: '/owner/expiry',
            color: 'text-red-600',
            bg: 'bg-red-50'
        },
        {
            title: 'App Guide',
            desc: 'How to use the app',
            icon: HelpCircle,
            path: '/owner/guide',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        }
    ];

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/login');
        }
    };

    return (
        <MobileLayout>
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500">
                        {user?.name?.charAt(0) || 'O'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-dark">{user?.name || 'Store Owner'}</h1>
                        <p className="text-sm text-secondary">Store ID: {user?.storeId}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {menuItems.map((item, idx) => (
                        <motion.button
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => navigate(item.path)}
                            className="bg-white p-4 rounded-2xl shadow-card border border-gray-50 flex items-center gap-4 active:scale-[0.98] transition-transform"
                        >
                            <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                                <item.icon size={24} />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="font-bold text-secondary-dark">{item.title}</h3>
                                <p className="text-xs text-secondary">{item.desc}</p>
                            </div>
                            <ChevronRight size={20} className="text-gray-300" />
                        </motion.button>
                    ))}
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 mt-4 hover:bg-red-100 transition-colors"
                >
                    <LogOut size={20} />
                    Logout
                </button>

                <p className="text-center text-xs text-gray-400 mt-6">
                    KiranaKing v2.0 • Made with ❤️
                </p>
            </div>
        </MobileLayout>
    );
};

export default Menu;
