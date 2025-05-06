import React from 'react';
import { FaTrophy, FaSpinner } from 'react-icons/fa';

function Leaderboard({ data, loading, error }) {
    if (loading) {
        return <div className='text-center p-4'><FaSpinner className='animate-spin mx-auto text-muted' /></div>;
    }
    if (error) {
        return <div className="alert alert-warning text-sm">{error}</div>;
    }
    if (!data || data.length === 0) {
        return <div className="text-center p-4 text-muted text-sm">Henüz lider tablosu verisi yok.</div>;
    }

    return (
        <div className="leaderboard mt-6">
            <h4 className="font-semibold text-lg mb-3 flex items-center justify-center gap-2">
                <FaTrophy className='text-warning' /> Lider Tablosu (Top 10)
            </h4>
            {/* Tablo veya Liste ile gösterim */}
<ol className="list-decimal list-inside space-y-2 text-left">
    {data.map((entry, index) => (
        <li key={entry.userId || index} className={`p-2 rounded-md flex justify-between ${index < 3 ? 'font-semibold' : ''} ${index === 0 ? 'bg-[var(--bg-tertiary)]' : ''}`}>
            <span>
                <span className='inline-block w-6 mr-2 text-right'>{index + 1}.</span>
                {(entry.user?.username) || `Kullanıcı ${entry.userId}`}
            </span>
            <span className='font-bold text-[var(--accent-primary)]'>{entry.score} Puan</span>
        </li>
    ))}
</ol>
        </div>
    );
}

export default Leaderboard;
