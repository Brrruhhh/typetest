import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { io, Socket } from 'socket.io-client';
import { Room, Player } from '../../types';
import TypingChallenge from '../../components/TypingChallenge';
import Chat from '../../components/Chat';

export default function RoomPage() {
  const router = useRouter();
  const { id } = router.query;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get username from localStorage
    const savedUsername = localStorage.getItem('username');
    if (!savedUsername) {
      router.push('/');
      return;
    }
    setUsername(savedUsername);
  }, []);

  useEffect(() => {
    if (!id || !username) return;

    const socketIO = io({
      path: '/api/socket',
    });

    socketIO.on('connect', () => {
      console.log('Connected to server');
      setSocket(socketIO);
      socketIO.emit('join-room', { roomId: id, username });
    });

    socketIO.on('room-data', (roomData: Room) => {
      setRoom(roomData);
      setLoading(false);
    });

    socketIO.on('players-update', (players: Player[]) => {
      setRoom(prev => prev ? { ...prev, players } : null);
    });

    socketIO.on('countdown', (countdown: number) => {
      setRoom(prev => prev ? { ...prev, countdown } : null);
    });

    socketIO.on('game-start', (data: { text: string; startTime: number }) => {
      setRoom(prev => prev ? { 
        ...prev, 
        text: data.text, 
        startTime: data.startTime,
        isPlaying: true 
      } : null);
    });

    socketIO.on('player-progress', (data: { playerId: string; progress: number; wpm: number; accuracy: number }) => {
      setRoom(prev => {
        if (!prev) return null;
        
        const updatedPlayers = prev.players.map(player => 
          player.id === data.playerId 
            ? { ...player, progress: data.progress, wpm: data.wpm, accuracy: data.accuracy }
            : player
        );
        
        return { ...prev, players: updatedPlayers };
      });
    });

    socketIO.on('game-end', (results: any[]) => {
      setRoom(prev => prev ? { ...prev, isPlaying: false, isFinished: true } : null);
    });

    socketIO.on('player-joined', (player: Player) => {
      setRoom(prev => prev ? { 
        ...prev, 
        players: [...prev.players, player] 
      } : null);
    });

    socketIO.on('player-left', (playerId: string) => {
      setRoom(prev => {
        if (!prev) return null;
        
        const updatedPlayers = prev.players.map(player => 
          player.id === playerId 
            ? { ...player, disconnected: true }
            : player
        );
        
        return { ...prev, players: updatedPlayers };
      });
    });

    socketIO.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Failed to connect to server');
      setLoading(false);
    });

    return () => {
      socketIO.disconnect();
    };
  }, [id, username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Connecting to room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p>Room not found</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Room: {id}</h1>
          <button 
            onClick={() => router.push('/')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Leave Room
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TypingChallenge socket={socket!} room={room} username={username} />
          </div>
          
          <div>
            <Chat socket={socket!} roomId={id as string} username={username} />
          </div>
        </div>
      </div>
    </div>
  );
}