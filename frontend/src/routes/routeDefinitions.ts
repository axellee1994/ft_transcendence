import { router } from './index.js';
import { renderHomePage } from '../pages/HomePage.js';
import { renderGamePage } from '../pages/GamePage.js';
import { renderTournamentPage } from '../pages/TournamentPage.js';
import { renderProfilePage } from '../pages/ProfilePage.js';
import { renderStatsPage } from '../pages/StatsPage.js';
import { renderSettingsPage } from '../pages/SettingsPage.js';

// Define all application routes
export function setupRoutes() {

    router.addRoute('/', () => {
        if (router.getContentElement()) {
            renderHomePage(router.getContentElement()!);
        }
    });


    router.addRoute('/game', () => {
        if (router.getContentElement()) {

            const urlParams = new URLSearchParams(window.location.search);
            const gameId = urlParams.get('id');
            const mode = urlParams.get('mode') || 'single';
            const tournamentMatchId = urlParams.get('tournament_match');

            (window as any).gameMode = mode;
            renderGamePage(router.getContentElement()!);
            router.initBabylon();
        }
    });


    router.addRoute('/tournament', () => {
        if (router.getContentElement()) {
            renderTournamentPage(router.getContentElement()!);
        }
    });


    router.addRoute('/profile', () => {
        if (router.getContentElement()) {
            renderProfilePage(router.getContentElement()!);
        }
    });


    router.addRoute('/stats', () => {
        if (router.getContentElement()) {
            renderStatsPage(router.getContentElement()!);
        }
    });


    router.addRoute('/settings', () => {
        if (router.getContentElement()) {
            renderSettingsPage(router.getContentElement()!);
        }
    });


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