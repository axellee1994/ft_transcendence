const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the tests directory
app.use('/tests', express.static(path.join(__dirname, '../tests')));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Handle client-side routing by redirecting all requests to index.html
// except for requests to /tests
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/tests')) {
    next();
  } else {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  }
});

app.listen(port, () => {
  console.log(`Frontend server running at http://localhost:${port}`);
  console.log(`Test files available at http://localhost:${port}/tests`);
}); 