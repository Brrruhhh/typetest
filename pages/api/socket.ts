import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { NextApiResponseServerIO } from '../../types/next';
import dbConnect from '../../utils/database';
import UserResult from '../../models/UserResult';

const textSamples = [
  "The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet.",
  "Programming is the process of creating a set of instructions that tell a computer how to perform a task.",
  "The best way to predict the future is to invent it. Computer scientists are the architects of the digital world.",
  "Typing quickly and accurately is an essential skill for programmers and writers alike in the digital age.",
  "Socket.IO enables real-time bidirectional event-based communication. It works on every platform, browser or device."
];

export const config = {
  api: {
    bodyParser: false,
  },
};

// In-memory storage for rooms (for demo purposes)
// In production, you might want to use Redis or similar for persistence
const rooms: Record<string, any> = {};

export default async function socketHandler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (!res.socket.server.io) {
    console.log('New Socket.io server...');
    // adapt Next's net Server to http Server
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socket',
    });

    // Connect to MongoDB
    await dbConnect();

    // Socket.IO server logic
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Handle user joining a room
      socket.on('join-room', async (data: { roomId: string; username: string }) => {
        const { roomId, username } = data;
        
        // Create room if it doesn't exist
        if (!rooms[roomId]) {
          rooms[roomId] = {
            id: roomId,
            players: [],
            text: textSamples[Math.floor(Math.random() * textSamples.length)],
            isPlaying: false,
            isFinished: false,
            countdown: 10,
            startTime: null,
            messages: []
          };
        }

        // Check if username already exists in room
        const existingPlayer = rooms[roomId].players.find((p: any) => p.username === username);
        
        if (existingPlayer) {
          // Reconnecting player
          existingPlayer.id = socket.id;
          existingPlayer.disconnected = false;
        } else {
          // New player
          rooms[roomId].players.push({
            id: socket.id,
            username,
            progress: 0,
            wpm: 0,
            accuracy: 100,
          });
        }

        // Join the room
        socket.join(roomId);
        
        // Send room data to the joining client
        socket.emit('room-data', rooms[roomId]);
        
        // Notify other players in the room
        socket.to(roomId).emit('player-joined', {
          id: socket.id,
          username,
          progress: 0,
          wpm: 0,
          accuracy: 100,
        });

        // Send updated player list to all clients in the room
        io.to(roomId).emit('players-update', rooms[roomId].players);

        // If room has 2+ players and game hasn't started, start countdown
        if (rooms[roomId].players.length >= 2 && !rooms[roomId].isPlaying && !rooms[roomId].isFinished) {
          rooms[roomId].isPlaying = true;
          startCountdown(io, roomId);
        }
      });

      // Handle typing progress
      socket.on('typing-progress', (data: { roomId: string; progress: number; wpm: number; accuracy: number }) => {
        const { roomId, progress, wpm, accuracy } = data;
        const room = rooms[roomId];
        
        if (room) {
          const player = room.players.find((p: any) => p.id === socket.id);
          if (player) {
            player.progress = progress;
            player.wpm = wpm;
            player.accuracy = accuracy;
            
            // Broadcast updated progress to all players in the room
            socket.to(roomId).emit('player-progress', {
              playerId: socket.id,
              progress,
              wpm,
              accuracy
            });

            // Check if all players have finished
            if (room.isPlaying && room.players.every((p: any) => p.progress >= 100)) {
              endGame(io, roomId);
            }
          }
        }
      });

      // Handle chat messages
      socket.on('send-message', (data: { roomId: string; message: string; username: string }) => {
        const { roomId, message, username } = data;
        const room = rooms[roomId];
        
        if (room) {
          const chatMessage = {
            username,
            message,
            timestamp: new Date()
          };
          
          room.messages.push(chatMessage);
          
          // Broadcast message to all players in the room
          io.to(roomId).emit('receive-message', chatMessage);
        }
      });

      // Handle player disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Find the room the player was in
        for (const roomId in rooms) {
          const room = rooms[roomId];
          const playerIndex = room.players.findIndex((p: any) => p.id === socket.id);
          
          if (playerIndex !== -1) {
            // Mark player as disconnected but keep their data
            room.players[playerIndex].disconnected = true;
            
            // Notify other players
            socket.to(roomId).emit('player-left', socket.id);
            
            // Send updated player list
            io.to(roomId).emit('players-update', room.players);
            break;
          }
        }
      });
    });

    // Store the io instance
    res.socket.server.io = io;
  }
  res.end();
}

// Countdown timer function
function startCountdown(io: ServerIO, roomId: string) {
  const room = rooms[roomId];
  if (!room) return;

  room.countdown = 10;
  
  const countdownInterval = setInterval(() => {
    room.countdown--;
    
    // Broadcast countdown to all players
    io.to(roomId).emit('countdown', room.countdown);
    
    if (room.countdown <= 0) {
      clearInterval(countdownInterval);
      startGame(io, roomId);
    }
  }, 1000);
}

// Start the game
function startGame(io: ServerIO, roomId: string) {
  const room = rooms[roomId];
  if (!room) return;

  room.startTime = Date.now();
  io.to(roomId).emit('game-start', {
    text: room.text,
    startTime: room.startTime
  });

  // Set a timeout to end the game after 2 minutes (if no one finishes)
  setTimeout(() => {
    if (room.isPlaying && !room.isFinished) {
      endGame(io, roomId);
    }
  }, 120000);
}

// End the game and save results
async function endGame(io: ServerIO, roomId: string) {
  const room = rooms[roomId];
  if (!room || room.isFinished) return;

  room.isPlaying = false;
  room.isFinished = true;

  // Calculate final results
  const results = room.players.map((player: any) => ({
    username: player.username,
    wpm: player.wpm,
    accuracy: player.accuracy,
    roomId,
    timestamp: new Date()
  }));

  // Save results to MongoDB
  try {
    await UserResult.insertMany(results);
  } catch (error) {
    console.error('Error saving results to database:', error);
  }

  // Broadcast game end and results
  io.to(roomId).emit('game-end', results);
}