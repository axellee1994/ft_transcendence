import { FastifyInstance } from "fastify";
import SQLStatement from "../SQLStatement";
import ServerRequestError from "../error/ServerRequestError";
import BadRequestError from "../error/BadRequestError";

interface ITournament {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  participants?: any[];
  games?: any[];
}

interface IParticipant {
  id: number;
  tournament_id: number;
  user_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface IParticipantDetails {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  status: string;
}


export const getAllTournaments = async (fastify: FastifyInstance): Promise<ITournament[]> => {
  try {
    const tournaments = await fastify.db.all<ITournament[]>(SQLStatement.TOURNA_GET_ALL_TOURNA);
    return tournaments || [];
  } catch (err) {
    fastify.log.error(err, "Error fetching all tournaments");
    throw new ServerRequestError({ message: "Database error while fetching tournaments" });
  }
};

export const getTournamentById = async (fastify: FastifyInstance, id: number): Promise<ITournament | null> => {
  try {
    const tournament = await fastify.db.get<ITournament>(SQLStatement.TOURNA_GET_TOURNA_BY_ID, id);
    return tournament || null;
  } catch (err) {
    fastify.log.error(err, `Error fetching tournament by ID: ${id}`);
    throw new ServerRequestError({ message: "Database error while fetching tournament" });
  }
};

export const getTournamentParticipantsById = async (fastify: FastifyInstance, tournamentId: number): Promise<any[]> => {
  try {
    const participants = await fastify.db.all(SQLStatement.TOURNA_GET_PLAYER_IN_TOURNA_BY_ID, tournamentId);
    return participants || [];
  } catch (err) {
    fastify.log.error(err, `Error fetching participants for tournament ID: ${tournamentId}`);
    throw new ServerRequestError({ message: "Database error while fetching participants" });
  }
};

export const getTournamentGamesById = async (fastify: FastifyInstance, tournamentId: number): Promise<any[]> => {
  try {
    const games = await fastify.db.all(SQLStatement.TOURNA_GET_ALL_GAME_WITH_PLAYER, tournamentId);
    return games || [];
  } catch (err) {
    fastify.log.error(err, `Error fetching games for tournament ID: ${tournamentId}`);
    throw new ServerRequestError({ message: "Database error while fetching games" });
  }
};


export const createTournament = async (
  fastify: FastifyInstance,
  name: string,
  description: string | null,
  start_date: string,
  end_date: string,
): Promise<ITournament> => {
  const startDateObj = new Date(start_date);
  const endDateObj = new Date(end_date);
  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime()))
    throw new BadRequestError({ message: 'Invalid date format provided.' });
  if (startDateObj >= endDateObj)
    throw new BadRequestError({ message: 'Start date must be before end date.' });

  try {
    const status = 'pending';
    const result = await fastify.db.run(SQLStatement.TOURNA_INSERT_TOURNA,
      [name, description || '', start_date, end_date, status]);
    const tournamentId = result.lastID;
    if (!tournamentId)
      throw new ServerRequestError({ message: "Failed to get ID of created tournament" });
    const tournament = await getTournamentById(fastify, tournamentId);
    if (!tournament)
      throw new ServerRequestError({ message: "Failed to retrieve newly created tournament" });
    return tournament;
  } catch (err) {
    fastify.log.error(err, "Error creating tournament");
    if (err instanceof BadRequestError || err instanceof ServerRequestError)
        throw err;
    throw new ServerRequestError({ message: "Database error while creating tournament" });
  }
};

export const updateTournament = async (
  fastify: FastifyInstance,
  id: number,
  name: string,
  description: string,
  start_date: string,
  end_date: string,
  status: string
): Promise<ITournament> => {
  const startDateObj = new Date(start_date);
  const endDateObj = new Date(end_date);
  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime()))
    throw new BadRequestError({ message: 'Invalid date format provided.' });
  if (startDateObj >= endDateObj)
    throw new BadRequestError({ message: 'Start date must be before end date.' });
  try {
    const existingTournament = await getTournamentById(fastify, id);
    if (!existingTournament)
      throw new BadRequestError({ message: 'Tournament not found.' });

    await fastify.db.run(SQLStatement.TOURNA_UPDATE_TOURNA,
      [name, description, start_date, end_date, status, id]);
    const updatedTournament = await getTournamentById(fastify, id);
    if (!updatedTournament)
      throw new ServerRequestError({ message: "Failed to retrieve tournament after update" });
    return updatedTournament;
  } catch (err) {
    fastify.log.error(err, `Error updating tournament ID: ${id}`);
     if (err instanceof BadRequestError || err instanceof ServerRequestError)
        throw err;
    throw new ServerRequestError({ message: "Database error while updating tournament" });
  }
};

export const getParticipant = async (fastify: FastifyInstance, tournamentId: number, userId: number): Promise<IParticipant | null> => {
  try {
    const participant = await fastify.db.get<IParticipant>(SQLStatement.TOURNA_GET_PLAYER_FROM_PARTICIPANT, [tournamentId, userId]);
    return participant || null;
  } catch (err) {
    fastify.log.error(err, `Error fetching participant for tournament ${tournamentId}, user ${userId}`);
    throw new ServerRequestError({ message: "Database error while fetching participant" });
  }
};

