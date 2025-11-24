import { useState, useEffect } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import api from '../api';
import { Plus, Calendar, Download } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Accounting = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'ledgers' | 'daybook'>('ledgers');
    const [ledgers, setLedgers] = useState<any[]>([]);
    const [dayBook, setDayBook] = useState<any[]>([]);

    // New Ledger Form
    const [showNewLedger, setShowNewLedger] = useState(false);
    const [newLedger, setNewLedger] = useState({ name: '', type: 'EXPENSE', code: '' });

    useEffect(() => {
        if (activeTab === 'ledgers') fetchLedgers();
        else fetchDayBook();
    }, [activeTab]);

    const fetchLedgers = async () => {
        try {
            const res = await api.get('/accounting/ledgers');
            setLedgers(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchDayBook = async () => {
        try {
            const res = await api.get('/accounting/daybook');
            setDayBook(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const createLedger = async () => {
        try {
            await api.post('/accounting/ledgers', newLedger);
            showToast('Ledger created successfully', 'success');
            setShowNewLedger(false);
            setNewLedger({ name: '', type: 'EXPENSE', code: '' });
            fetchLedgers();
        } catch (error) {
            console.error(error);
            showToast('Failed to create ledger', 'error');
        }
    };

    const closeFinancialYear = async () => {
        if (!window.confirm('Are you sure you want to close the financial year? This will carry forward balances.')) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            await api.post('/accounting/close-year', { closingDate: today });
            showToast('Financial Year Closed Successfully', 'success');
            fetchLedgers();
        } catch (error) {
            console.error(error);
            showToast('Failed to close financial year', 'error');
        }
    };

    return (
        <OwnerLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Accounting</h1>
                <div className="flex gap-2">
                    <button
                        onClick={closeFinancialYear}
                        className="px-4 py-2 rounded-lg font-medium bg-red-100 text-red-600 hover:bg-red-200"
                    >
                        Close Financial Year
                    </button>
                    <button
                        onClick={() => setActiveTab('ledgers')}
                        className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'ledgers' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
                    >
                        Ledgers
                    </button>
                    <button
                        onClick={() => setActiveTab('daybook')}
                        className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'daybook' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
                    >
                        Day Book
                    </button>
                </div>
            </div>

            {activeTab === 'ledgers' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setShowNewLedger(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                        >
                            <Plus size={20} /> New Ledger
                        </button>
                    </div>

                    {showNewLedger && (
                        <div className="bg-white p-4 rounded-lg shadow mb-4 border border-indigo-100">
                            <h3 className="font-bold mb-3">Create New Ledger</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <input
                                    type="text"
                                    placeholder="Ledger Name"
                                    value={newLedger.name}
                                    onChange={(e) => setNewLedger({ ...newLedger, name: e.target.value })}
                                    className="p-2 border rounded"
                                />
                                <select
                                    value={newLedger.type}
                                    onChange={(e) => setNewLedger({ ...newLedger, type: e.target.value })}
                                    className="p-2 border rounded"
                                >
                                    <option value="ASSET">Asset</option>
                                    <option value="LIABILITY">Liability</option>
                                    <option value="INCOME">Income</option>
                                    <option value="EXPENSE">Expense</option>
                                    <option value="EQUITY">Equity</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Code (Optional)"
                                    value={newLedger.code}
                                    onChange={(e) => setNewLedger({ ...newLedger, code: e.target.value })}
                                    className="p-2 border rounded"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowNewLedger(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button onClick={createLedger} className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Balance</th>
                                    <th className="p-4">Last Entry</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {ledgers.map((ledger) => (
                                    <tr key={ledger.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium">{ledger.name}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold">{ledger.type}</span>
                                        </td>
                                        <td className="p-4 font-bold">₹{ledger.balance}</td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {ledger.entries?.[0]?.date ? new Date(ledger.entries[0].date).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'daybook' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h2 className="font-bold flex items-center gap-2">
                            <Calendar size={20} /> Today's Entries
                        </h2>
                        <button className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-medium">
                            <Download size={16} /> Export Tally XML
                        </button>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Particulars</th>
                                <th className="p-4">Vch Type</th>
                                <th className="p-4 text-right">Debit</th>
                                <th className="p-4 text-right">Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {dayBook.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50">
                                    <td className="p-4 text-sm text-gray-500">{new Date(entry.date).toLocaleTimeString()}</td>
                                    <td className="p-4 font-medium">
                                        {entry.ledgerAccount?.name}
                                        <div className="text-xs text-gray-400 font-normal">{entry.description}</div>
                                    </td>
                                    <td className="p-4 text-sm">{entry.referenceType || 'JOURNAL'}</td>
                                    <td className="p-4 text-right font-mono">
                                        {entry.type === 'DEBIT' ? `₹${entry.amount}` : ''}
                                    </td>
                                    <td className="p-4 text-right font-mono">
                                        {entry.type === 'CREDIT' ? `₹${entry.amount}` : ''}
                                    </td>
                                </tr>
                            ))}
                            {dayBook.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">
                                        No entries found for today
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </OwnerLayout>
    );
};

export default Accounting;
