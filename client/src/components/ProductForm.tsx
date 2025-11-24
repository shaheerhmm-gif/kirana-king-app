import React, { useState, useEffect } from 'react';
import { X, Save, Scan, Plus } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';

interface ProductFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

const ProductForm: React.FC<ProductFormProps> = ({ onClose, onSuccess, initialData }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        category: '',
        supplierName: '',
        costPrice: '',
        sellingPrice: '',
        stock: '',
        unit: 'Pcs', // Default
        expiryDate: '',
        isSoldByWeight: false
    });

    // Categories list (could be fetched from API)
    const [categories, setCategories] = useState<string[]>(['General', 'Grocery', 'Snacks', 'Beverages', 'Personal Care', 'Household', 'Dairy']);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                barcode: initialData.barcode || '',
                category: initialData.category || 'General',
                supplierName: initialData.supplier?.name || '',
                costPrice: initialData.batches?.[0]?.purchasePrice?.toString() || '',
                sellingPrice: initialData.batches?.[0]?.sellingPrice?.toString() || '',
                stock: initialData.totalStock?.toString() || '',
                unit: initialData.isSoldByWeight ? 'Kg' : 'Pcs',
                expiryDate: initialData.batches?.[0]?.expiryDate ? new Date(initialData.batches[0].expiryDate).toISOString().split('T')[0] : '',
                isSoldByWeight: initialData.isSoldByWeight || false
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({
                ...prev,
                [name]: checked,
                unit: name === 'isSoldByWeight' && checked ? 'Kg' : 'Pcs'
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                costPrice: parseFloat(formData.costPrice) || 0,
                sellingPrice: parseFloat(formData.sellingPrice) || 0,
                stock: parseInt(formData.stock) || 0,
                isSoldByWeight: formData.unit === 'Kg' || formData.unit === 'L' // Simple logic for now
            };

            if (initialData) {
                await api.put(`/inventory/${initialData.id}`, payload);
                showToast('Product updated successfully', 'success');
            } else {
                await api.post('/inventory', payload);
                showToast('Product created successfully', 'success');
            }
            onSuccess();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to save product', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">
                        {initialData ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. Amul Butter 500g"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="barcode"
                                    value={formData.barcode}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Scan or type..."
                                />
                                <button type="button" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                                    <Scan size={20} className="text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Category & Supplier */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="category"
                                    list="category-list"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Select or type new..."
                                />
                                <datalist id="category-list">
                                    {categories.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                            <input
                                type="text"
                                name="supplierName"
                                value={formData.supplierName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="Supplier Name"
                            />
                        </div>
                    </div>

                    {/* Pricing & Stock */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                            <input
                                type="number"
                                name="costPrice"
                                value={formData.costPrice}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                            <input
                                type="number"
                                name="sellingPrice"
                                required
                                value={formData.sellingPrice}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Qty</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="Pcs">Pcs</option>
                                <option value="Kg">Kg</option>
                                <option value="L">L</option>
                                <option value="Pack">Pack</option>
                                <option value="Box">Box</option>
                            </select>
                        </div>
                    </div>

                    {/* Expiry */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input
                            type="date"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isSoldByWeight"
                            name="isSoldByWeight"
                            checked={formData.isSoldByWeight}
                            onChange={handleChange}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="isSoldByWeight" className="text-sm text-gray-700">
                            Sold by Weight (Loose Item)
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} />
                                    {initialData ? 'Update Product' : 'Save Product'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;
