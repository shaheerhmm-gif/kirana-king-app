import React from 'react';
import { Plus } from 'lucide-react';

interface TopItem {
    id: string;
    name: string;
    price: number;
    stock: number;
}

interface RushModeGridProps {
    items: TopItem[];
    onAddItem: (item: TopItem) => void;
}

const RushModeGrid: React.FC<RushModeGridProps> = ({ items, onAddItem }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onAddItem(item)}
                    className="relative bg-white border-2 border-indigo-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-500 transition-all text-left group active:scale-95"
                >
                    <div className="absolute top-2 right-2 bg-indigo-50 text-indigo-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={20} />
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 leading-tight mb-1 line-clamp-2">
                        {item.name}
                    </h3>

                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-indigo-700">₹{item.price}</span>
                        <span className="text-xs text-gray-400">/ unit</span>
                    </div>

                    <div className="mt-2 text-xs font-medium text-gray-500">
                        Stock: {item.stock}
                    </div>
                </button>
            ))}

            {items.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400">
                    <p>No top items found yet. Start billing to build history!</p>
                </div>
            )}
        </div>
    );
};

export default RushModeGrid;
