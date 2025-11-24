import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingCart, FileText, Users, BarChart2, LogOut, HelpCircle, Package, Wheat, Calendar, Book, Settings } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const OwnerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useTranslation();
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/owner', icon: <LayoutDashboard size={20} />, label: t('nav.dashboard') },
        { path: '/owner/inventory', icon: <ShoppingCart size={20} />, label: t('nav.inventory') },
        { path: '/owner/invoices', icon: <FileText size={20} />, label: t('nav.invoices') },
        { path: '/owner/suppliers', icon: <Package size={20} />, label: t('nav.suppliers') },
        { path: '/owner/staff', icon: <Users size={20} />, label: t('nav.staff') },
        { path: '/purchase/orders', icon: <ShoppingCart size={20} />, label: t('nav.purchases') },
        { path: '/purchase/returns', icon: <LogOut size={20} />, label: t('nav.returns') },
        { path: '/owner/accounting', icon: <Book size={20} />, label: t('nav.accounting') },
        { path: '/owner/reports', icon: <BarChart2 size={20} />, label: t('nav.reports') },
        { path: '/owner/loose-inventory', icon: <Wheat size={20} />, label: t('nav.loose_items') },
        { path: '/owner/expiry', icon: <Calendar size={20} />, label: t('nav.expiry') },
        { path: '/owner/credit', icon: <Users size={20} />, label: t('nav.credit') },
        { path: '/owner/analytics', icon: <BarChart2 size={20} />, label: t('nav.analytics') },
        { path: '/owner/settings', icon: <Settings size={20} />, label: t('nav.settings') },
        { path: '/owner/guide', icon: <HelpCircle size={20} />, label: t('nav.guide') },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-md hidden md:flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-indigo-600">KiranaKing</h2>
                    <p className="text-sm text-gray-500">Store ID: {user?.storeId}</p>
                    <div className="mt-2">
                        <LanguageSwitcher />
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${isActive(item.path) ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 p-3 w-full text-red-600 hover:bg-red-50 rounded-lg"
                    >
                        <LogOut size={20} />
                        <span>{t('nav.logout')}</span>
                    </button>
                </div>
            </div>

            {/* Mobile Header & Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm p-4 md:hidden flex justify-between items-center">
                    <h1 className="text-lg font-bold">KiranaKing</h1>
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />
                        <button onClick={handleLogout} className="text-red-600">
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>

                {/* Mobile Bottom Nav */}
                <div className="md:hidden bg-white border-t flex justify-around p-3 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
                    <Link to="/owner" className={`flex flex-col items-center ${isActive('/owner') ? 'text-indigo-600' : 'text-gray-400'}`}>
                        <LayoutDashboard size={22} strokeWidth={isActive('/owner') ? 2.5 : 2} />
                        <span className="text-[10px] font-medium mt-1">{t('nav.home')}</span>
                    </Link>
                    <Link to="/owner/inventory" className={`flex flex-col items-center ${isActive('/owner/inventory') ? 'text-indigo-600' : 'text-gray-400'}`}>
                        <ShoppingCart size={22} strokeWidth={isActive('/owner/inventory') ? 2.5 : 2} />
                        <span className="text-[10px] font-medium mt-1">{t('nav.inventory')}</span>
                    </Link>
                    <Link to="/owner/quick-sale?scan=true" className="relative -top-5 bg-indigo-600 text-white p-3 rounded-full shadow-lg shadow-indigo-600/30 border-4 border-white flex items-center justify-center">
                        <Package size={24} />
                    </Link>
                    <Link to="/owner/analytics" className={`flex flex-col items-center ${isActive('/owner/analytics') ? 'text-indigo-600' : 'text-gray-400'}`}>
                        <BarChart2 size={22} strokeWidth={isActive('/owner/analytics') ? 2.5 : 2} />
                        <span className="text-[10px] font-medium mt-1">{t('nav.stats')}</span>
                    </Link>
                    <Link to="/owner/menu" className={`flex flex-col items-center ${isActive('/owner/menu') ? 'text-indigo-600' : 'text-gray-400'}`}>
                        <Users size={22} strokeWidth={isActive('/owner/menu') ? 2.5 : 2} />
                        <span className="text-[10px] font-medium mt-1">{t('nav.menu')}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OwnerLayout;
