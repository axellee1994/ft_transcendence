export interface IUserStats {
    user_id: number;
    games_played: number;
    games_won: number;
    highest_score: number;
    fastest_win_seconds: number | null;
    longest_game_seconds: number | null;
    created_at: string;
    updated_at: string;
    win_rate?: number;
}

export interface IUserStatsUpdatePayload {
    games_played?: number;
    games_won?: number;
    highest_score?: number;
    fastest_win_seconds?: number | null;
    longest_game_seconds?: number | null;
}