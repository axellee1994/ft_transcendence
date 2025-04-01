import { router } from './routes/index.js';
import { setupRoutes } from './routes/routeDefinitions.js';

// Set up all routes
setupRoutes();

// Export router for use in navigation components
export const appRouter = router;

// Initial route handling
document.addEventListener('DOMContentLoaded', () => {
    router.handleLocation();
}); 