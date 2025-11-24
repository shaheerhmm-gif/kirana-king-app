import React, { useState, useEffect } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import api from '../api';
import { DollarSign } from 'lucide-react';
import TrustBadge from '../components/TrustBadge';

interface Customer {
    id: string;
    name: string;
    phone: string;
    creditLimit: number;
}

const Credit = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [trustData, setTrustData] = useState<any>(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (selectedCustomer) {
            fetchTrustScore(selectedCustomer);
        } else {
            setTrustData(null);
        }
    }, [selectedCustomer]);

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/credit/customers');
            setCustomers(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchTrustScore = async (customerId: string) => {
        try {
            const res = await api.get(`/credit/${customerId}/trust-score`);
            setTrustData(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleTransaction = async (e: React.FormEvent) => {
        e.preventDefault();

        // Risk Check
        if (type === 'DEBIT' && trustData) {
            const newBalance = trustData.balance + parseFloat(amount);
            if (newBalance > trustData.creditLimit) {
                const proceed = window.confirm(
                    `⚠️ RISK ALERT\n\nThis transaction will exceed the credit limit.\nCurrent Balance: ₹${trustData.balance}\nLimit: ₹${trustData.creditLimit}\n\nDo you want to proceed?`
                );
                if (!proceed) return;
            }
        }

        setLoading(true);
        try {
            const customer = customers.find(c => c.id === selectedCustomer);
            if (!customer) return;

            await api.post('/credit/transaction', {
                customerPhone: customer.phone,
                customerName: customer.name,
                amount: parseFloat(amount),
                type,
                description,
            });
            alert('Transaction recorded!');
            setAmount('');
            setDescription('');
            fetchTrustScore(selectedCustomer); // Refresh score
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error recording transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <OwnerLayout>
            <h1 className="text-2xl font-bold mb-6">Digital Khata</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">New Transaction</h2>
                    <form onSubmit={handleTransaction} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select Customer</label>
                            <select
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                                className="mt-1 block w-full border rounded-md p-2"
                                required
                            >
                                <option value="">-- Select Customer --</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                                ))}
                            </select>
                        </div>

                        {trustData && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-500">Trust Score</span>
                                    <TrustBadge score={trustData.score} status={trustData.status} />
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Balance: <strong>₹{trustData.balance}</strong></span>
                                    <span>Limit: ₹{trustData.creditLimit}</span>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="mt-1 block w-full border rounded-md p-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="mt-1 block w-full border rounded-md p-2"
                            >
                                <option value="DEBIT">Give Credit (Udhaar)</option>
                                <option value="CREDIT">Receive Payment (Jama)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="mt-1 block w-full border rounded-md p-2"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !selectedCustomer}
                            className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:bg-gray-400"
                        >
                            <DollarSign size={18} />
                            Record Transaction
                        </button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Customer List</h2>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {customers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>No customers found.</p>
                                <p className="text-xs">Add customers from the main menu or during a sale.</p>
                            </div>
                        ) : (
                            customers.map(c => (
                                <div
                                    key={c.id}
                                    className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${selectedCustomer === c.id ? 'border-indigo-500 bg-indigo-50' : ''}`}
                                    onClick={() => setSelectedCustomer(c.id)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{c.name}</p>
                                            <p className="text-xs text-gray-500">{c.phone}</p>
                                        </div>
                                        {/* Ideally we fetch trust score for list too, but for MVP we fetch on select */}
                                        {selectedCustomer === c.id && trustData && (
                                            <TrustBadge score={trustData.score} status={trustData.status} size="sm" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </OwnerLayout>
    );
};

export default Credit;
