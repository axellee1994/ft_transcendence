const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api';

async function testAPI() {
  try {
    console.log('Testing API endpoints...');
    
    // Test health endpoint
    console.log('\n--- Testing health endpoint ---');
    const healthResponse = await fetch('http://localhost:3001/health');
    console.log('Status:', healthResponse.status);
    console.log('Response:', await healthResponse.json());
    
    // Test API root
    console.log('\n--- Testing API root ---');
    const apiRootResponse = await fetch(API_URL);
    console.log('Status:', apiRootResponse.status);
    console.log('Response:', await apiRootResponse.json());
    
    // Test users endpoint
    console.log('\n--- Testing users endpoint ---');
    const usersResponse = await fetch(`${API_URL}/users`);
    console.log('Status:', usersResponse.status);
    console.log('Response:', await usersResponse.json());
    
    // Test creating a user
    console.log('\n--- Testing user creation ---');
    const createUserResponse = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `testuser_${Date.now()}`,
        display_name: 'Test User'
      })
    });
    console.log('Status:', createUserResponse.status);
    const newUser = await createUserResponse.json();
    console.log('Response:', newUser);
    
    // Test getting a specific user
    console.log('\n--- Testing get user by ID ---');
    const getUserResponse = await fetch(`${API_URL}/users/${newUser.id}`);
    console.log('Status:', getUserResponse.status);
    console.log('Response:', await getUserResponse.json());
    
    // Test creating a second user
    console.log('\n--- Testing second user creation ---');
    const createUser2Response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `player2_${Date.now()}`,
        display_name: 'Player Two'
      })
    });
    console.log('Status:', createUser2Response.status);
    const secondUser = await createUser2Response.json();
    console.log('Response:', secondUser);
    
    // Test creating a game
    console.log('\n--- Testing game creation ---');
    const createGameResponse = await fetch(`${API_URL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player1_id: newUser.id,
        player2_id: secondUser.id
      })
    });
    console.log('Status:', createGameResponse.status);
    const newGame = await createGameResponse.json();
    console.log('Response:', newGame);
    
    // Test updating a game
    console.log('\n--- Testing game update ---');
    const updateGameResponse = await fetch(`${API_URL}/games/${newGame.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player1_score: 10,
        player2_score: 5,
        status: 'completed'
      })
    });
    console.log('Status:', updateGameResponse.status);
    console.log('Response:', await updateGameResponse.json());
    
    // Test creating a tournament
    console.log('\n--- Testing tournament creation ---');
    const createTournamentResponse = await fetch(`${API_URL}/tournaments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Tournament ${Date.now()}`,
        description: 'Test tournament',
        start_date: '2025-04-01',
        end_date: '2025-04-02'
      })
    });
    console.log('Status:', createTournamentResponse.status);
    const newTournament = await createTournamentResponse.json();
    console.log('Response:', newTournament);
    
    // Test registering a user for a tournament
    console.log('\n--- Testing tournament registration ---');
    const registerTournamentResponse = await fetch(`${API_URL}/tournaments/${newTournament.id}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: newUser.id
      })
    });
    console.log('Status:', registerTournamentResponse.status);
    console.log('Response:', await registerTournamentResponse.json());
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error during API testing:', error);
  }
}

// Export the test function
module.exports = {
  testAPI
};

// Run the test if this file is executed directly
if (require.main === module) {
  testAPI();
} 