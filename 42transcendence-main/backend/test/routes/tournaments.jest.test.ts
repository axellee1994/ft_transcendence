import { FastifyInstance } from 'fastify';
import fastify from 'fastify';
import appPlugin from '../../src/app';
// Removed hashPW import as we won't create real users
import * as tournamentSvc from '../../src/service/tournamentSvc'; // Corrected path
jest.mock('../../src/service/tournamentSvc'); // Corrected path

// --- Test Setup ---

let app: FastifyInstance;
let token: string;
// We can use a fixed dummy user ID for JWT payload when mocking
const mockUserId = 1;
const mockUsername = 'mockUser';

// Helper remains the same
const getFutureDateISO = (daysToAdd: number = 1): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString();
};


beforeAll(async () => {
  // 1. Create a new Fastify instance for testing
  app = fastify(); // Use app directly

  // 2. Register the main application plugin (needed for routes & jwt)
  await app.register(appPlugin);

  // 3. Wait for Fastify to be ready
  await app.ready();

  // 4. Generate a dummy JWT Token using app.jwt.sign
  // The payload structure should match what your auth hook expects
  // We use mockUserId since we don't have a real DB user
  token = app.jwt.sign({ userId: mockUserId, username: mockUsername });

  // --- NO DATABASE SETUP NEEDED ---
});

afterAll(async () => {
  // No database cleanup needed
  await app.close();
});

