export interface User {
  id: string;
  name: string;
  avatar: string;
  gender?: 'male' | 'female' | 'other';
  status: 'online' | 'busy' | 'away';
  age?: number;
  country?: string;
  interests?: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  type: 'text' | 'system';
}

export interface Game {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'strategy' | 'trivia' | 'party' | 'casual';
  supportsAI: boolean;
  players: '1v1' | 'multiplayer';
}

export type MatchMode = 'dynamic' | 'opposite';
export type Gender = 'male' | 'female' | 'other';

export interface MatchPreferences {
  mode: MatchMode;
  myGender?: Gender;
  preferredGender?: Gender;
}

export interface VideoState {
  isMuted: boolean;
  isVideoOff: boolean;
  isConnected: boolean;
  isSearching: boolean;
}

export interface GameState {
  currentGame: Game | null;
  isPlaying: boolean;
  opponent: 'human' | 'ai' | null;
  score: { player: number; opponent: number };
}
