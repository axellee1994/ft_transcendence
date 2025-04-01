import { API_URL, AuthService } from './auth';

export interface Tournament {
    id: number;
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    status: 'pending' | 'active' | 'completed';
    winner_id?: number;
    created_at: string;
    updated_at: string;
}

export interface TournamentParticipant {
    id: number;
    tournament_id: number;
    user_id: number;
    status: 'registered' | 'active' | 'eliminated' | 'winner';
    created_at: string;
    updated_at: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
}

export class TournamentService {
    private static instance: TournamentService;

    private constructor() {}

    public static getInstance(): TournamentService {
        if (!TournamentService.instance) {
            TournamentService.instance = new TournamentService();
        }
        return TournamentService.instance;
    }

    public async getTournaments(): Promise<Tournament[]> {
        try {
            const authService = AuthService.getInstance();
            const token = authService.getToken();
            const response = await fetch(`${API_URL}/tournaments`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch tournaments: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching tournaments:', error);
            throw error;
        }
    }

    public async getTournament(id: number): Promise<Tournament> {
        try {
            const authService = AuthService.getInstance();
            const token = authService.getToken();
            const response = await fetch(`${API_URL}/tournaments/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch tournament: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching tournament ${id}:`, error);
            throw error;
        }
    }

    public async createTournament(data: {
        name: string;
        description?: string;
        start_date: string;
        end_date: string;
    }): Promise<Tournament> {
        try {
            const authService = AuthService.getInstance();
            const token = authService.getToken();
            console.log('Creating tournament with data:', data);
            
            const response = await fetch(`${API_URL}/tournaments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                // Try to get more detailed error information
                let errorMessage = response.statusText;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.error) {
                        errorMessage = errorData.error;
                    } else if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    } else {
                        console.error('Error response:', errorData);
                    }
                } catch (jsonError) {
                    console.error('Error parsing error response:', jsonError);
                }
                
                throw new Error(`Failed to create tournament: ${errorMessage}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating tournament:', error);
            throw error;
        }
    }

    public async joinTournament(tournamentId: number): Promise<TournamentParticipant> {
        try {
            const authService = AuthService.getInstance();
            const token = authService.getToken();
            console.log(`Attempting to join tournament ${tournamentId}`);
            
            const response = await fetch(`${API_URL}/tournaments/${tournamentId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                // Try to get more detailed error information
                let errorMessage = response.statusText;
                try {
                    const errorData = await response.json();
                    console.log('Error response data:', errorData);
                    
                    if (errorData && errorData.error) {
                        errorMessage = errorData.error;
                        
                        // Special handling for already registered error
                        if (errorMessage.includes('already registered') || 
                            response.status === 409) {
                            throw new Error('You are already registered for this tournament');
                        }
                    } else if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (jsonError) {
                    console.error('Error parsing error response:', jsonError);
                }
                
                throw new Error(`Failed to join tournament: ${errorMessage}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error joining tournament ${tournamentId}:`, error);
            throw error;
        }
    }

    public async getTournamentParticipants(tournamentId: number): Promise<TournamentParticipant[]> {
        try {
            const authService = AuthService.getInstance();
            const token = authService.getToken();
            const response = await fetch(`${API_URL}/tournaments/${tournamentId}/participants`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch tournament participants: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching participants for tournament ${tournamentId}:`, error);
            throw error;
        }
    }
} 