// No database cleanup needed in beforeEach either
beforeEach(async () => {
  // Reset mocks before each test is crucial
  jest.clearAllMocks();

  // --- Configure Mock Return Values ---
  // Define default behavior for mocked service functions.
  // Tests can override these if needed using mockResolvedValueOnce etc.

  // Mocking createTournament
  (tournamentSvc.createTournament as jest.Mock).mockImplementation(async (app, userId, data) => {
    return {
      id: Date.now() % 1000, // Simulate generated ID
      organizer_id: userId,
      ...data,
      status: 'pending', // Default status
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  // Mocking getAllTournaments
  (tournamentSvc.getAllTournaments as jest.Mock).mockResolvedValue([
    { id: 101, name: 'Mock Tournament A', status: 'pending', start_date: getFutureDateISO(1), end_date: getFutureDateISO(2) },
    { id: 102, name: 'Mock Tournament B', status: 'ongoing', start_date: getFutureDateISO(-1), end_date: getFutureDateISO(1) },
  ]);

  // Mocking getTournamentWithDetails (used by GET /:id)
  (tournamentSvc.getTournamentById as jest.Mock).mockImplementation(async (app, id) => {
    const numericId = Number(id); // Ensure id is treated as a number
    if (numericId === 101 || numericId === 102 || numericId === 103 || numericId === (global as any).createdTournamentId) { // Use a globally tracked ID or known IDs
      return {
        id: numericId,
        name: `Mock Tournament ${numericId}`,
        description: 'Details fetched',
        status: 'pending',
        start_date: getFutureDateISO(1),
        end_date: getFutureDateISO(2),
        organizer_id: 99,
        participants: [ { id: mockUserId, username: mockUsername, display_name: 'Mock User', status: 'registered'} ], // Example participant
        games: [] // Example games
      };
    }
    return null; // Simulate not found
  });

  // Mocking registerParticipant
  (tournamentSvc.registerForTournament as jest.Mock).mockImplementation(async (app, tournamentId, userId) => {
     const numericTournamentId = Number(tournamentId);
     if (numericTournamentId === 999999) return { error: 'Tournament not found', status: 404 }; // Simulate tournament not found
     if ((global as any).simulateConflict) return { error: 'Already registered', status: 409 }; // Simulate conflict
     // Simulate tournament not open
     if ((global as any).simulateTournamentNotOpen) return { error: 'Tournament not open for registration', status: 400 };
    return { // Simulate success response structure expected by the route
        // The route might just need a success flag or specific message
        message: 'Successfully registered',
        // Including participant details might be helpful if the route returns them
        participant: {
            id: Date.now() % 1000, // Simulate participant ID
            tournament_id: numericTournamentId,
            user_id: userId,
            status: 'registered',
            joined_at: new Date().toISOString()
        }
    };
  });

    // Mocking unregisterParticipant
  (tournamentSvc.unregisterFromTournament as jest.Mock).mockImplementation(async (app, tournamentId, userId) => {
      const numericTournamentId = Number(tournamentId);
      if (numericTournamentId === 999999) return { error: 'Tournament not found', status: 404 }; // Simulate tournament not found
      // Simulate successful deletion (service might return void or count)
      // The route expects no error for a 204 response.
      return { changes: 1 }; // Or just return undefined/void if the route handles that
  });

  // Mocking getTournamentParticipants
  (tournamentSvc.getTournamentParticipantsById as jest.Mock).mockImplementation(async (app, tournamentId) => {
    const numericTournamentId = Number(tournamentId);
    if (numericTournamentId === 999999) return null; // Simulate tournament not found (service returns null)
    if (numericTournamentId === (global as any).tournamentWithNoParticipants) return []; // Simulate empty
    return [ // Simulate one participant
       { id: mockUserId, username: mockUsername, display_name: 'Mock User', status: 'registered' }
    ];
  });

    // Mocking updateTournament
  (tournamentSvc.updateTournament as jest.Mock).mockImplementation(async (app, tournamentId, data) => {
      const numericTournamentId = Number(tournamentId);
      if (numericTournamentId === 999999) return null; // Simulate not found
      return { // Return the updated mock data
          id: numericTournamentId,
          name: data.name ?? 'Updated Mock Name',
          description: data.description ?? 'Updated Desc',
          start_date: data.start_date ?? getFutureDateISO(3),
          end_date: data.end_date ?? getFutureDateISO(4),
          status: data.status ?? 'active',
          organizer_id: 99, // Keep organizer same
          created_at: new Date(Date.now() - 86400000).toISOString(), // Earlier date
          updated_at: new Date().toISOString(),
      };
  });

    // Mocking joinTournament (assuming it's used by POST /:id/join)
  (tournamentSvc.joinTournament as jest.Mock).mockImplementation(async (app, tournamentId, userId) => {
       const numericTournamentId = Number(tournamentId);
       if (numericTournamentId === 999999) return { error: 'Tournament not found', status: 404 };
       if ((global as any).simulateJoinConflict) return { error: 'Already in this tournament', status: 409 };
       // Return the participant object on successful join (route expects this)
       return {
           id: Date.now() % 1000,
           tournament_id: numericTournamentId,
           user_id: userId,
           status: 'joined', // Or 'registered'
           joined_at: new Date().toISOString()
       };
  });

});


// --- Test Suite ---

describe('Tournament Routes (/api/protected/tournaments)', () => {

  // --- POST / ---
  describe('POST /', () => {
    test('should create a new tournament successfully by calling service', async () => {
      const startDate = getFutureDateISO(1);
      const endDate = getFutureDateISO(2);
      const payload = {
        name: 'Jest Summer Championship',
        description: 'Annual summer tournament',
        start_date: startDate,
        end_date: endDate,
      };

      const mockCreatedId = 103;
      // Define specific return value for *this* test call
      (tournamentSvc.createTournament as jest.Mock).mockResolvedValueOnce({
          id: mockCreatedId,
          organizer_id: mockUserId,
          ...payload,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
      });


      const response = await app.inject({
        method: 'POST',
        url: '/api/protected/tournaments',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload,
      });

      expect(response.statusCode).toBe(201);
      // Verify service was called correctly
      expect(tournamentSvc.createTournament).toHaveBeenCalledTimes(1);
      expect(tournamentSvc.createTournament).toHaveBeenCalledWith(app, mockUserId, payload);

      // Verify response body matches mock
      const tournament = JSON.parse(response.payload);
      expect(tournament.id).toBe(mockCreatedId);
      expect(tournament.name).toBe(payload.name);
      (global as any).createdTournamentId = tournament.id; // Store globally if needed by other tests
    });

    // Test schema validation
    test('should return 400 if required fields are missing (schema validation)', async () => {
      const payload = { /* name missing */ description: 'Missing name', start_date: getFutureDateISO(1), end_date: getFutureDateISO(2) };
      const response = await app.inject({ method: 'POST', url: '/api/protected/tournaments', headers: { authorization: `Bearer ${token}` }, payload});
      expect(response.statusCode).toBe(400);
      // Service should NOT have been called due to schema validation failure
      expect(tournamentSvc.createTournament).not.toHaveBeenCalled();
      expect(JSON.parse(response.payload).message).toContain('name'); // Check Fastify error
    });


    test('should return 400 if service indicates start date after end date', async () => {
       const startDate = getFutureDateISO(2);
       const endDate = getFutureDateISO(1); // Invalid order
       const payload = { name: 'Invalid Date', description: '', start_date: startDate, end_date: endDate };

       // Mock the service to return a validation error for this specific call
       (tournamentSvc.createTournament as jest.Mock).mockResolvedValueOnce({
           error: 'Start date must be before end date', // The service should signal the error
           // status: 400 // The service indicates the desired HTTP status
           // OR the route handler checks the service response and sets the status
       });


      const response = await app.inject({
        method: 'POST',
        url: '/api/protected/tournaments',
        headers: { authorization: `Bearer ${token}` },
        payload,
      });

       // Assuming the route handler correctly interprets the service error and replies 400
      expect(response.statusCode).toBe(400);
      expect(tournamentSvc.createTournament).toHaveBeenCalledTimes(1); // Service was called
      expect(JSON.parse(response.payload).error).toContain('Start date must be before end date');
    });

     // Test for invalid date format (schema validation)
     test('should return 400 if date format is invalid (schema validation)', async () => {
         const payload = { name: 'Invalid Date Fmt', description: '', start_date: 'bad-date', end_date: 'worse-date' };
         const response = await app.inject({ method: 'POST', url: '/api/protected/tournaments', headers: { authorization: `Bearer ${token}` }, payload });
         expect(response.statusCode).toBe(400);
         // Service not called due to schema validation
         expect(tournamentSvc.createTournament).not.toHaveBeenCalled();
         expect(JSON.parse(response.payload).message).toMatch(/date/i); // Generic Fastify schema error
     });

    test('should return 401 if not authenticated', async () => {
        const payload = { name: 'Auth Test', description:'', start_date: getFutureDateISO(1), end_date: getFutureDateISO(2)};
        const response = await app.inject({ method: 'POST', url: '/api/protected/tournaments', payload }); // No auth header
        expect(response.statusCode).toBe(401);
        // Service not called
        expect(tournamentSvc.createTournament).not.toHaveBeenCalled();
     });
  });

  // --- GET / ---
  describe('GET /', () => {
    test('should return a list of tournaments from service', async () => {
      // Default mock from beforeEach provides the data
      const response = await app.inject({
        method: 'GET',
        url: '/api/protected/tournaments',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      // Verify service call
      expect(tournamentSvc.getAllTournaments).toHaveBeenCalledTimes(1);
      expect(tournamentSvc.getAllTournaments).toHaveBeenCalledWith(app);

      // Verify response matches mock
      const tournaments = JSON.parse(response.payload);
      expect(Array.isArray(tournaments)).toBe(true);
      expect(tournaments.length).toBe(2); // Based on mock in beforeEach
      expect(tournaments[0].id).toBe(101);
    });

     test('should return 401 if not authenticated', async () => {
         const response = await app.inject({ method: 'GET', url: '/api/protected/tournaments' }); // No auth
         expect(response.statusCode).toBe(401);
         expect(tournamentSvc.getAllTournaments).not.toHaveBeenCalled();
     });
  });

  // --- GET /:id ---
  describe('GET /:id', () => {
    const targetTournamentId = 101; // Use an ID known from mock setup

    test('should return a specific tournament with details from service', async () => {
       // Default mock from beforeEach handles this ID
      const response = await app.inject({
        method: 'GET',
        url: `/api/protected/tournaments/${targetTournamentId}`,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      // Verify service call
      expect(tournamentSvc.getTournamentById).toHaveBeenCalledTimes(1);
      expect(tournamentSvc.getTournamentById).toHaveBeenCalledWith(app, targetTournamentId);

      // Verify response matches mock
      const tournament = JSON.parse(response.payload);
      expect(tournament.id).toBe(targetTournamentId);
      expect(tournament).toHaveProperty('participants');
    });

    test('should return 404 if service returns null', async () => {
      const nonExistentId = 999999;
      // Mock configured in beforeEach to return null for this ID
      const response = await app.inject({
        method: 'GET',
        url: `/api/protected/tournaments/${nonExistentId}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(response.statusCode).toBe(404);
      // Verify service call
      expect(tournamentSvc.getTournamentById).toHaveBeenCalledTimes(1);
      expect(tournamentSvc.getTournamentById).toHaveBeenCalledWith(app, nonExistentId);
    });

     test('should return 401 if not authenticated', async () => {
        const response = await app.inject({ method: 'GET', url: `/api/protected/tournaments/${targetTournamentId}` }); // No auth
        expect(response.statusCode).toBe(401);
        expect(tournamentSvc.getTournamentById).not.toHaveBeenCalled();
     });
  });

  // --- Registration Endpoints ---
  describe('Registration (/api/protected/tournaments/:id/register)', () => {
     const targetTournamentId = 101; // Use a known ID

    test('POST /:id/register should call register service and return success', async () => {
        // Default mock from beforeEach handles success
        const response = await app.inject({
            method: 'POST',
            url: `/api/protected/tournaments/${targetTournamentId}/register`,
            headers: { authorization: `Bearer ${token}` },
        });
        // Check status and response based on route logic + mock service return
        expect(response.statusCode).toBe(201); // Assuming route replies 201 on success
        // Verify service call
        expect(tournamentSvc.registerForTournament).toHaveBeenCalledTimes(1);
        expect(tournamentSvc.registerForTournament).toHaveBeenCalledWith(app, targetTournamentId, mockUserId);
        // Verify response message from mock
        expect(JSON.parse(response.payload).message).toContain('Successfully registered');
    });

    test('POST /:id/register should return 409 if service indicates conflict', async () => {
        // Set flag for mock to simulate conflict
        (global as any).simulateConflict = true;

        const response = await app.inject({
            method: 'POST',
            url: `/api/protected/tournaments/${targetTournamentId}/register`,
            headers: { authorization: `Bearer ${token}` },
        });
        // Check status and error based on route logic + mock service return
        expect(response.statusCode).toBe(409);
        // Verify service call
        expect(tournamentSvc.registerForTournament).toHaveBeenCalledTimes(1);
        expect(JSON.parse(response.payload).error).toContain('Already registered');
        // Clean up flag
        delete (global as any).simulateConflict;
    });

    test('POST /:id/register should return 404 if service indicates tournament not found', async () => {
        const nonExistentId = 999999;
        // Mock configured in beforeEach for this ID
         const response = await app.inject({
             method: 'POST',
             url: `/api/protected/tournaments/${nonExistentId}/register`,
             headers: { authorization: `Bearer ${token}` },
         });
         expect(response.statusCode).toBe(404);
         // Verify service call
         expect(tournamentSvc.registerForTournament).toHaveBeenCalledTimes(1);
         expect(tournamentSvc.registerForTournament).toHaveBeenCalledWith(app, nonExistentId, mockUserId);
    });

    test('POST /:id/register should return 400 if service indicates tournament not open', async () => {
         // Set flag for mock to simulate not open
        (global as any).simulateTournamentNotOpen = true;
        // OR mock specifically for this test:
        // (tournamentSvc.registerForTournament as jest.Mock).mockResolvedValueOnce({
        //     error: 'Tournament not open for registration',
        //     status: 400
        // });

        const response = await app.inject({
            method: 'POST',
            url: `/api/protected/tournaments/${targetTournamentId}/register`,
            headers: { authorization: `Bearer ${token}` },
        });
        expect(response.statusCode).toBe(400);
        // Verify service call
        expect(tournamentSvc.registerForTournament).toHaveBeenCalledTimes(1);
        expect(JSON.parse(response.payload).error).toContain('not open for registration');
        // Clean up flag
        delete (global as any).simulateTournamentNotOpen;
    });


    test('DELETE /:id/register should call unregister service', async () => {
        // Default mock handles success
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/protected/tournaments/${targetTournamentId}/register`,
            headers: { authorization: `Bearer ${token}` },
        });
        expect(response.statusCode).toBe(204); // No Content on successful delete
        // Verify service call
        expect(tournamentSvc.unregisterFromTournament).toHaveBeenCalledTimes(1);
        expect(tournamentSvc.unregisterFromTournament).toHaveBeenCalledWith(app, targetTournamentId, mockUserId);
    });

    test('DELETE /:id/register should return 204 even if service indicates not registered (idempotent)', async () => {
         // Default mock in beforeEach returns { changes: 1 } which leads to 204 in the route
         // If service returned { changes: 0 } or undefined, route should still yield 204
         const response = await app.inject({
             method: 'DELETE',
             url: `/api/protected/tournaments/${targetTournamentId}/register`,
             headers: { authorization: `Bearer ${token}` },
         });
         expect(response.statusCode).toBe(204);
         // Verify service call
         expect(tournamentSvc.unregisterFromTournament).toHaveBeenCalledTimes(1);
    });

     test('DELETE /:id/register should return 404 if service indicates tournament not found', async () => {
        const nonExistentId = 999999;
        // Mock configured in beforeEach for this ID
         const response = await app.inject({
             method: 'DELETE',
             url: `/api/protected/tournaments/${nonExistentId}/register`,
             headers: { authorization: `Bearer ${token}` },
         });
         expect(response.statusCode).toBe(404);
         // Verify service call
          expect(tournamentSvc.unregisterFromTournament).toHaveBeenCalledTimes(1);
          expect(tournamentSvc.unregisterFromTournament).toHaveBeenCalledWith(app, nonExistentId, mockUserId);
    });
  });

  // --- GET /:id/participants ---
  describe('GET /:id/participants', () => {
      const targetTournamentId = 101; // Known ID

     test('should return list of participants from service', async () => {
         // Default mock returns one participant
        const response = await app.inject({
            method: 'GET',
            url: `/api/protected/tournaments/${targetTournamentId}/participants`,
            headers: { authorization: `Bearer ${token}` },
        });

        expect(response.statusCode).toBe(200);
        // Verify service call
        expect(tournamentSvc.getTournamentParticipantsById).toHaveBeenCalledTimes(1);
        expect(tournamentSvc.getTournamentParticipantsById).toHaveBeenCalledWith(app, targetTournamentId);

        // Verify response matches mock
        const participants = JSON.parse(response.payload);
        expect(Array.isArray(participants)).toBe(true);
        expect(participants.length).toBe(1);
        expect(participants[0].id).toBe(mockUserId);
     });

      test('should return empty list if service returns empty array', async () => {
          const noParticipantsTournamentId = 102; // Use another known ID
          // Set flag for mock
          (global as any).tournamentWithNoParticipants = noParticipantsTournamentId;

          const response = await app.inject({
              method: 'GET',
              url: `/api/protected/tournaments/${noParticipantsTournamentId}/participants`,
              headers: { authorization: `Bearer ${token}` },
          });

          expect(response.statusCode).toBe(200);
          // Verify service call
          expect(tournamentSvc.getTournamentParticipantsById).toHaveBeenCalledTimes(1);
          expect(tournamentSvc.getTournamentParticipantsById).toHaveBeenCalledWith(app, noParticipantsTournamentId);
          // Verify response is empty array
          expect(JSON.parse(response.payload)).toEqual([]);
          // Clean up flag
          delete (global as any).tournamentWithNoParticipants;
      });

     test('should return 404 if service returns null (tournament not found)', async () => {
        const nonExistentId = 999999;
        // Mock configured in beforeEach for this ID
         const response = await app.inject({
             method: 'GET',
             url: `/api/protected/tournaments/${nonExistentId}/participants`,
             headers: { authorization: `Bearer ${token}` },
         });
         expect(response.statusCode).toBe(404);
         // Verify service call
         expect(tournamentSvc.getTournamentParticipantsById).toHaveBeenCalledTimes(1);
         expect(tournamentSvc.getTournamentParticipantsById).toHaveBeenCalledWith(app, nonExistentId);
    });

     test('should return 401 if not authenticated', async () => {
         const response = await app.inject({ method: 'GET', url: `/api/protected/tournaments/${targetTournamentId}/participants` }); // No auth
         expect(response.statusCode).toBe(401);
         expect(tournamentSvc.getTournamentParticipantsById).not.toHaveBeenCalled();
     });
  });

  // --- PUT /:id ---
  describe('PUT /:id', () => {
      const targetTournamentId = 101; // Known ID

      test('should call update service and return updated tournament', async () => {
          const startDate = getFutureDateISO(3);
          const endDate = getFutureDateISO(4);
          const updatePayload = {
              name: 'After Update',
              description: 'Updated Desc',
              start_date: startDate,
              end_date: endDate,
              status: 'active'
          };
          // Default mock in beforeEach handles the update

          const response = await app.inject({
              method: 'PUT',
              url: `/api/protected/tournaments/${targetTournamentId}`,
              headers: { authorization: `Bearer ${token}` },
              payload: updatePayload
          });

          expect(response.statusCode).toBe(200);
          // Verify service call
          expect(tournamentSvc.updateTournament).toHaveBeenCalledTimes(1);
          expect(tournamentSvc.updateTournament).toHaveBeenCalledWith(app, targetTournamentId, updatePayload);

          // Verify response matches mock return
          const updatedTournament = JSON.parse(response.payload);
          expect(updatedTournament.id).toBe(targetTournamentId);
          expect(updatedTournament.name).toBe(updatePayload.name);
      });

      test('should return 404 if update service returns null', async () => {
          const nonExistentId = 999999;
          const updatePayload = { name: 'Update Nonexistent' };
          // Mock configured in beforeEach for this ID
           const response = await app.inject({
               method: 'PUT',
               url: `/api/protected/tournaments/${nonExistentId}`,
               headers: { authorization: `Bearer ${token}` },
               payload: updatePayload
           });
           expect(response.statusCode).toBe(404);
           // Verify service call
           expect(tournamentSvc.updateTournament).toHaveBeenCalledTimes(1);
           expect(tournamentSvc.updateTournament).toHaveBeenCalledWith(app, nonExistentId, updatePayload);
      });

       test('should return 401 if not authenticated', async () => {
           const updatePayload = { name: 'Update Auth Test' };
           const response = await app.inject({ method: 'PUT', url: `/api/protected/tournaments/${targetTournamentId}`, payload: updatePayload }); // No auth
           expect(response.statusCode).toBe(401);
           expect(tournamentSvc.updateTournament).not.toHaveBeenCalled();
       });

       // Test schema validation
       test('should return 400 on invalid update data (schema fail)', async () => {
           const invalidPayload = { name: 123 }; // Invalid type
           const response = await app.inject({ method: 'PUT', url: `/api/protected/tournaments/${targetTournamentId}`, headers: { authorization: `Bearer ${token}` }, payload: invalidPayload });
           expect(response.statusCode).toBe(400);
           // Service not called due to schema validation
           expect(tournamentSvc.updateTournament).not.toHaveBeenCalled();
       });
  });

  // --- POST /:id/join ---
  describe('POST /:id/join', () => {
       const targetTournamentId = 101; // Known ID

       test('should call join service and return participant', async () => {
           // Default mock handles success
           const response = await app.inject({
               method: 'POST',
               url: `/api/protected/tournaments/${targetTournamentId}/join`,
               headers: { authorization: `Bearer ${token}` }
           });

           // Check status based on route logic (assuming 200 for join)
           expect(response.statusCode).toBe(200);
           // Verify service call
           expect(tournamentSvc.joinTournament).toHaveBeenCalledTimes(1);
           expect(tournamentSvc.joinTournament).toHaveBeenCalledWith(app, targetTournamentId, mockUserId);

           // Verify response matches mock participant structure
           const participant = JSON.parse(response.payload);
           expect(participant).toHaveProperty('id');
           expect(participant.tournament_id).toBe(targetTournamentId);
           expect(participant.user_id).toBe(mockUserId);
       });

        test('should return 409 if join service indicates conflict', async () => {
            // Set flag for mock
            (global as any).simulateJoinConflict = true;

             const response = await app.inject({
                 method: 'POST',
                 url: `/api/protected/tournaments/${targetTournamentId}/join`,
                 headers: { authorization: `Bearer ${token}` }
             });

             expect(response.statusCode).toBe(409);
             // Verify service call
             expect(tournamentSvc.joinTournament).toHaveBeenCalledTimes(1);
             // Verify error message from mock
             expect(JSON.parse(response.payload).error).toContain('already in this tournament');
             // Clean up flag
             delete (global as any).simulateJoinConflict;
        });

       test('should return 404 if join service indicates tournament not found', async () => {
           const nonExistentId = 999999;
           // Mock configured in beforeEach for this ID
           const response = await app.inject({
               method: 'POST',
               url: `/api/protected/tournaments/${nonExistentId}/join`,
               headers: { authorization: `Bearer ${token}` }
           });
           expect(response.statusCode).toBe(404);
           // Verify service call
           expect(tournamentSvc.joinTournament).toHaveBeenCalledTimes(1);
           expect(tournamentSvc.joinTournament).toHaveBeenCalledWith(app, nonExistentId, mockUserId);
       });

        test('should return 401 if not authenticated', async () => {
            const response = await app.inject({ method: 'POST', url: `/api/protected/tournaments/${targetTournamentId}/join` }); // No auth
            expect(response.statusCode).toBe(401);
            expect(tournamentSvc.joinTournament).not.toHaveBeenCalled();
        });
  });

}); // End of main describe block