import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
// import { io, Socket } from 'socket.io-client'; // Removed unused import

interface RoomListProps {
  username: string;
  setUsername: (username: string) => void;
}

export default function RoomList({ username, setUsername }: RoomListProps) {
  const [roomId, setRoomId] = useState('');
  const [quickMatchLoading, setQuickMatchLoading] = useState(false);
  const router = useRouter();

  const handleCreateRoom = () => {
    if (!username.trim()) return alert('Please enter a username');
    
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('username', username);
    localStorage.setItem('sessionId', Math.random().toString(36).substring(2));
    router.push(`/room/${newRoomId}`);
  };

  const handleJoinRoom = () => {
    if (!username.trim()) return alert('Please enter a username');
    if (!roomId.trim()) return alert('Please enter a room ID');
    
    localStorage.setItem('username', username);
    localStorage.setItem('sessionId', Math.random().toString(36).substring(2));
    router.push(`/room/${roomId}`);
  };

  const handleQuickMatch = () => {
    if (!username.trim()) return alert('Please enter a username');
    
    setQuickMatchLoading(true);
    localStorage.setItem('username', username);
    localStorage.setItem('sessionId', Math.random().toString(36).substring(2));
    
    // For demo purposes, we'll just create a new room
    // In a real app, you'd find an available room with players waiting
    setTimeout(() => {
      const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      router.push(`/room/${newRoomId}`);
    }, 1000);
  };

  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Typing Challenge Game</h1>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Enter your username"
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="roomId">
          Room ID (to join existing room)
        </label>
        <input
          id="roomId"
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline uppercase"
          placeholder="Enter room ID"
        />
      </div>

      <div className="flex flex-col space-y-4">
        <button
          onClick={handleCreateRoom}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Create New Room
        </button>
        
        <button
          onClick={handleJoinRoom}
          disabled={!roomId.trim()}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          Join Room
        </button>
        
        <button
          onClick={handleQuickMatch}
          disabled={quickMatchLoading}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {quickMatchLoading ? 'Finding match...' : 'Quick Match'}
        </button>
        
        <button
          onClick={() => router.push('/leaderboard')}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          View Leaderboard
        </button>
      </div>
    </div>
  );
}