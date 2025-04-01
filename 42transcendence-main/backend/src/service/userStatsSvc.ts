import { Database } from 'sqlite';
// import { FastifyInstance } from 'fastify'; // Removed unused import
import ServerRequestError from '../error/ServerRequestError';
// import BadRequestError from '../error/BadRequestError'; // Removed unused import
import SQLStatement from '../SQLStatement';

// Define a type for the stats object for better type safety
interface UserStats {
    user_id: number;
    games_played: number;
    games_won: number;
    highest_score: number;
    fastest_win_seconds: number | null;
    longest_game_seconds: number | null;
    created_at: string;
    updated_at: string;
    win_rate?: number; // Added for calculated value
}

interface UserStatsUpdatePayload {
    games_played?: number;
    games_won?: number;
    highest_score?: number;
    fastest_win_seconds?: number | null;
    longest_game_seconds?: number | null;
}


/**
 * Fetches or creates user stats.
 * Calculates win rate.
 * @param db - Database instance
 * @param userId - The ID of the user
 * @returns User stats object with win rate
 */
export const getUserStats = async (db: Database, userId: number): Promise<UserStats> => {
    try {
        let stats: UserStats | undefined = await db.get<UserStats>(
            SQLStatement.STATS_GET_BY_USER_ID, 
            userId
        );

        if (!stats) {
            // If no stats exist, create a new record with defaults
            await db.run(SQLStatement.STATS_CREATE_INITIAL, userId);
            // Fetch the newly created stats record
            stats = await db.get<UserStats>(SQLStatement.STATS_GET_BY_USER_ID, userId);
            if (!stats) {
                // This should not happen if the insert was successful
                throw new Error('Failed to create or fetch user stats after creation.');
            }
        }

        // Calculate win rate, handle division by zero
        const win_rate = stats.games_played > 0 ? (stats.games_won / stats.games_played) * 100 : 0;

        return {
            ...stats,
            win_rate: parseFloat(win_rate.toFixed(2)) // Format to 2 decimal places
        };

    } catch (err) {
        // console.error("Database error fetching stats:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new ServerRequestError({ message: `Database error fetching stats for user ${userId}: ${errorMessage}` });
    }
};

/**
 * Updates user stats based on the provided payload. Creates if not exists.
 * Calculates win rate on the updated stats.
 * @param db - Database instance
 * @param userId - The ID of the user to update
 * @param updates - The partial stats data to update
 * @returns Updated user stats object with win rate
 */
export const updateUserStats = async (db: Database, userId: number, updates: UserStatsUpdatePayload): Promise<UserStats> => {
     try {
        // Ensure stats record exists, creating if necessary
        // We can reuse getUserStats which handles creation
        const currentStats = await getUserStats(db, userId);

        // Calculate new values by adding updates to current values
        const newGamesPlayed = (currentStats.games_played || 0) + (updates.games_played || 0);
        const newGamesWon = (currentStats.games_won || 0) + (updates.games_won || 0);
        // For other fields, decide whether to increment or overwrite
        // Example: Overwrite highest_score if the new one is higher
        const newHighestScore = updates.highest_score !== undefined && updates.highest_score > (currentStats.highest_score || 0) 
                                ? updates.highest_score 
                                : currentStats.highest_score;
        // Example: Overwrite fastest_win if the new one is faster
        const newFastestWin = updates.fastest_win_seconds !== undefined && 
                                updates.fastest_win_seconds !== null &&
                                (currentStats.fastest_win_seconds === null || updates.fastest_win_seconds < currentStats.fastest_win_seconds)
                                ? updates.fastest_win_seconds
                                : currentStats.fastest_win_seconds;
        // Example: Overwrite longest_game if the new one is longer
        const newLongestGame = updates.longest_game_seconds !== undefined && 
                                 updates.longest_game_seconds !== null &&
                                 (currentStats.longest_game_seconds === null || updates.longest_game_seconds > currentStats.longest_game_seconds)
                                ? updates.longest_game_seconds
                                : currentStats.longest_game_seconds;

        // Update the record with the new calculated values
        await db.run(
            SQLStatement.STATS_UPDATE_BY_USER_ID,
            [
            newGamesPlayed,
            newGamesWon,
            newHighestScore,
            newFastestWin,
            newLongestGame,
            userId
        ]);
        
        // Fetch and return updated stats using getUserStats to get win_rate etc.
        const updatedStats = await getUserStats(db, userId);
        return updatedStats;

    } catch (err) {
        // Log the original error if possible
        // console.error("Error in updateUserStats:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new ServerRequestError({ message: `Database error updating stats for user ${userId}: ${errorMessage}` });
    }
}; 