import React from 'react';

interface TrustBadgeProps {
    score: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
    size?: 'sm' | 'lg';
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ score, status, size = 'sm' }) => {
    const colorClass =
        status === 'GREEN' ? 'bg-green-100 text-green-800 border-green-200' :
            status === 'YELLOW' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-red-100 text-red-800 border-red-200';

    const dotColor =
        status === 'GREEN' ? 'bg-green-500' :
            status === 'YELLOW' ? 'bg-yellow-500' :
                'bg-red-500';

    const label =
        status === 'GREEN' ? 'Safe' :
            status === 'YELLOW' ? 'Caution' :
                'Risky';

    if (size === 'sm') {
        return (
            <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`}></span>
                {label}
            </div>
        );
    }

    return (
        <div className={`flex items-center p-3 rounded-lg border ${colorClass}`}>
            <div className={`w-3 h-3 rounded-full mr-3 ${dotColor}`}></div>
            <div>
                <p className="font-bold text-sm uppercase tracking-wide opacity-75">Trust Score</p>
                <p className="text-xl font-bold">{score}/100 <span className="text-sm font-normal">({label})</span></p>
            </div>
        </div>
    );
};

export default TrustBadge;
