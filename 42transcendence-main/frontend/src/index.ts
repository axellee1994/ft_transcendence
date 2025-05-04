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

// Browser compatibility check
function checkBrowserCompatibility() {
    const ua = navigator.userAgent;
    const isFirefox = ua.includes('Firefox');
    const isChrome = ua.includes('Chrome');
    
    if (!isFirefox && !isChrome) {
        const warning = document.createElement('div');
        warning.className = "fixed top-0 left-0 right-0 bg-yellow-300 text-black text-center p-2.5 z-[9999]";
        warning.textContent = 'For the best experience, please use Firefox or Chrome.';
        document.body.appendChild(warning);
    }
}

checkBrowserCompatibility();

const appContainer = document.getElementById('app');
if (!appContainer) {
    throw new Error('App container not found');
}

const layout = new Layout(appContainer);

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


registerRoute('/friends/search', (container) => {
    renderFriendSearchPage(layout.getContentContainer());
}, true);

registerRoute('/tournaments', (container) => {
    renderTournamentPage(layout.getContentContainer());
}, true);

registerRoute('/tournaments/:id', (container) => {
    renderTournamentPage(layout.getContentContainer()); 
}, true);

initRouter(layout.getContentContainer());
