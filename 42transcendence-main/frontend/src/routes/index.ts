import { BabylonScene } from '../components/BabylonScene.js';
import { renderHomePage } from '../pages/HomePage.js';
import { renderGamePage } from '../pages/GamePage.js';
import { renderTournamentPage } from '../pages/TournamentPage.js';
import { renderProfilePage } from '../pages/ProfilePage.js';
import { renderLeaderboardPage } from '../pages/LeaderboardPage.js';
import { renderSettingsPage } from '../pages/SettingsPage.js';
import { renderAboutPage } from '../pages/AboutPage.js';

// Router class definition
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

// Create and export the router instance
export const router = new Router(); 