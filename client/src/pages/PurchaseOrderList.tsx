import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerLayout from '../components/OwnerLayout';
import api from '../api';
import { Plus, FileText, Eye } from 'lucide-react';

const PurchaseOrderList = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/purchase/orders');
            setOrders(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'bg-gray-100 text-gray-800';
            case 'SENT': return 'bg-blue-100 text-blue-800';
            case 'RECEIVED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <OwnerLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Purchase Orders</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/purchase/suggestions')}
                        className="bg-white border border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 font-medium"
                    >
                        View Suggestions
                    </button>
                    <button
                        onClick={() => navigate('/purchase/create')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 font-medium"
                    >
                        <Plus size={20} />
                        New Order
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading orders...</div>
            ) : orders.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    <FileText size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No purchase orders found</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Supplier</th>
                                <th className="p-4">Items</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.map((po) => (
                                <tr key={po.id} className="hover:bg-gray-50">
                                    <td className="p-4">{new Date(po.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium">{po.supplier?.name}</td>
                                    <td className="p-4">{po.items.length} items</td>
                                    <td className="p-4 font-bold">₹{po.totalAmount}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(po.status)}`}>
                                            {po.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button className="text-indigo-600 hover:text-indigo-800">
                                            <Eye size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </OwnerLayout>
    );
};

export default PurchaseOrderList;
