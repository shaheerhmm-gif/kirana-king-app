import { useState, useEffect } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import { Package, AlertTriangle } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';

interface LooseItem {
    id: string;
    name: string;
    looseLevel: string | null;
    estimatedQuantityKg: number;
    fullQuantityKg: number;
}

interface Stats {
    dailyAvgConsumption: number;
    estimatedStockKg: number;
    daysLeft: number | null;
    totalSoldLast30Days: number;
}

export const LooseInventory = () => {
    const [looseItems, setLooseItems] = useState<LooseItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<LooseItem | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const levels = [
        { value: 'FULL', label: 'Full', percent: 100 },
        { value: 'THREE_QUARTER', label: '3/4', percent: 75 },
        { value: 'HALF', label: 'Half', percent: 50 },
        { value: 'LOW', label: 'Low', percent: 20 },
        { value: 'EMPTY', label: 'Empty', percent: 0 }
    ];

    useEffect(() => {
        fetchLooseItems();
    }, []);

    const fetchLooseItems = async () => {
        setLoading(true);
        try {
            const res = await api.get('/loose');
            setLooseItems(res.data);
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to load loose items', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async (itemId: string) => {
        try {
            const res = await api.get(`/loose/${itemId}/stats`);
            setStats(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateLevel = async (itemId: string, level: string) => {
        try {
            await api.put(`/loose/${itemId}/level`, { looseLevel: level });
            showToast('Level updated successfully!', 'success');
            fetchLooseItems();
            if (selectedItem?.id === itemId) {
                fetchStats(itemId);
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to update level', 'error');
        }
    };

    const getLevelColor = (level: string | null) => {
        switch (level) {
            case 'FULL': return 'bg-green-500';
            case 'THREE_QUARTER': return 'bg-green-400';
            case 'HALF': return 'bg-yellow-500';
            case 'LOW': return 'bg-orange-500';
            case 'EMPTY': return 'bg-red-500';
            default: return 'bg-gray-300';
        }
    };

    const getLevelPercent = (level: string | null) => {
        const found = levels.find(l => l.value === level);
        return found ? found.percent : 0;
    };

    if (loading) {
        return (
            <OwnerLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </OwnerLayout>
        );
    }

    return (
        <OwnerLayout>
            <div className="max-w-6xl mx-auto p-4 space-y-6">
                <h1 className="text-3xl font-bold text-gray-800">Loose Item Inventory</h1>

                {looseItems.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center">
                        <Package size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600">No loose items configured.</p>
                        <p className="text-sm text-gray-500 mt-2">Configure an item as "loose" in your inventory to track it here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {looseItems.map(item => {
                            const levelPct = getLevelPercent(item.looseLevel);
                            return (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition"
                                    onClick={() => {
                                        setSelectedItem(item);
                                        fetchStats(item.id);
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold">{item.name}</h3>
                                            <p className="text-sm text-gray-600">~{item.estimatedQuantityKg.toFixed(1)} kg</p>
                                        </div>
                                        <Package size={24} className="text-indigo-600" />
                                    </div>

                                    {/* Level Indicator */}
                                    <div className="mb-4">
                                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                            <div
                                                className={`h-full ${getLevelColor(item.looseLevel)} transition-all`}
                                                style={{ width: `${levelPct}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {levels.find(l => l.value === item.looseLevel)?.label || 'Not set'}
                                        </p>
                                    </div>

                                    {/* Level Buttons */}
                                    <div className="grid grid-cols-5 gap-1">
                                        {levels.map(level => (
                                            <button
                                                key={level.value}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdateLevel(item.id, level.value);
                                                }}
                                                className={`py-1 px-2 rounded text-xs font-medium transition ${item.looseLevel === level.value
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {level.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Stats Panel */}
                {selectedItem && stats && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                        <h2 className="text-2xl font-bold mb-4">{selectedItem.name} - Stats</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-indigo-100 text-sm">Estimated Stock</div>
                                <div className="text-2xl font-bold">{stats.estimatedStockKg.toFixed(1)} kg</div>
                            </div>
                            <div>
                                <div className="text-indigo-100 text-sm">Daily Avg Consumption</div>
                                <div className="text-2xl font-bold">{stats.dailyAvgConsumption.toFixed(2)} units</div>
                            </div>
                            <div>
                                <div className="text-indigo-100 text-sm">Days Left</div>
                                <div className="text-2xl font-bold flex items-center gap-2">
                                    {stats.daysLeft !== null ? `${Math.round(stats.daysLeft)} days` : 'N/A'}
                                    {stats.daysLeft !== null && stats.daysLeft < 5 && (
                                        <AlertTriangle size={20} className="text-yellow-300" />
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="text-indigo-100 text-sm">Sold (Last 30d)</div>
                                <div className="text-2xl font-bold">{stats.totalSoldLast30Days} units</div>
                            </div>
                        </div>
                        {stats.daysLeft !== null && stats.daysLeft < 5 && (
                            <div className="mt-4 bg-yellow-500 text-yellow-900 rounded-lg p-3 flex items-center gap-2">
                                <AlertTriangle size={20} />
                                <span className="font-medium">Low stock! Reorder soon.</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </OwnerLayout>
    );
};
