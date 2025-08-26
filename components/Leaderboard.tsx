import { useState, useEffect } from 'react';
import { GameResult } from '../types';

interface LeaderboardProps {
  roomId?: string;
  limit?: number;
}

export default function Leaderboard({ roomId = 'global', limit = 10 }: LeaderboardProps) {
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/leaderboard?roomId=${roomId}&limit=${limit}`);
        const data = await response.json();
        
        if (data.success) {
          setResults(data.data);
        } else {
          setError('Failed to fetch leaderboard');
        }
      } catch (err) {
        setError('Error fetching leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [roomId, limit]);

  if (loading) {
    return <div className="text-center">Loading leaderboard...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {roomId === 'global' ? 'Global Leaderboard' : `Room ${roomId} Leaderboard`}
      </h2>
      
      {results.length === 0 ? (
        <p className="text-center">No results yet. Be the first to play!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Rank</th>
                <th className="py-2 px-4 border-b">Username</th>
                <th className="py-2 px-4 border-b">WPM</th>
                <th className="py-2 px-4 border-b">Accuracy</th>
                <th className="py-2 px-4 border-b">Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2 px-4 border-b text-center">{index + 1}</td>
                  <td className="py-2 px-4 border-b">{result.username}</td>
                  <td className="py-2 px-4 border-b text-center">{result.wpm}</td>
                  <td className="py-2 px-4 border-b text-center">{result.accuracy}%</td>
                  <td className="py-2 px-4 border-b text-center">
                    {new Date(result.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}