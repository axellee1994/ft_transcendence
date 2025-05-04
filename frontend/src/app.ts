import { Navigation } from './components/Navigation';
import { AuthService } from './services/auth';
import { setupRoutes } from './routes/routeDefinitions';
import { router } from './routes/index';
import './styles/auth.css';

document.addEventListener('DOMContentLoaded', async () => {
    
    const authService = AuthService.getInstance();
    
    const navContainer = document.createElement('div');
    document.body.insertBefore(navContainer, document.body.firstChild);

    new Navigation(navContainer);
    
    setupRoutes();
    
    router.handleLocation();
}); 