import './styles/input.css';
import { initRouter, registerRoute } from './router';
import { renderHomePage } from './pages/HomePage';
import { renderGamePage } from './pages/GamePage';
import { renderProfilePage } from './pages/ProfilePage';
import { renderLeaderboardPage } from './pages/LeaderboardPage';
import { renderSettingsPage } from './pages/SettingsPage';
import { renderFriendsPage } from './pages/FriendsPage';
import { renderFriendSearchPage } from './pages/FriendSearchPage';
import { Layout } from './components/Layout';
import './styles.css';
import { UserProfile } from './components/UserProfile';

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

registerRoute('/leaderboard', (container) => {
    renderLeaderboardPage(layout.getContentContainer());
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

// Initialize router
initRouter(layout.getContentContainer());

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get the root container
    const root = document.getElementById('root');
    if (!root) {
        console.error('Root element not found');
        return;
    }

    // Initialize the user profile
    new UserProfile({ container: root });
});
