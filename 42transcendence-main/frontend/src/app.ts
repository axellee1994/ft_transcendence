import { Navigation } from './components/Navigation';
import { AuthService } from './services/auth';
import { setupRoutes } from './routes/routeDefinitions';
import { router } from './routes/index';
import './styles/auth.css';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize auth service first to validate token
    const authService = AuthService.getInstance();
    
    // Create a container for the navigation
    const navContainer = document.createElement('div');
    document.body.insertBefore(navContainer, document.body.firstChild);

    // Initialize navigation
    new Navigation(navContainer);
    
    // Setup routes
    setupRoutes();
    
    // Handle initial route after auth validation
    router.handleLocation();
}); 