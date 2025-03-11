// Simple router implementation
class Router {
    private routes: Map<string, () => void>;
    private root: string;

    constructor(root: string = '') {
        this.routes = new Map();
        this.root = root;
        this.handleLocation = this.handleLocation.bind(this);
        window.addEventListener('popstate', this.handleLocation);
    }

    addRoute(path: string, callback: () => void): void {
        this.routes.set(path, callback);
    }

    navigate(path: string): void {
        window.history.pushState({}, '', this.root + path);
        this.handleLocation();
    }

    handleLocation(): void {
        const path = window.location.pathname.replace(this.root, '');
        const callback = this.routes.get(path) || this.routes.get('*');
        callback?.();
    }
}

// Initialize router
const router = new Router();

// Define routes
router.addRoute('/', () => {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = `
            <div class="text-center">
                <h1 class="text-4xl font-bold text-gray-900 mb-4">42 Transcendence</h1>
                <p class="text-gray-600">Welcome to the application!</p>
            </div>
        `;
    }
});

// Handle 404
router.addRoute('*', () => {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = `
            <div class="text-center">
                <h1 class="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p class="text-gray-600">Page not found</p>
            </div>
        `;
    }
});

// Initial route handling
document.addEventListener('DOMContentLoaded', () => {
    router.handleLocation();
}); 