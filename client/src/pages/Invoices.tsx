import { useState } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import api from '../api';
import { Upload, CheckCircle, AlertOctagon } from 'lucide-react';

const Invoices = () => {
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleUpload = async () => {
        setUploading(true);
        try {
            // Stub: Send a dummy image URL
            const res = await api.post('/invoices/scan', {
                imageUrl: 'https://example.com/dummy-invoice.jpg',
            });
            setResult(res.data);
        } catch (error) {
            console.error(error);
            alert('Failed to scan invoice');
        } finally {
            setUploading(false);
        }
    };

    return (
        <OwnerLayout>
            <h1 className="text-2xl font-bold mb-6">Invoice Watchdog</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Scan New Invoice</h2>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500">
                        <Upload size={48} className="mb-4" />
                        <p className="mb-4">Click to upload or drag and drop</p>
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400"
                        >
                            {uploading ? 'Scanning...' : 'Simulate Scan'}
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                {result && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-4">Scan Results</h2>

                        {(!result.data.supplierName && result.data.items.length === 0) ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4 text-yellow-800">
                                <p className="font-bold">Scan Incomplete</p>
                                <p className="text-sm">Could not extract data automatically. Please enter details manually below.</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <p className="text-sm text-gray-500">Supplier</p>
                                    <p className="font-bold">{result.data.supplierName || 'Unknown'}</p>
                                </div>

                                <div className="mb-4">
                                    <p className="text-sm text-gray-500">Total Amount</p>
                                    <p className="font-bold text-xl">₹{result.data.totalAmount}</p>
                                </div>

                                {result.alerts.length > 0 ? (
                                    <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                                        <h3 className="text-red-800 font-bold flex items-center gap-2">
                                            <AlertOctagon size={18} />
                                            Watchdog Alerts
                                        </h3>
                                        <ul className="list-disc list-inside text-red-700 mt-2 text-sm">
                                            {result.alerts.map((alert: string, idx: number) => (
                                                <li key={idx}>{alert}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 border border-green-200 rounded p-4 mb-4 flex items-center gap-2 text-green-800">
                                        <CheckCircle size={18} />
                                        No issues detected. Prices match history.
                                    </div>
                                )}

                                <div>
                                    <h3 className="font-semibold mb-2">Items Logged</h3>
                                    <ul className="space-y-2">
                                        {result.data.items.map((item: any, idx: number) => (
                                            <li key={idx} className="flex justify-between text-sm border-b pb-1">
                                                <span>{item.name} (x{item.quantity})</span>
                                                <span>₹{item.rate}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </OwnerLayout>
    );
};

export default Invoices;
