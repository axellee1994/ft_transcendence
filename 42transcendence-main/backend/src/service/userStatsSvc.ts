import { Database } from 'sqlite';
import ServerRequestError from '../error/ServerRequestError';
import SQLStatement from '../SQLStatement';
import { IUserStats, IUserStatsUpdatePayload } from '../model/userStatModel';


export const getUserStats = async (db: Database, userId: number): Promise<IUserStats> => {
    try {
        let stats: IUserStats | undefined = await db.get<IUserStats>(
            SQLStatement.STATS_GET_BY_USER_ID, 
            userId
        );

        if (!stats) {
            await db.run(SQLStatement.STATS_CREATE_INITIAL, userId);
            stats = await db.get<IUserStats>(SQLStatement.STATS_GET_BY_USER_ID, userId);
            if (!stats) {
                throw new Error('Failed to create or fetch user stats after creation.');
            }
        }

        const win_rate = stats.games_played > 0 ? (stats.games_won / stats.games_played) * 100 : 0;

        return {
            ...stats,
            win_rate: parseFloat(win_rate.toFixed(2))
        };

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new ServerRequestError({ message: `Database error fetching stats for user ${userId}: ${errorMessage}` });
    }
};

export const updateUserStats = async (db: Database, userId: number, updates: IUserStatsUpdatePayload): Promise<IUserStats> => {
     try {

        const currentStats = await getUserStats(db, userId);

        const newGamesPlayed = (currentStats.games_played || 0) + (updates.games_played || 0);
        const newGamesWon = (currentStats.games_won || 0) + (updates.games_won || 0);
        const newHighestScore = updates.highest_score !== undefined && updates.highest_score > (currentStats.highest_score || 0) 
                                ? updates.highest_score 
                                : currentStats.highest_score;
        const newFastestWin = updates.fastest_win_seconds !== undefined && 
                                updates.fastest_win_seconds !== null &&
                                (currentStats.fastest_win_seconds === null || updates.fastest_win_seconds < currentStats.fastest_win_seconds)
                                ? updates.fastest_win_seconds
                                : currentStats.fastest_win_seconds;
        const newLongestGame = updates.longest_game_seconds !== undefined && 
                                 updates.longest_game_seconds !== null &&
                                 (currentStats.longest_game_seconds === null || updates.longest_game_seconds > currentStats.longest_game_seconds)
                                ? updates.longest_game_seconds
                                : currentStats.longest_game_seconds;

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
        
        const updatedStats = await getUserStats(db, userId);
        return updatedStats;

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new ServerRequestError({ message: `Database error updating stats for user ${userId}: ${errorMessage}` });
    }
}; 