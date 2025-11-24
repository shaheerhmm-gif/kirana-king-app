import { useState, useEffect, useRef } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import { Search, ShoppingCart, Plus, Minus, Trash2, Send, X, Pause, Play, AlertCircle, CreditCard, Smartphone, Banknote, Mic, MicOff, ScanLine } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import SplitPaymentModal from '../components/SplitPaymentModal';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import { parseVoiceCommand } from '../utils/voiceParser';

interface Product {
    id: string;
    name: string;
    barcode?: string;
    batches: any[];
}

interface CartItem extends Product {
    quantity: number;
    rate: number;
    batchId?: string;
}

interface Customer {
    id: string;
    name: string;
    phone: string;
}

interface ParkedBill {
    id: string;
    customer?: { name: string };
    items: any[];
    subtotal: number;
    parkedAt: string;
}

const QuickSale = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [whatsappEnabled, setWhatsappEnabled] = useState(true);
    const [showCartMobile, setShowCartMobile] = useState(false);
    const { showToast } = useToast();

    // New: Parked bills state
    const [parkedBills, setParkedBills] = useState<ParkedBill[]>([]);
    const [showParkedBills, setShowParkedBills] = useState(false);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

    // Payment mode state
    const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'CREDIT' | 'SPLIT'>('CASH');
    const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false);
    const [splitPayments, setSplitPayments] = useState<any[]>([]);
    const [billFormat, setBillFormat] = useState('THERMAL_58MM');

    // Voice Recognition State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Camera Scanner State
    const [showCameraScanner, setShowCameraScanner] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
        fetchParkedBills();

        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-IN'; // Works well for Hinglish/Marathi mix

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                handleVoiceCommand(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                showToast('Voice recognition failed. Try again.', 'error');
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [products]); // Re-bind if products change (for closure access if needed, though we pass products to parser)

    const handleVoiceCommand = (transcript: string) => {
        console.log('Voice Command:', transcript);
        const result = parseVoiceCommand(transcript, products);

        if (result.productId) {
            const product = products.find(p => p.id === result.productId);
            if (product) {
                // Add to cart with parsed quantity
                addToCart(product, result.quantity);
                showToast(`Added ${result.quantity} x ${product.name}`, 'success');
            }
        } else {
            showToast(`Could not understand "${transcript}"`, 'error');
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
            showToast('Listening... Speak now (e.g., "Do Maggie")', 'info');
        }
    };

    // Barcode Scanner Integration (for physical scanners)
    useBarcodeScanner({
        onScan: (barcode) => {
            handleBarcodeScanned(barcode);
        }
    });

    // Handle barcode from any source (physical scanner or camera)
    const handleBarcodeScanned = (barcode: string) => {
        const product = products.find(p => p.barcode === barcode);
        if (product) {
            addToCart(product);
            showToast(`Added ${product.name}`, 'success');
        } else {
            showToast(`Product not found: ${barcode}`, 'error');
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (error) {
            console.error(error);
            showToast('Failed to fetch products', 'error');
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers');
            setCustomers(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchParkedBills = async () => {
        try {
            const res = await api.get('/parked');
            setParkedBills(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const addToCart = (product: Product, qtyToAdd: number = 1) => {
        const existingItem = cart.find(item => item.id === product.id);
        const batch = product.batches?.find((b: any) => b.quantity > 0);

        if (!batch) {
            showToast('Product out of stock', 'error');
            return;
        }

        if (existingItem) {
            if (existingItem.quantity + qtyToAdd > (batch.quantity || 0)) {
                showToast('Insufficient stock', 'error');
                return;
            }
            setCart(cart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + qtyToAdd }
                    : item
            ));
        } else {
            setCart([...cart, {
                ...product,
                quantity: qtyToAdd,
                rate: batch.sellingPrice,
                batchId: batch.id
            }]);
        }
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.id === productId) {
                const newQty = item.quantity + delta;
                if (newQty < 1) return item;

                // Check stock
                const product = products.find(p => p.id === productId);
                const batch = product?.batches?.find((b: any) => b.id === item.batchId);
                if (batch && newQty > batch.quantity) {
                    showToast('Insufficient stock', 'error');
                    return item;
                }

                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCart([]);
        setSelectedCustomer('');
        setPaymentMode('CASH');
        setSplitPayments([]);
    };

    const parkBill = async () => {
        if (cart.length === 0) return;

        try {
            await api.post('/parked', {
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    rate: item.rate
                })),
                customerId: selectedCustomer || undefined,
                subtotal: cart.reduce((sum, item) => sum + (item.rate * item.quantity), 0)
            });

            showToast('Bill parked successfully', 'success');
            clearCart();
            fetchParkedBills();
        } catch (error) {
            console.error(error);
            showToast('Failed to park bill', 'error');
        }
    };

    const resumeParkedBill = async (bill: ParkedBill) => {
        try {
            // Restore items to cart (needs mapping back to products)
            // For simplicity, we'll just delete the parked bill and let user re-add items
            // In a real app, we'd map these back to product objects

            // Actually, let's try to map them if possible, or just use the parked data
            // Since we need batch info which might not be in parked bill, 
            // we'll fetch the full bill details first
            const res = await api.get(`/parked/${bill.id}`);
            const fullBill = res.data;

            // Map items back to cart format
            const restoredCart: CartItem[] = [];
            for (const item of fullBill.items) {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    const batch = product.batches?.find((b: any) => b.quantity > 0);
                    restoredCart.push({
                        ...product,
                        quantity: item.quantity,
                        rate: item.rate,
                        batchId: batch?.id // Best effort assignment
                    });
                }
            }

            setCart(restoredCart);
            if (fullBill.customerId) setSelectedCustomer(fullBill.customerId);

            // Delete from parked
            await api.delete(`/parked/${bill.id}`);
            fetchParkedBills();
            setShowParkedBills(false);
            showToast('Bill resumed', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to resume bill', 'error');
        }
    };

    const deleteParkedBill = async (id: string) => {
        try {
            await api.delete(`/parked/${id}`);
            fetchParkedBills();
            showToast('Parked bill deleted', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to delete parked bill', 'error');
        }
    };

    const handleSale = async () => {
        if (cart.length === 0) return;

        // If split payment selected but not configured, show modal
        if (paymentMode === 'SPLIT' && splitPayments.length === 0) {
            setShowSplitPaymentModal(true);
            return;
        }

        setSubmitting(true);
        try {
            const saleData = {
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    rate: item.rate,
                    batchId: item.batchId
                })),
                customerId: selectedCustomer || undefined,
                whatsappInvoice: whatsappEnabled,
                paymentMode,
                payments: paymentMode === 'SPLIT' ? splitPayments : undefined
            };

            await api.post('/sales', saleData);
            showToast('Sale completed successfully!', 'success');
            clearCart();
            fetchProducts(); // Refresh inventory
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to complete sale', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Keyboard shortcuts
    useKeyboardShortcuts({
        'F2': () => clearCart(), // New bill
        'F3': () => parkBill(), // Park bill
        'F4': () => setShowParkedBills(true), // Show parked bills
        'F12': () => handleSale(), // Complete sale
        'Escape': () => {
            setShowCartMobile(false);
            setShowParkedBills(false);
            setShowShortcutsHelp(false);
            setShowSplitPaymentModal(false);
        },
        '?': () => setShowShortcutsHelp(true),
        'Ctrl+f': () => document.getElementById('search-input')?.focus(),
    });

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.includes(searchTerm)
    );

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + (item.rate * item.quantity), 0);

    return (
        <OwnerLayout>
            <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-8rem)]">
                {/* Left: Product Search */}
                <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold">Quick Sale</h1>
                        <div className="flex gap-2">
                            {parkedBills.length > 0 && (
                                <button
                                    onClick={() => setShowParkedBills(true)}
                                    className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 flex items-center gap-2"
                                >
                                    <Pause size={18} />
                                    Parked ({parkedBills.length})
                                </button>
                            )}
                            <button
                                onClick={() => setShowShortcutsHelp(true)}
                                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                                title="Keyboard Shortcuts"
                            >
                                ⌨️
                            </button>
                        </div>
                    </div>

                    {/* Search Bar & Voice Input */}
                    <div className="relative mb-4 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                id="search-input"
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or scan barcode... (Ctrl+F)"
                                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>
                        {/* Camera Scanner Button (Mobile) */}
                        <button
                            onClick={() => setShowCameraScanner(true)}
                            className="md:hidden p-3 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-all"
                            title="Scan Barcode with Camera"
                        >
                            <ScanLine size={24} />
                        </button>
                        <button
                            onClick={toggleListening}
                            className={`p-3 rounded-lg transition-all ${isListening
                                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                                : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}
                            title="Voice Command (e.g. 'Ek Maggie')"
                        >
                            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
                    </div>

                    {/* Customer Selection */}
                    <div className="mb-4">
                        <select
                            value={selectedCustomer}
                            onChange={(e) => setSelectedCustomer(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">Walk-in Customer (Cash)</option>
                            {customers.map(customer => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name} - {customer.phone}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {filteredProducts.map(product => {
                                const stock = product.batches?.reduce((sum: number, b: any) => sum + b.quantity, 0) || 0;
                                const isLowStock = stock < 5;
                                const isOutOfStock = stock === 0;

                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        disabled={isOutOfStock}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${isOutOfStock
                                            ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                                            : 'bg-white border-gray-200 hover:border-indigo-500 hover:shadow-md active:scale-95'
                                            }`}
                                    >
                                        <p className="font-semibold text-gray-800 mb-1">{product.name}</p>
                                        <p className="text-lg font-bold text-indigo-600 mb-1">
                                            ₹{product.batches?.[0]?.sellingPrice || 0}
                                        </p>
                                        <p className={`text-sm ${isOutOfStock ? 'text-red-600 font-semibold' : isLowStock ? 'text-orange-600' : 'text-gray-500'
                                            }`}>
                                            Stock: {stock}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Cart */}
                <div className="md:w-96 flex flex-col">
                    {/* Mobile Cart Button */}
                    {cart.length > 0 && (
                        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
                            <button
                                onClick={() => setShowCartMobile(true)}
                                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl flex justify-between items-center shadow-2xl"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="bg-white text-indigo-600 px-2 py-0.5 rounded-full text-sm font-bold">{totalItems}</span>
                                    <span className="font-medium">View Cart</span>
                                </div>
                                <span className="font-bold text-lg">₹{totalAmount}</span>
                            </button>
                        </div>
                    )}

                    {/* Desktop Cart / Mobile Bottom Sheet */}
                    <div className={`
                        fixed md:static inset-0 z-50 md:z-auto bg-black/50 md:bg-transparent transition-opacity
                        ${showCartMobile ? 'opacity-100' : 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto'}
                    `}>
                        <div className={`
                            absolute md:static bottom-0 left-0 right-0 bg-white md:bg-gray-50 rounded-t-2xl md:rounded-xl shadow-2xl md:shadow-none p-4 flex flex-col max-h-[80vh] md:h-full transition-transform duration-300
                            ${showCartMobile ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
                        `}>
                            {/* Mobile Handle */}
                            <div className="md:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" onClick={() => setShowCartMobile(false)} />

                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <ShoppingCart /> Bill ({totalItems})
                                </h2>
                                <div className="flex gap-2">
                                    {cart.length > 0 && (
                                        <button
                                            onClick={parkBill}
                                            className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 flex items-center gap-1"
                                            title="Park Bill (F3)"
                                        >
                                            <Pause size={16} />
                                            <span className="hidden md:inline">Park</span>
                                        </button>
                                    )}
                                    <button onClick={() => setShowCartMobile(false)} className="md:hidden p-2 bg-gray-100 rounded-full">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">{item.name}</p>
                                            <p className="text-sm text-gray-500">₹{item.rate} / unit</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-gray-100 rounded-lg">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:bg-gray-200 rounded-l-lg"><Minus size={16} /></button>
                                                <span className="w-8 text-center font-bold">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:bg-gray-200 rounded-r-lg"><Plus size={16} /></button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {cart.length === 0 && (
                                    <div className="text-center py-8 text-gray-400">
                                        <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
                                        <p>Cart is empty</p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t pt-4 bg-white md:bg-transparent">
                                <div className="flex justify-between text-2xl font-bold mb-4 text-gray-800">
                                    <span>Total</span>
                                    <span>₹{totalAmount}</span>
                                </div>

                                {/* Payment Mode Selector */}
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    <button
                                        onClick={() => setPaymentMode('CASH')}
                                        className={`p-2 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-colors ${paymentMode === 'CASH' ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-gray-50 text-gray-600 border border-gray-200'
                                            }`}
                                    >
                                        <Banknote size={20} className="mb-1" />
                                        Cash
                                    </button>
                                    <button
                                        onClick={() => setPaymentMode('UPI')}
                                        className={`p-2 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-colors ${paymentMode === 'UPI' ? 'bg-blue-100 text-blue-700 border-2 border-blue-500' : 'bg-gray-50 text-gray-600 border border-gray-200'
                                            }`}
                                    >
                                        <Smartphone size={20} className="mb-1" />
                                        UPI
                                    </button>
                                    <button
                                        onClick={() => setPaymentMode('CARD')}
                                        className={`p-2 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-colors ${paymentMode === 'CARD' ? 'bg-purple-100 text-purple-700 border-2 border-purple-500' : 'bg-gray-50 text-gray-600 border border-gray-200'
                                            }`}
                                    >
                                        <CreditCard size={20} className="mb-1" />
                                        Card
                                    </button>
                                    <button
                                        onClick={() => {
                                            setPaymentMode('SPLIT');
                                            setShowSplitPaymentModal(true);
                                        }}
                                        className={`p-2 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-colors ${paymentMode === 'SPLIT' ? 'bg-orange-100 text-orange-700 border-2 border-orange-500' : 'bg-gray-50 text-gray-600 border border-gray-200'
                                            }`}
                                    >
                                        <div className="flex mb-1"><Banknote size={14} /><Smartphone size={14} /></div>
                                        Split
                                    </button>
                                </div>

                                {/* Bill Format Selector */}
                                <div className="mb-4">
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Bill Format</label>
                                    <div className="flex gap-2">
                                        {['THERMAL_58MM', 'THERMAL_80MM', 'A4_SIMPLE'].map((format) => (
                                            <button
                                                key={format}
                                                onClick={() => setBillFormat(format)}
                                                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${billFormat === format
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {format.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mb-4 bg-green-50 p-3 rounded-lg border border-green-100">
                                    <input
                                        type="checkbox"
                                        id="whatsapp"
                                        checked={whatsappEnabled}
                                        onChange={(e) => setWhatsappEnabled(e.target.checked)}
                                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                    />
                                    <label htmlFor="whatsapp" className="text-sm font-medium text-green-800 flex-1">
                                        Send WhatsApp Invoice
                                    </label>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={clearCart}
                                        disabled={cart.length === 0}
                                        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
                                        title="New Bill (F2)"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={handleSale}
                                        disabled={submitting || cart.length === 0}
                                        className="flex-[2] bg-indigo-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-indigo-700 disabled:bg-gray-400 flex justify-center items-center gap-2 shadow-lg active:scale-95 transition-transform"
                                        title="Complete Sale (F12)"
                                    >
                                        {submitting ? 'Processing...' : (
                                            <>
                                                <Send size={20} />
                                                {paymentMode === 'SPLIT' ? 'Split Pay' : `Pay ${paymentMode}`}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Parked Bills Modal */}
            {showParkedBills && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]" onClick={() => setShowParkedBills(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Pause /> Parked Bills ({parkedBills.length})
                            </h2>
                            <button onClick={() => setShowParkedBills(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            {parkedBills.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <AlertCircle size={48} className="mx-auto mb-2 opacity-50" />
                                    <p>No parked bills</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {parkedBills.map((bill) => (
                                        <div key={bill.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-semibold">
                                                        {bill.customer?.name || 'Walk-in Customer'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(bill.parkedAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <p className="text-lg font-bold text-indigo-600">
                                                    ₹{bill.subtotal}
                                                </p>
                                            </div>
                                            <div className="mb-3">
                                                <p className="text-sm text-gray-600">
                                                    {bill.items.length} items: {bill.items.map(i => i.name).join(', ')}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => resumeParkedBill(bill)}
                                                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                                                >
                                                    <Play size={16} /> Resume
                                                </button>
                                                <button
                                                    onClick={() => deleteParkedBill(bill.id)}
                                                    className="px-4 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Split Payment Modal */}
            {showSplitPaymentModal && (
                <SplitPaymentModal
                    totalAmount={totalAmount}
                    onConfirm={(payments) => {
                        setSplitPayments(payments);
                        setPaymentMode('SPLIT');
                        // Optional: auto-complete sale here or let user click complete
                    }}
                    onClose={() => {
                        setShowSplitPaymentModal(false);
                        if (splitPayments.length === 0) setPaymentMode('CASH');
                    }}
                />
            )}

            {/* Keyboard Shortcuts Help Modal */}
            {showShortcutsHelp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]" onClick={() => setShowShortcutsHelp(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold">⌨️ Keyboard Shortcuts</h2>
                            <button onClick={() => setShowShortcutsHelp(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="space-y-2">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-gray-600">New Bill</span>
                                    <kbd className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">F2</kbd>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-gray-600">Park Bill</span>
                                    <kbd className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">F3</kbd>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-gray-600">Show Parked Bills</span>
                                    <kbd className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">F4</kbd>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-gray-600">Complete Sale</span>
                                    <kbd className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">F12</kbd>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-gray-600">Focus Search</span>
                                    <kbd className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">Ctrl+F</kbd>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-600">Close Modal</span>
                                    <kbd className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">Esc</kbd>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Scanner Modal */}
            {showCameraScanner && (
                <BarcodeScannerModal
                    onScan={handleBarcodeScanned}
                    onClose={() => setShowCameraScanner(false)}
                />
            )}
        </OwnerLayout>
    );
};

export default QuickSale;
