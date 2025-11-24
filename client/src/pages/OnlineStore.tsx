import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Minus, MapPin, Search } from 'lucide-react';
import api from '../api';

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    isSoldByWeight: boolean;
}

interface CartItem extends Product {
    quantity: number;
}

const OnlineStore = () => {
    const { storeId } = useParams();
    const [store, setStore] = useState<any>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [address, setAddress] = useState('');
    const [showCart, setShowCart] = useState(false);

    useEffect(() => {
        fetchStoreData();
    }, [storeId]);

    const fetchStoreData = async () => {
        try {
            const res = await api.get(`/inventory/public/${storeId}`);
            setStore(res.data.store);
            setProducts(res.data.products);
        } catch (error) {
            console.error('Failed to load store', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === productId);
            if (existing && existing.quantity > 1) {
                return prev.map(item =>
                    item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
                );
            }
            return prev.filter(item => item.id !== productId);
        });
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleCheckout = () => {
        if (!address.trim()) {
            alert('Please enter your delivery address');
            return;
        }

        let message = `🛒 *New Order for ${store.name}*\n\n`;
        cart.forEach(item => {
            message += `▪️ ${item.name} x ${item.quantity} = ₹${item.price * item.quantity}\n`;
        });
        message += `\n💰 *Total: ₹${cartTotal}*`;
        message += `\n📍 *Address:* ${address}`;

        // If store has UPI ID, add payment link (optional, maybe too advanced for v1)
        // if (store.upiId) {
        //     message += `\n\n💳 Pay here: upi://pay?pa=${store.upiId}&am=${cartTotal}&pn=${encodeURIComponent(store.name)}`;
        // }

        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    if (!store) return <div className="flex h-screen items-center justify-center text-gray-500">Store not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 py-4">
                    <h1 className="text-xl font-bold text-gray-800">{store.name}</h1>
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                        <MapPin size={14} className="mr-1" />
                        <span className="truncate">{store.location || 'Local Store'}</span>
                    </div>
                </div>
                {/* Search */}
                <div className="px-4 pb-4 max-w-md mx-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-md mx-auto p-4 grid grid-cols-2 gap-4">
                {filteredProducts.map(product => {
                    const cartItem = cart.find(item => item.id === product.id);
                    return (
                        <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                            <div className="h-32 bg-gray-200 flex items-center justify-center text-gray-400">
                                {/* Placeholder for Image */}
                                <span className="text-4xl">🛍️</span>
                            </div>
                            <div className="p-3 flex-1 flex flex-col">
                                <h3 className="font-medium text-gray-800 line-clamp-2 text-sm">{product.name}</h3>
                                <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                                <div className="mt-auto pt-3 flex items-center justify-between">
                                    <span className="font-bold text-indigo-600">₹{product.price}</span>

                                    {cartItem ? (
                                        <div className="flex items-center bg-indigo-50 rounded-lg overflow-hidden">
                                            <button onClick={() => removeFromCart(product.id)} className="p-1.5 text-indigo-600 hover:bg-indigo-100">
                                                <Minus size={16} />
                                            </button>
                                            <span className="px-2 text-sm font-bold text-indigo-700">{cartItem.quantity}</span>
                                            <button onClick={() => addToCart(product)} className="p-1.5 text-indigo-600 hover:bg-indigo-100">
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="px-3 py-1.5 bg-white border border-indigo-600 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50"
                                        >
                                            ADD
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Cart Bottom Sheet */}
            {cartCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 rounded-t-2xl max-w-md mx-auto">
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setShowCart(!showCart)}>
                            <div className="flex items-center gap-2">
                                <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                    {cartCount}
                                </div>
                                <span className="font-bold text-gray-800">Items in Cart</span>
                            </div>
                            <span className="font-bold text-xl text-indigo-600">₹{cartTotal}</span>
                        </div>

                        {showCart && (
                            <div className="mb-4 max-h-60 overflow-y-auto border-t pt-4 space-y-3">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center">
                                        <div className="text-sm">
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-gray-500">₹{item.price} x {item.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500"><Minus size={16} /></button>
                                            <span className="font-bold text-sm">{item.quantity}</span>
                                            <button onClick={() => addToCart(item)} className="text-gray-400 hover:text-green-500"><Plus size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-4 border-t">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Delivery Address</label>
                                    <textarea
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                        placeholder="Flat No, Building, Area..."
                                        className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleCheckout}
                            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                        >
                            <span className="text-2xl">📱</span> Order via WhatsApp
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnlineStore;
