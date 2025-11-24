import { useState, useEffect } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import { Users, Search, Edit2, Trash2, Plus, Phone, MapPin } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import SupplierForm from '../components/SupplierForm';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data);
        } catch (error) {
            console.error(error);
            showToast('Failed to fetch suppliers', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this supplier?')) return;
        try {
            await api.delete(`/suppliers/${id}`);
            showToast('Supplier deleted successfully', 'success');
            fetchSuppliers();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to delete supplier', 'error');
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone?.includes(searchTerm)
    );

    return (
        <OwnerLayout>
            <div className="flex flex-col h-[calc(100vh-8rem)]">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Supplier Management</h1>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Add Supplier
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border flex-1 overflow-hidden flex flex-col">
                    <div className="p-4 border-b">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search suppliers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : filteredSuppliers.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Users size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No suppliers found. Add your first one!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredSuppliers.map(supplier => (
                                    <div key={supplier.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-lg text-gray-800">{supplier.name}</h3>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingSupplier(supplier)}
                                                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(supplier.id)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600">
                                            {supplier.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone size={16} className="text-gray-400" />
                                                    <span>{supplier.phone}</span>
                                                </div>
                                            )}
                                            {supplier.address && (
                                                <div className="flex items-start gap-2">
                                                    <MapPin size={16} className="text-gray-400 mt-1" />
                                                    <span>{supplier.address}</span>
                                                </div>
                                            )}
                                            {supplier.gstin && (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">GSTIN</span>
                                                    <span className="font-mono">{supplier.gstin}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-3 border-t flex justify-between text-xs text-gray-500">
                                            <span>{supplier._count?.products || 0} Products</span>
                                            <span>{supplier._count?.invoices || 0} Invoices</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {(isCreating || editingSupplier) && (
                <SupplierForm
                    onClose={() => {
                        setIsCreating(false);
                        setEditingSupplier(null);
                    }}
                    onSuccess={() => {
                        setIsCreating(false);
                        setEditingSupplier(null);
                        fetchSuppliers();
                    }}
                    initialData={editingSupplier}
                />
            )}
        </OwnerLayout>
    );
};

export default Suppliers;
