export interface Player {
  id: string;
  username: string;
  progress: number;
  wpm: number;
  accuracy: number;
  disconnected?: boolean;
}

export interface Room {
  id: string;
  players: Player[];
  text: string;
  isPlaying: boolean;
  isFinished: boolean;
  countdown: number;
  startTime: number | null;
}

export interface GameResult {
  username: string;
  wpm: number;
  accuracy: number;
  timestamp: Date;
}

export interface ChatMessage {
  username: string;
  message: string;
  timestamp: Date;
}