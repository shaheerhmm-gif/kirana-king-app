import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { useNavigate } from 'react-router-dom';

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
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-indigo-600">Kirana Super-Assistant</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegistering && (
                        <>
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-2 border rounded"
                                required
                            />
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                                className="w-full p-2 border rounded"
                            >
                                <option value="OWNER">Owner</option>
                                <option value="HELPER">Helper</option>
                            </select>
                            {role === 'OWNER' && (
                                <input
                                    type="text"
                                    placeholder="Store Name"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            )}
                            {role === 'HELPER' && (
                                <input
                                    type="text"
                                    placeholder="Store ID (Ask Owner)"
                                    value={storeId}
                                    onChange={(e) => setStoreId(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            )}
                        </>
                    )}
                    <input
                        type="text"
                        placeholder="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                        {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
                    </button>
                </form>
                <button
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError('');
                    }}
                    className="w-full mt-4 text-sm text-indigo-600 hover:underline"
                >
                    {isRegistering ? 'Already have an account? Login' : 'New user? Register'}
                </button>
                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                const res = await api.get('/../health'); // Go up from /api to /health
                                alert(`Server Status: ${res.data.status}\nTime: ${res.data.timestamp}`);
                            } catch (err) {
                                alert('Could not connect to server. Please check if Backend Terminal is running.');
                            }
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                        Test Server Connection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
