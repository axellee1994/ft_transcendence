// This is a simple JavaScript file to help debug TypeScript loading
console.log('app.js loaded directly');

// Set a flag to indicate this file loaded
window.appJsLoaded = true;

// Add a visual indicator
document.addEventListener('DOMContentLoaded', function() {
  const indicator = document.createElement('div');
  indicator.style.position = 'fixed';
  indicator.style.top = '40px';
  indicator.style.right = '10px';
  indicator.style.backgroundColor = 'blue';
  indicator.style.color = 'white';
  indicator.style.padding = '10px';
  indicator.style.zIndex = '10000';
  indicator.textContent = 'app.js Loaded';
  document.body.appendChild(indicator);

  // Update the debug info
  const debugInfo = document.getElementById('debug-info');
  if (debugInfo) {
    debugInfo.textContent += ' - app.js loaded';
  }
}); 