import { BabylonScene } from './components/BabylonScene.js';
import { renderHomePage } from './pages/HomePage.js';
import { renderGamePage } from './pages/GamePage.js';
import { renderTournamentPage } from './pages/TournamentPage.js';
import { renderProfilePage } from './pages/ProfilePage.js';
import { renderLeaderboardPage } from './pages/LeaderboardPage.js';
import { renderSettingsPage } from './pages/SettingsPage.js';
import { renderAboutPage } from './pages/AboutPage.js';

// Simple router implementation
class Router {
    private routes: Map<string, () => void>;
    private root: string;
    private babylonScene: BabylonScene | null = null;
    private contentElement: HTMLElement | null = null;

    constructor(root: string = '') {
        this.routes = new Map();
        this.root = root;
        this.handleLocation = this.handleLocation.bind(this);
        window.addEventListener('popstate', this.handleLocation);
        
        // Get the content element where pages will be rendered
        this.contentElement = document.getElementById('content');
        if (!this.contentElement) {
            console.error("Content element not found");
        }
    }

    addRoute(path: string, callback: () => void): void {
        this.routes.set(path, callback);
    }

    navigate(path: string): void {
        window.history.pushState({}, '', this.root + path);
        this.handleLocation();
    }

    handleLocation(): void {
        const path = window.location.pathname.replace(this.root, '') || '/';
        const callback = this.routes.get(path) || this.routes.get('*');
        callback?.();
    }

    initBabylon(): void {
        if (!this.babylonScene) {
            console.log("Initializing Babylon.js scene...");
            try {
                this.babylonScene = new BabylonScene('renderCanvas');
                console.log("Babylon.js scene initialized successfully");
            } catch (error) {
                console.error("Failed to initialize Babylon.js scene:", error);
            }
        }
    }
    
    getContentElement(): HTMLElement | null {
        return this.contentElement;
    }
}

// Initialize router
const router = new Router();

// Define routes
router.addRoute('/', () => {
    if (router.getContentElement()) {
        renderHomePage(router.getContentElement()!);
    }
});

router.addRoute('/game', () => {
    if (router.getContentElement()) {
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

router.addRoute('/leaderboard', () => {
    if (router.getContentElement()) {
        renderLeaderboardPage(router.getContentElement()!);
    }
});

router.addRoute('/settings', () => {
    if (router.getContentElement()) {
        renderSettingsPage(router.getContentElement()!);
    }
});

router.addRoute('/about', () => {
    if (router.getContentElement()) {
        renderAboutPage(router.getContentElement()!);
    }
});

// Handle 404
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

// Export router for use in navigation components
export const appRouter = router;

// Initial route handling
document.addEventListener('DOMContentLoaded', () => {
    router.handleLocation();
}); 