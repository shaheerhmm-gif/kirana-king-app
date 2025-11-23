import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

const Catalog = () => {
    const { storeId } = useParams();
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/catalog/${storeId}`).then((res) => {
            setProducts(res.data);
            setLoading(false);
        });
    }, [storeId]);

    const updateCart = (productId: string, delta: number) => {
        setCart((prev) => {
            const current = prev[productId] || 0;
            const next = Math.max(0, current + delta);
            if (next === 0) {
                const { [productId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [productId]: next };
        });
    };

    const handleOrder = async () => {
        const items = Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity }));
        if (items.length === 0) return;

        try {
            const res = await api.post('/catalog/order', { storeId, items });
            window.location.href = res.data.whatsappUrl;
        } catch (error) {
            alert('Failed to generate order');
        }
    };

    if (loading) return <div className="p-4">Loading catalog...</div>;

    const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white shadow p-4 sticky top-0 z-10">
                <h1 className="text-xl font-bold text-indigo-600">Kirana Store</h1>
            </header>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product) => (
                    <div key={product.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                        <div>
                            <h3 className="font-bold">{product.name}</h3>
                            <p className="text-gray-600">₹{product.price}</p>
                            {product.available < 5 && (
                                <p className="text-xs text-red-500">Only {product.available} left!</p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {cart[product.id] ? (
                                <>
                                    <button onClick={() => updateCart(product.id, -1)} className="bg-gray-200 p-1 rounded">
                                        <Minus size={16} />
                                    </button>
                                    <span className="font-bold">{cart[product.id]}</span>
                                    <button onClick={() => updateCart(product.id, 1)} className="bg-indigo-600 text-white p-1 rounded">
                                        <Plus size={16} />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => updateCart(product.id, 1)}
                                    className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded text-sm font-semibold"
                                >
                                    Add
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {totalItems > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
                    <button
                        onClick={handleOrder}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                        <ShoppingCart size={20} />
                        Order {totalItems} Items on WhatsApp
                    </button>
                </div>
            )}
        </div>
    );
};

export default Catalog;
