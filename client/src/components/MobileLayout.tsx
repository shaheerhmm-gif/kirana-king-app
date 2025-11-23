import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, ScanLine, BarChart3, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface MobileLayoutProps {
    children: React.ReactNode;
    showBottomNav?: boolean;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children, showBottomNav = true }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: Home, label: 'Home', path: '/owner' },
        { icon: Package, label: 'Inventory', path: '/owner/inventory' },
        { icon: ScanLine, label: 'Scan', path: '/owner/quick-sale', highlight: true },
        { icon: BarChart3, label: 'Stats', path: '/owner/analytics' },
        { icon: User, label: 'Profile', path: '/owner/profile' }, // Placeholder for now
    ];

    return (
        <div className="min-h-screen bg-background-subtle flex flex-col">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-24 safe-bottom">
                {children}
            </main>

            {/* Bottom Navigation */}
            {showBottomNav && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
                    <div className="flex justify-between items-center max-w-md mx-auto">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            const Icon = item.icon;

                            if (item.highlight) {
                                return (
                                    <motion.button
                                        key={item.path}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => navigate(item.path)}
                                        className="relative -top-6 bg-primary text-white p-4 rounded-full shadow-lg shadow-primary/30 border-4 border-white flex items-center justify-center"
                                    >
                                        <Icon size={24} />
                                    </motion.button>
                                );
                            }

                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={cn(
                                        "flex flex-col items-center gap-1 transition-colors",
                                        isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileLayout;
