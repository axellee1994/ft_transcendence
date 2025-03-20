import { Navigation } from './components/Navigation';
import './styles/auth.css';

document.addEventListener('DOMContentLoaded', () => {
    // Create a container for the navigation
    const navContainer = document.createElement('div');
    document.body.insertBefore(navContainer, document.body.firstChild);

    // Initialize navigation
    new Navigation(navContainer);
}); 