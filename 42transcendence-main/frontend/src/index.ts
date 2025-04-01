import './styles/input.css';
import { initRouter, registerRoute } from './router';
import { renderHomePage } from './pages/HomePage';
import { renderGamePage } from './pages/GamePage';
import { renderProfilePage } from './pages/ProfilePage';
import { renderStatsPage } from './pages/StatsPage';
import { renderSettingsPage } from './pages/SettingsPage';
import { renderFriendsPage } from './pages/FriendsPage';
import { renderFriendSearchPage } from './pages/FriendSearchPage';
import { renderTournamentPage } from './pages/TournamentPage';
import { Layout } from './components/Layout';
import './styles.css';

// IMPORTANT: We're using the routing system defined in src/router.ts
// The routing system in src/routes/routeDefinitions.ts is disabled
// If you need to add new routes, add them here using registerRoute()

// Browser compatibility check
function checkBrowserCompatibility() {
    const ua = navigator.userAgent;
    const isFirefox = ua.includes('Firefox');
    const isChrome = ua.includes('Chrome');
    
    if (!isFirefox && !isChrome) {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ffeb3b;
            color: black;
            text-align: center;
            padding: 10px;
            z-index: 9999;
        `;
        warning.textContent = 'For the best experience, please use Firefox or Chrome.';
        document.body.appendChild(warning);
    }
}

// Run compatibility check
checkBrowserCompatibility();

// Get the app container
const appContainer = document.getElementById('app');
if (!appContainer) {
    throw new Error('App container not found');
}

// Initialize layout
const layout = new Layout(appContainer);

// Register routes with layout wrapper
registerRoute('/', (container) => {
    renderHomePage(layout.getContentContainer());
});

registerRoute('/game', (container) => {
    renderGamePage(layout.getContentContainer());
});

registerRoute('/profile', (container) => {
    renderProfilePage(layout.getContentContainer());
}, true);

registerRoute('/profile/:id', (container) => {
    // Extract userId from pathname instead of hash
    const pathname = window.location.pathname;
    const userId = parseInt(pathname.split('/').pop() || '0');
    renderProfilePage(layout.getContentContainer(), userId);
}, true);

registerRoute('/stats', (container) => {
    renderStatsPage(layout.getContentContainer());
});

registerRoute('/settings', (container) => {
    renderSettingsPage(layout.getContentContainer());
}, true);

registerRoute('/friends', (container) => {
    renderFriendsPage(layout.getContentContainer());
}, true);

// Re-enabled friend search page as user needs to search for and add friends
registerRoute('/friends/search', (container) => {
    renderFriendSearchPage(layout.getContentContainer());
}, true);

// Register the tournament page route
registerRoute('/tournaments', (container) => {
    renderTournamentPage(layout.getContentContainer());
}, true);

// Initialize router
initRouter(layout.getContentContainer());
