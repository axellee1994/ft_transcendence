import { router } from './routes/index.js';
import { setupRoutes } from './routes/routeDefinitions.js';

setupRoutes();

export const appRouter = router;

document.addEventListener('DOMContentLoaded', () => {
    router.handleLocation();
}); 