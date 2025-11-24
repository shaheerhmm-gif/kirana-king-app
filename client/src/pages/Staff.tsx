import { useState, useEffect } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import { Users, Edit2, Trash2, Plus, Phone, Shield } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';

const Staff = () => {
    const [helpers, setHelpers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingHelper, setEditingHelper] = useState<any | null>(null);
    const { showToast } = useToast();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '',
        role: 'HELPER'
    });

    useEffect(() => {
        fetchHelpers();
    }, []);

    const fetchHelpers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/auth/helpers');
            setHelpers(res.data);
        } catch (error) {
            console.error(error);
            showToast('Failed to fetch staff', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this staff member?')) return;
        try {
            await api.delete(`/auth/helpers/${id}`);
            showToast('Staff deleted successfully', 'success');
            fetchHelpers();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to delete staff', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingHelper) {
                const payload: any = { ...formData };
                if (!payload.password) delete payload.password; // Don't send empty password on update
                await api.put(`/auth/helpers/${editingHelper.id}`, payload);
                showToast('Staff updated successfully', 'success');
            } else {
                await api.post('/auth/helpers', formData);
                showToast('Staff created successfully', 'success');
            }
            setIsCreating(false);
            setEditingHelper(null);
            setFormData({ name: '', phone: '', password: '', role: 'HELPER' });
            fetchHelpers();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to save staff', 'error');
        }
    };

    const openEdit = (helper: any) => {
        setEditingHelper(helper);
        setFormData({
            name: helper.name,
            phone: helper.phone,
            password: '', // Don't fill password
            role: helper.role
        });
        setIsCreating(true);
    };

    return (
        <OwnerLayout>
            <div className="flex flex-col h-[calc(100vh-8rem)]">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
                    <button
                        onClick={() => {
                            setIsCreating(true);
                            setEditingHelper(null);
                            setFormData({ name: '', phone: '', password: '', role: 'HELPER' });
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Add Staff
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : helpers.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Users size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No staff members found. Add your first helper!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {helpers.map(helper => (
                                    <div key={helper.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                    {helper.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800">{helper.name}</h3>
                                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">
                                                        {helper.role}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEdit(helper)}
                                                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(helper.id)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600 mt-4">
                                            <div className="flex items-center gap-2">
                                                <Phone size={16} className="text-gray-400" />
                                                <span>{helper.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Shield size={16} className="text-gray-400" />
                                                <span>Access Level: {helper.role}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isCreating && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingHelper ? 'Edit Staff' : 'Add New Staff'}
                            </h2>
                            <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Full Name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Mobile Number"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {editingHelper ? 'New Password (Optional)' : 'Password *'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingHelper}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="******"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="HELPER">Helper (Basic Access)</option>
                                    <option value="CASHIER">Cashier (Sales Only)</option>
                                    <option value="MANAGER">Manager (Full Access)</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                                >
                                    {editingHelper ? 'Update Staff' : 'Create Staff'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </OwnerLayout>
    );
};

export default Staff;
