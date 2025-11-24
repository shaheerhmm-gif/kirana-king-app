import { useState, useEffect } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import { Save, Store, MapPin } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        upiId: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/store/profile');
            setFormData({
                name: res.data.name || '',
                location: res.data.location || '',
                upiId: res.data.upiId || ''
            });
        } catch (error) {
            console.error(error);
            showToast('Failed to fetch store profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/store/profile', formData);
            showToast('Store profile updated successfully', 'success');
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <OwnerLayout>
                <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </OwnerLayout>
        );
    }

    return (
        <OwnerLayout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Store Settings</h1>

                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-6 border-b bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Store size={20} className="text-indigo-600" />
                            Store Profile
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Manage your store details and public information.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. Kirana King"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID (for Payments)</label>
                            <input
                                type="text"
                                value={formData.upiId}
                                onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. 9876543210@upi"
                            />
                            <p className="text-xs text-gray-500 mt-1">Used for generating payment links in WhatsApp reminders.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location / Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                                <textarea
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    rows={3}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Store Address"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </OwnerLayout>
    );
};

export default Settings;
