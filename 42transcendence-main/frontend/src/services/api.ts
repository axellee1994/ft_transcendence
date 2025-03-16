/**
 * API Service for handling backend API calls
 */

// Base URL for API requests
const API_BASE_URL = 'http://localhost:3001';

// Types
export interface User {
  id: number;
  username: string;
  display_name: string;
  avatar: string | null;
  created_at: string;
}

export interface Game {
  id: number;
  player1_id: number;
  player2_id: number;
  player1_score: number;
  player2_score: number;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at?: string;
  player1_username?: string;
  player2_username?: string;
}

export interface Tournament {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

export interface TournamentParticipant {
  id: number;
  username: string;
  display_name: string;
  status: 'registered' | 'active' | 'eliminated';
}

// API methods
export const api = {
  // Health check
  async getHealth(): Promise<{ status: string, timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  // User endpoints
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/api/users`);
    return response.json();
  },

  async getUserById(id: number): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`);
    return response.json();
  },

  async createUser(userData: { username: string, display_name: string }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  // Game endpoints
  async getGames(): Promise<Game[]> {
    const response = await fetch(`${API_BASE_URL}/api/games`);
    return response.json();
  },

  async getGameById(id: number): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/api/games/${id}`);
    return response.json();
  },

  async createGame(gameData: { player1_id: number, player2_id: number }): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData),
    });
    return response.json();
  },

  async updateGame(id: number, gameData: { player1_score?: number, player2_score?: number, status?: string }): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/api/games/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData),
    });
    return response.json();
  },

  // Tournament endpoints
  async getTournaments(): Promise<Tournament[]> {
    const response = await fetch(`${API_BASE_URL}/api/tournaments`);
    return response.json();
  },

  async getTournamentById(id: number): Promise<Tournament> {
    const response = await fetch(`${API_BASE_URL}/api/tournaments/${id}`);
    return response.json();
  },

  async createTournament(tournamentData: { name: string, description: string, start_date: string, end_date: string }): Promise<Tournament> {
    const response = await fetch(`${API_BASE_URL}/api/tournaments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tournamentData),
    });
    return response.json();
  },

  async getTournamentParticipants(tournamentId: number): Promise<TournamentParticipant[]> {
    const response = await fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}/participants`);
    return response.json();
  },

  async registerForTournament(tournamentId: number, userId: number): Promise<TournamentParticipant[]> {
    const response = await fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}/participants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });
    return response.json();
  },

  // Error handling helper
  async handleResponse(response: Response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `API error: ${response.status}`);
    }
    return response.json();
  }
}; 