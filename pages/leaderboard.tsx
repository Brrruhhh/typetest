import { useState } from 'react';
import Leaderboard from '../components/Leaderboard';

export default function LeaderboardPage() {
  const [view, setView] = useState<'global' | string>('global');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Typing Challenge Leaderboard</h1>
          
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={() => setView('global')}
              className={`px-4 py-2 rounded ${
                view === 'global' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-blue-500 border border-blue-500'
              }`}
            >
              Global Leaderboard
            </button>
            <button
              onClick={() => setView('room')}
              className={`px-4 py-2 rounded ${
                view === 'room' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-blue-500 border border-blue-500'
              }`}
            >
              Room Leaderboard
            </button>
          </div>
        </div>

        {view === 'global' ? (
          <Leaderboard />
        ) : (
          <div className="text-center">
            <p className="mb-4">Enter a room ID to view its leaderboard:</p>
            <div className="max-w-md mx-auto">
              <input
                type="text"
                placeholder="Room ID"
                className="w-full p-2 border rounded mb-4"
                onChange={(e) => setView(e.target.value.toUpperCase())}
              />
            </div>
            {view !== 'room' && view !== 'global' && (
              <Leaderboard roomId={view} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}