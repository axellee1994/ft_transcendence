import fetch from 'node-fetch';

async function createUser() {
  try {
    const response = await fetch('http://localhost:4002/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: `testuser_${Date.now()}`,
        display_name: 'Test User'
      })
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

createUser(); 