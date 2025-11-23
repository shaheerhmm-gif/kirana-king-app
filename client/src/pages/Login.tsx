import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, User, Smartphone, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const Login = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [storeName, setStoreName] = useState('');
    const [role, setRole] = useState<'OWNER' | 'HELPER'>('OWNER');
    const [storeId, setStoreId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isRegistering ? '/auth/register' : '/auth/login';
            const payload = isRegistering
                ? { name, phone, password, role, storeName, storeId: role === 'HELPER' ? storeId : undefined }
                : { phone, password };

            const res = await api.post(endpoint, payload);

            login(res.data.token, res.data.user);
            navigate(res.data.user.role === 'OWNER' ? '/owner' : '/helper');
        } catch (error: any) {
            console.error('Login Error:', error);
            const msg = error.response?.data?.message || 'Connection failed. Is the server running?';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-light via-white to-background-subtle p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white mb-4 shadow-lg shadow-primary/30"
                    >
                        <Store size={32} />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-secondary-dark tracking-tight">Kirana King</h1>
                    <p className="text-secondary mt-2">Manage your shop like a pro</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-card p-8 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-6 border border-red-100"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <AnimatePresence mode="popLayout">
                            {isRegistering && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-5 overflow-hidden"
                                >
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-secondary ml-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                placeholder="Enter your name"
                                                required={isRegistering}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setRole('OWNER')}
                                            className={cn(
                                                "p-3 rounded-xl border text-sm font-medium transition-all",
                                                role === 'OWNER'
                                                    ? "bg-primary/5 border-primary text-primary"
                                                    : "bg-gray-50 border-gray-200 text-secondary hover:bg-gray-100"
                                            )}
                                        >
                                            Owner
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRole('HELPER')}
                                            className={cn(
                                                "p-3 rounded-xl border text-sm font-medium transition-all",
                                                role === 'HELPER'
                                                    ? "bg-primary/5 border-primary text-primary"
                                                    : "bg-gray-50 border-gray-200 text-secondary hover:bg-gray-100"
                                            )}
                                        >
                                            Helper
                                        </button>
                                    </div>

                                    {role === 'OWNER' ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="space-y-1"
                                        >
                                            <label className="text-xs font-medium text-secondary ml-1">Store Name</label>
                                            <div className="relative">
                                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    value={storeName}
                                                    onChange={(e) => setStoreName(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                    placeholder="My Kirana Store"
                                                    required={isRegistering && role === 'OWNER'}
                                                />
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="space-y-1"
                                        >
                                            <label className="text-xs font-medium text-secondary ml-1">Store ID</label>
                                            <div className="relative">
                                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    value={storeId}
                                                    onChange={(e) => setStoreId(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                    placeholder="Ask owner for ID"
                                                    required={isRegistering && role === 'HELPER'}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-secondary ml-1">Phone Number</label>
                            <div className="relative">
                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="9876543210"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-secondary ml-1">Password</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">***</div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    {isRegistering ? 'Create Account' : 'Login'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                            }}
                            className="text-sm text-secondary hover:text-primary transition-colors font-medium"
                        >
                            {isRegistering ? (
                                <span>Already have an account? <span className="text-primary">Login</span></span>
                            ) : (
                                <span>New to Kirana King? <span className="text-primary">Create Account</span></span>
                            )}
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-8">
                    &copy; 2025 Kirana King. Made with ❤️ for India.
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
