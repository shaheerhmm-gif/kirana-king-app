import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';

interface SupplierFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ onClose, onSuccess, initialData }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        gstin: '',
        address: '',
        state: '',
        pincode: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                phone: initialData.phone || '',
                gstin: initialData.gstin || '',
                address: initialData.address || '',
                state: initialData.state || '',
                pincode: initialData.pincode || ''
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (initialData) {
                await api.put(`/suppliers/${initialData.id}`, formData);
                showToast('Supplier updated successfully', 'success');
            } else {
                await api.post('/suppliers', formData);
                showToast('Supplier created successfully', 'success');
            }
            onSuccess();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to save supplier', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {initialData ? 'Edit Supplier' : 'Add New Supplier'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Metro Cash & Carry"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Contact Number"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                        <input
                            type="text"
                            name="gstin"
                            value={formData.gstin}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="GST Number (Optional)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Full Address"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="State"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                            <input
                                type="text"
                                name="pincode"
                                value={formData.pincode}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="ZIP Code"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} />
                                    {initialData ? 'Update' : 'Save'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierForm;
