import { router } from './index.js';
import { renderHomePage } from '../pages/HomePage.js';
import { renderGamePage } from '../pages/GamePage.js';
import { renderTournamentPage } from '../pages/TournamentPage.js';
import { renderProfilePage } from '../pages/ProfilePage.js';
import { renderLeaderboardPage } from '../pages/LeaderboardPage.js';
import { renderSettingsPage } from '../pages/SettingsPage.js';
import { renderAboutPage } from '../pages/AboutPage.js';

// Define all application routes
export function setupRoutes() {
    // Home page route
    router.addRoute('/', () => {
        if (router.getContentElement()) {
            renderHomePage(router.getContentElement()!);
        }
    });

    // Game page route
    router.addRoute('/game', () => {
        if (router.getContentElement()) {
            renderGamePage(router.getContentElement()!);
            router.initBabylon();
        }
    });

    // Tournament page route
    router.addRoute('/tournament', () => {
        if (router.getContentElement()) {
            renderTournamentPage(router.getContentElement()!);
        }
    });

    // Profile page route
    router.addRoute('/profile', () => {
        if (router.getContentElement()) {
            renderProfilePage(router.getContentElement()!);
        }
    });

    // Leaderboard page route
    router.addRoute('/leaderboard', () => {
        if (router.getContentElement()) {
            renderLeaderboardPage(router.getContentElement()!);
        }
    });

    // Settings page route
    router.addRoute('/settings', () => {
        if (router.getContentElement()) {
            renderSettingsPage(router.getContentElement()!);
        }
    });

    // About page route
    router.addRoute('/about', () => {
        if (router.getContentElement()) {
            renderAboutPage(router.getContentElement()!);
        }
    });

    // 404 Not Found route
    router.addRoute('*', () => {
        const content = router.getContentElement();
        if (content) {
            content.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full">
                    <h1 class="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p class="text-gray-600">Page not found</p>
                    <button onclick="window.history.back()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                        Go Back
                    </button>
                </div>
            `;
        }
    });
} 