export const registerForTournament = async (fastify: FastifyInstance, tournamentId: number, userId: number): Promise<IParticipant> => {
  try {
    const tournament = await getTournamentById(fastify, tournamentId);
    if (!tournament)
      throw new BadRequestError({ message: 'Tournament not found.' });
    if (tournament.status !== 'pending' && tournament.status !== 'open')
      throw new BadRequestError({ message: 'Tournament is not open for registration.' });
    const existingParticipant = await getParticipant(fastify, tournamentId, userId);
    if (existingParticipant)
      throw new BadRequestError({ message: 'Already registered for this tournament.' });
    const result = await fastify.db.run(SQLStatement.TOURNA_INSERT_PLAYER_FROM_PARTICIPANT, [tournamentId, userId, 'registered']);
    if (!result || !result.lastID)
        throw new ServerRequestError({ message: "Failed to register participant (no lastID)" });
    const participant = await getParticipant(fastify, tournamentId, userId); // Reuse getParticipant
    if (!participant)
        throw new ServerRequestError({ message: "Failed to retrieve newly registered participant" });
    return participant;

  } catch (err) {
    fastify.log.error(err, `Error registering user ${userId} for tournament ${tournamentId}`);
    if (err instanceof BadRequestError || err instanceof ServerRequestError) {
        throw err;
    }
    if ((err as any).code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || (err as any).code === 'SQLITE_CONSTRAINT_UNIQUE')
        throw new BadRequestError({ message: 'Already registered for this tournament (DB constraint).' });
    throw new ServerRequestError({ message: "Database error while registering for tournament" });
  }
};

export const unregisterFromTournament = async (fastify: FastifyInstance, tournamentId: number, userId: number): Promise<void> => {
    const tournament = await getTournamentById(fastify, tournamentId);
    if (!tournament)
        throw new BadRequestError({ message: 'Tournament not found.' });
  try {
    await fastify.db.run(SQLStatement.TOURNA_DELETE_PLAYER_FROM_PARTICIPANT, [tournamentId, userId]);
  } catch (err) {
    fastify.log.error(err, `Error unregistering user ${userId} from tournament ${tournamentId}`);
     if (err instanceof BadRequestError || err instanceof ServerRequestError)
        throw err;
    throw new ServerRequestError({ message: "Database error while unregistering from tournament" });
  }
};

export const getParticipantById = async (fastify: FastifyInstance, tournamentId: number, userId: number): Promise<IParticipant | null> => {
  try {
    const participant = await fastify.db.get<IParticipant>(SQLStatement.TOURNA_GET_PARTICIPANT_BY_ID, [tournamentId, userId]);
    return participant || null;
  } catch (err) {
    fastify.log.error(err, `Error fetching participant by ID for tournament ${tournamentId}, user ${userId}`);
    throw new ServerRequestError({ message: "Database error while fetching participant by ID" });
  }
};

export const joinTournament = async (fastify: FastifyInstance, tournamentId: number, userId: number): Promise<IParticipant> => {
  try {
     const tournament = await getTournamentById(fastify, tournamentId);
     if (!tournament)
       throw new BadRequestError({ message: 'Tournament not found.' });
     const existingParticipant = await getParticipantById(fastify, tournamentId, userId);
     if (existingParticipant)
       throw new BadRequestError({ message: 'Already joined this tournament.' });
    const result = await fastify.db.run(SQLStatement.TOURNA_INSERT_PARTICIPANT_INTO_TOURNA, [tournamentId, userId]);
    if (!result || !result.lastID)
      throw new ServerRequestError({ message: "Failed to insert tournament participant record (no lastID)" });
    const participant = await getParticipantById(fastify, tournamentId, userId);
    if (!participant)
      throw new ServerRequestError({ message: "Failed to retrieve newly created participant record after join" });
    return participant;
  } catch (err) {
    fastify.log.error(err, `Error joining tournament ${tournamentId} for user ${userId}`);
    if (err instanceof BadRequestError || err instanceof ServerRequestError) {
        throw err;
    }
    if ((err as any).code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || (err as any).code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new BadRequestError({ message: 'Already joined this tournament (DB constraint).' });
    }
    throw new ServerRequestError({ message: "Database error while joining tournament" });
  }
};


export const getAllParticipantsDetails = async (fastify: FastifyInstance, tournamentId: number): Promise<IParticipantDetails[]> => {
  try {
    const participants = await fastify.db.all<IParticipantDetails[]>(SQLStatement.TOURNA_GET_ALL_PLAYERS_IN_TOURNA, tournamentId);
    return participants || [];
  } catch (err) {
    fastify.log.error(err, `Error fetching all participant details for tournament ${tournamentId}`);
    throw new ServerRequestError({ message: "Database error while fetching participant details" });
  }
};