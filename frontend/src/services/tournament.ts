import { API_URL, AuthService } from './auth';

export interface Tournament {
    id: number;
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    status: 'pending' | 'active' | 'completed' | 'full';
    winner_id?: number;
    created_at: string;
    updated_at: string;
    max_players: number;
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

export interface TournamentMatches {
    id: number;
    tournament_id: number;
    player1_id: number;
    player2_id: number;
    player1_score: number;
    player2_score: number;
    winner_id: number;
    game_id: number;
    round: number;
    match_order: number;
}


const protectedURL = `${API_URL}/protected`;

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
            const response = await fetch(`${protectedURL}/tournaments`, {
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
            const response = await fetch(`${protectedURL}/tournaments/${id}`, {
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
        max_players: number;
    }): Promise<Tournament> {
        try {
            const authService = AuthService.getInstance();
            const token = authService.getToken();
            console.log('Creating tournament with data:', data);
            
            const response = await fetch(`${protectedURL}/tournaments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {

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
            
            const response = await fetch(`${protectedURL}/tournaments/${tournamentId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({}),
            });

            if (!response.ok) {

                let errorMessage = response.statusText;
                try {
                    const errorData = await response.json();
                    console.log('Error response data:', errorData);
                    
                    if (errorData && errorData.error) {
                        errorMessage = errorData.error;
                        
                        if (errorMessage.includes('already registered') || 
                            response.status === 409) {
                            throw new Error('You are already registered for this tournament');
                        }

                        if (errorMessage.includes('max players') || 
                            response.status === 409) {
                            throw new Error('Max players for this tournament reached');
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

    //getTournamentMatches
    public async getTournamentMatches(tournamentId: number): Promise<TournamentMatches[]> {
        try {
            const authService = AuthService.getInstance();
            const token = authService.getToken();
            const response = await fetch(`${protectedURL}/tournaments/${tournamentId}/matches`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch tournament matches: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching matches for tournament ${tournamentId}:`, error);
            throw error;
        }
    }

    //start tournament
    public async startTournament(tournamentId: number): Promise<TournamentParticipant> {
        try {
            const authService = AuthService.getInstance();
            const token = authService.getToken();
            console.log(`Attempting to start tournament ${tournamentId}`);
            
            const response = await fetch(`${protectedURL}/tournaments/${tournamentId}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({}),
            });

            if (!response.ok) {

                let errorMessage = response.statusText;
                try {
                    const errorData = await response.json();
                    console.log('Error response data:', errorData);
                    
                    if (errorData && errorData.error) {
                        errorMessage = errorData.error;
                        
                    } else if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (jsonError) {
                    console.error('Error parsing error response:', jsonError);
                }
                throw new Error(`Failed to start tournament: ${errorMessage}`);
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    public async getTournamentParticipants(tournamentId: number): Promise<TournamentParticipant[]> {
        try {
            const authService = AuthService.getInstance();
            const token = authService.getToken();
            const response = await fetch(`${protectedURL}/tournaments/${tournamentId}/participants`, {
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