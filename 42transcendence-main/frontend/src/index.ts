import './styles/input.css';
import { initRouter, registerRoute } from './router';
import { renderHomePage } from './pages/HomePage';
import { renderGamePage } from './pages/GamePage';

// Get the app container
const appContainer = document.getElementById('app')!;

// Register routes
registerRoute('/', renderHomePage);
registerRoute('/game/single', (container) => renderGamePage(container, 'single'));
registerRoute('/game/multi', (container) => renderGamePage(container, 'multi'));

// Initialize router
initRouter(appContainer);
