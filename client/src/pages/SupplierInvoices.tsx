import { useState, useEffect } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import { Plus, Calendar, TrendingUp } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';

interface Supplier {
    id: string;
    name: string;
    phone?: string;
}

interface Invoice {
    id: string;
    supplierId: string;
    supplier: Supplier;
    totalAmount: number;
    invoiceDate: string;
    dueDate?: string;
    status: 'PENDING' | 'PAID' | 'FINANCED' | 'OVERDUE';
    notes?: string;
}

interface CreditProfile {
    avgMonthlySales: number;
    repaymentFactor: number;
    creditLimit: number;
    riskScore: number;
    totalInvoices: number;
    overdueInvoices: number;
}

export const SupplierInvoices = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [creditProfile, setCreditProfile] = useState<CreditProfile | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    // Form state for new invoice
    const [formData, setFormData] = useState({
        supplierId: '',
        amount: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        notes: ''
    });

    // Form state for new supplier
    const [supplierData, setSupplierData] = useState({
        name: '',
        phone: ''
    });

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        mode: 'CASH',
        reference: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invoicesRes, suppliersRes, profileRes] = await Promise.all([
                api.get('/suppliers/invoices'),
                api.get('/suppliers'),
                api.get('/suppliers/credit-profile')
            ]);
            setInvoices(invoicesRes.data);
            setSuppliers(suppliersRes.data);
            setCreditProfile(profileRes.data);
        } catch (error) {
            console.error(error);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/suppliers/invoices', formData);
            showToast('Invoice added successfully!', 'success');
            setShowAddModal(false);
            setFormData({
                supplierId: '',
                amount: '',
                invoiceDate: new Date().toISOString().split('T')[0],
                dueDate: '',
                notes: ''
            });
            fetchData();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to add invoice', 'error');
        }
    };

    const handleAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/suppliers', supplierData);
            showToast('Supplier added successfully!', 'success');
            setShowSupplierModal(false);
            setSupplierData({ name: '', phone: '' });
            fetchData();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to add supplier', 'error');
        }
    };

    const getDaysUntilDue = (dueDate?: string) => {
        if (!dueDate) return null;
        const due = new Date(dueDate);
        const today = new Date();
        const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const getDueDateColor = (dueDate?: string, status?: string) => {
        if (status === 'PAID' || status === 'FINANCED') return 'bg-green-100 text-green-800';
        if (status === 'OVERDUE') return 'bg-red-100 text-red-800';

        const days = getDaysUntilDue(dueDate);
        if (days === null) return 'bg-gray-100 text-gray-800';
        if (days < 0) return 'bg-red-100 text-red-800';
        if (days <= 3) return 'bg-red-100 text-red-800';
        if (days <= 7) return 'bg-amber-100 text-amber-800';
        return 'bg-green-100 text-green-800';
    };

    const totalPayable = invoices
        .filter(i => i.status === 'PENDING')
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

    if (loading) {
        return (
            <OwnerLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </OwnerLayout>
        );
    }



    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;

        try {
            await api.post('/suppliers/payments', {
                invoiceId: selectedInvoice.id,
                amount: parseFloat(paymentData.amount),
                mode: paymentData.mode,
                reference: paymentData.reference
            });
            showToast('Payment recorded successfully!', 'success');
            setShowPaymentModal(false);
            setPaymentData({ amount: '', mode: 'CASH', reference: '' });
            fetchData();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to record payment', 'error');
        }
    };

    const openPaymentModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setPaymentData({
            ...paymentData,
            amount: invoice.totalAmount.toString() // Default to full amount
        });
        setShowPaymentModal(true);
    };

    return (
        <OwnerLayout>
            <div className="max-w-6xl mx-auto p-4 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">Supplier Invoices</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowSupplierModal(true)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Add Supplier
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Add Invoice
                        </button>
                    </div>
                </div>

                {/* Credit Profile Banner */}
                {creditProfile && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-indigo-100 text-sm">Credit Limit</div>
                                <div className="text-2xl font-bold">₹{creditProfile.creditLimit.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-indigo-100 text-sm">Risk Score</div>
                                <div className="text-2xl font-bold flex items-center gap-2">
                                    {creditProfile.riskScore}
                                    <span className={`text-sm px-2 py-1 rounded ${creditProfile.riskScore >= 70 ? 'bg-green-500' : 'bg-red-500'
                                        }`}>
                                        {creditProfile.riskScore >= 70 ? 'Good' : 'Poor'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div className="text-indigo-100 text-sm">Avg Monthly Sales</div>
                                <div className="text-2xl font-bold">₹{creditProfile.avgMonthlySales.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-indigo-100 text-sm">Total Payable</div>
                                <div className="text-2xl font-bold">₹{totalPayable.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-indigo-100">
                            <TrendingUp size={16} className="inline mr-2" />
                            You get ₹{creditProfile.creditLimit.toLocaleString()} limit because your last 3 months average sales are ₹
                            {creditProfile.avgMonthlySales.toLocaleString()} and you have a repayment factor of {creditProfile.repaymentFactor.toFixed(2)}.
                        </div>
                    </div>
                )}

                {/* Invoices List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold">Invoices</h2>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {invoices.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No invoices yet. Add your first invoice!
                            </div>
                        ) : (
                            invoices.map((invoice) => {
                                const daysUntilDue = getDaysUntilDue(invoice.dueDate);
                                return (
                                    <div key={invoice.id} className="p-4 hover:bg-gray-50 transition">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="font-semibold text-lg">{invoice.supplier.name}</div>
                                                <div className="text-gray-600 text-sm mt-1">
                                                    Invoice Date: {new Date(invoice.invoiceDate).toLocaleDateString()}
                                                </div>
                                                {invoice.notes && (
                                                    <div className="text-gray-500 text-sm mt-1">{invoice.notes}</div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-gray-800">
                                                    ₹{invoice.totalAmount.toLocaleString()}
                                                </div>
                                                {invoice.dueDate && (
                                                    <div className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getDueDateColor(invoice.dueDate, invoice.status)}`}>
                                                        <Calendar size={14} />
                                                        {invoice.status === 'PAID' ? 'Paid' :
                                                            invoice.status === 'FINANCED' ? 'Financed' :
                                                                daysUntilDue !== null && daysUntilDue < 0 ? 'Overdue' :
                                                                    daysUntilDue !== null ? `Due in ${daysUntilDue}d` : 'No due date'}
                                                    </div>
                                                )}
                                                {invoice.status === 'PENDING' && (
                                                    <div className="mt-2">
                                                        <button
                                                            onClick={() => openPaymentModal(invoice)}
                                                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                                        >
                                                            Record Payment
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Add Invoice Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Add Invoice</h2>
                            <form onSubmit={handleAddInvoice} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Supplier</label>
                                    <select
                                        required
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={formData.supplierId}
                                        onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Invoice Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={formData.invoiceDate}
                                        onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Due Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2"
                                        rows={3}
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                    >
                                        Add Invoice
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Supplier Modal */}
                {showSupplierModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Add Supplier</h2>
                            <form onSubmit={handleAddSupplier} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Supplier Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={supplierData.name}
                                        onChange={(e) => setSupplierData({ ...supplierData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone (Optional)</label>
                                    <input
                                        type="tel"
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={supplierData.phone}
                                        onChange={(e) => setSupplierData({ ...supplierData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowSupplierModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                    >
                                        Add Supplier
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Payment Modal */}
                {showPaymentModal && selectedInvoice && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Record Payment</h2>
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">Invoice Amount</p>
                                <p className="text-lg font-bold">₹{selectedInvoice.totalAmount}</p>
                            </div>
                            <form onSubmit={handleRecordPayment} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Payment Amount (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        max={selectedInvoice.totalAmount}
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Payment Mode</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={paymentData.mode}
                                        onChange={(e) => setPaymentData({ ...paymentData, mode: e.target.value })}
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="CARD">Card</option>
                                        <option value="CHEQUE">Cheque</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Reference / Note</label>
                                    <input
                                        type="text"
                                        placeholder="Txn ID, Cheque No, etc."
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={paymentData.reference}
                                        onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Confirm Payment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </OwnerLayout>
    );
};
