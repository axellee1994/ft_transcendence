// Simple test script to check if the health endpoint is accessible
import { request } from 'http';

const options = {
  hostname: 'localhost',
  port: 4002,
  path: '/health',
  method: 'GET'
};

const req = request(options, res => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    console.log('Health check completed successfully!');
  });
});

req.on('error', error => {
  console.error('Error during health check:', error);
});

console.log('Testing health endpoint...');
req.end(); 