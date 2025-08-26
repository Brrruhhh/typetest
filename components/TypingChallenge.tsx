import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Player, Room } from '../types';

interface TypingChallengeProps {
  socket: Socket;
  room: Room;
  username: string;
}

export default function TypingChallenge({ socket, room, username }: TypingChallengeProps) {
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (room.startTime && !startTime) {
      setStartTime(room.startTime);
    }
  }, [room.startTime]);

  useEffect(() => {
    if (room.isPlaying && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [room.isPlaying]);

  useEffect(() => {
    if (!room.isPlaying || !startTime) return;

    const progress = (input.length / room.text.length) * 100;
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    const currentWpm = timeElapsed > 0 ? Math.round((input.length / 5) / timeElapsed) : 0;
    
    // Calculate accuracy
    let errors = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] !== room.text[i]) {
        errors++;
      }
    }
    const currentAccuracy = input.length > 0 ? Math.round(((input.length - errors) / input.length) * 100) : 100;
    
    setWpm(currentWpm);
    setAccuracy(currentAccuracy);

    // Send progress to server
    socket.emit('typing-progress', {
      roomId: room.id,
      progress: Math.min(progress, 100),
      wpm: currentWpm,
      accuracy: currentAccuracy
    });

    // Check if finished
    if (input === room.text) {
      setInput(room.text); // Lock input
    }
  }, [input, room.isPlaying, room.text, startTime]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!room.isPlaying || room.isFinished) return;
    
    const value = e.target.value;
    if (value.length <= room.text.length) {
      setInput(value);
    }
  };

  const getCharacterClass = (index: number) => {
    if (index >= input.length) return 'text-gray-700';
    if (input[index] === room.text[index]) return 'text-green-600';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      {!room.isPlaying && !room.isFinished && (
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">Waiting for players...</h2>
          <p className="text-lg">Game will start automatically when there are at least 2 players</p>
          {room.countdown > 0 && (
            <p className="text-2xl font-bold mt-4">Starting in: {room.countdown}</p>
          )}
        </div>
      )}

      {room.isPlaying && !room.isFinished && (
        <>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg">
                <span className="font-bold">WPM:</span> {wpm}
              </div>
              <div className="text-lg">
                <span className="font-bold">Accuracy:</span> {accuracy}%
              </div>
              <div className="text-lg">
                <span className="font-bold">Progress:</span> {Math.min(Math.round((input.length / room.text.length) * 100), 100)}%
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              {room.text.split('').map((char, index) => (
                <span key={index} className={getCharacterClass(index)}>
                  {char}
                </span>
              ))}
            </div>

            <textarea
              ref={textAreaRef}
              value={input}
              onChange={handleInputChange}
              className="w-full h-32 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Start typing here..."
              disabled={room.isFinished || input === room.text}
            />
          </div>
        </>
      )}

      {room.isFinished && (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Game Finished!</h2>
          <div className="mb-6">
            <p className="text-lg">Your results:</p>
            <p className="text-xl font-bold">WPM: {wpm}</p>
            <p className="text-xl font-bold">Accuracy: {accuracy}%</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Play Again
          </button>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-bold mb-2">Players in this room:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {room.players.map((player) => (
            <div
              key={player.id}
              className={`p-3 rounded-lg border ${
                player.username === username ? 'bg-blue-100 border-blue-300' : 'bg-gray-100'
              } ${player.disconnected ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold">{player.username} {player.username === username ? '(You)' : ''}</span>
                {player.disconnected && <span className="text-xs text-red-500">Disconnected</span>}
              </div>
              <div className="mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${player.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>WPM: {player.wpm}</span>
                  <span>Accuracy: {player.accuracy}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}