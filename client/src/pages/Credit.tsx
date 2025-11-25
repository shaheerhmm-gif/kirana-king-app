import React, { useState, useEffect } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import api from '../api';
import { IndianRupee, Plus, MessageCircle } from 'lucide-react';
import TrustBadge from '../components/TrustBadge';
import CustomerForm from '../components/CustomerForm';

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
    const [showCustomerForm, setShowCustomerForm] = useState(false);

    const [upiId, setUpiId] = useState('');

    useEffect(() => {
        fetchCustomers();
        fetchStoreProfile();
    }, []);

    const fetchStoreProfile = async () => {
        try {
            const res = await api.get('/store/profile');
            setUpiId(res.data.upiId || '');
        } catch (error) {
            console.error('Failed to fetch store profile', error);
        }
    };

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

    const handleWhatsAppReminder = () => {
        if (!selectedCustomer || !trustData) return;

        const customer = customers.find(c => c.id === selectedCustomer);
        if (!customer) return;

        const balance = trustData.balance;
        if (balance <= 0) {
            alert('Customer has no pending balance!');
            return;
        }

        let message = `Namaste ${customer.name}! Your pending balance at our store is ₹${balance}.`;

        if (upiId) {
            message += ` Please pay via UPI: ${upiId}`;
        }

        message += ` Thank you!`;

        const url = `https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
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
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select
                                        value={selectedCustomer}
                                        onChange={(e) => setSelectedCustomer(e.target.value)}
                                        className="block w-full border rounded-md p-2"
                                        required
                                    >
                                        <option value="">-- Select Customer --</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerForm(true)}
                                    className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"
                                    title="Add New Customer"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        {trustData && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-500">Trust Score</span>
                                    <TrustBadge score={trustData.score} status={trustData.status} />
                                </div>
                                <div className="flex justify-between text-sm mb-3">
                                    <span>Balance: <strong>₹{trustData.balance}</strong></span>
                                    <span>Limit: ₹{trustData.creditLimit}</span>
                                </div>
                                {trustData.balance > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleWhatsAppReminder}
                                        className="w-full py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center justify-center gap-2 font-medium transition-colors"
                                    >
                                        <MessageCircle size={18} />
                                        Send Payment Reminder
                                    </button>
                                )}
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
                            <IndianRupee size={18} />
                            Record Transaction (₹)
                        </button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Customer List</h2>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {customers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>No customers found.</p>
                                <p className="text-xs">Add customers to start tracking credit.</p>
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

            {/* Customer Form Modal */}
            {showCustomerForm && (
                <CustomerForm
                    onClose={() => setShowCustomerForm(false)}
                    onSuccess={() => {
                        setShowCustomerForm(false);
                        fetchCustomers();
                    }}
                />
            )}
        </OwnerLayout>
    );
};

export default Credit;
