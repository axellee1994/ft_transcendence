import { AuthService } from './services/auth';

type Route = {
    path: string;
    component: (container: HTMLElement) => void;
    requiresAuth?: boolean;
};

const routes: Route[] = [];
const authService = AuthService.getInstance();

// Helper function to check if a route pattern matches a path
function matchRoute(pattern: string, path: string): boolean {
    // Strip query parameters from path
    const pathWithoutQuery = path.split('?')[0];
    const patternParts = pattern.split('/');
    const pathParts = pathWithoutQuery.split('/');
    
    if (patternParts.length !== pathParts.length) return false;
    
    return patternParts.every((part, i) => {
        if (part.startsWith(':')) return true; // Dynamic segment
        return part === pathParts[i];
    });
}

export function registerRoute(path: string, component: (container: HTMLElement) => void, requiresAuth: boolean = false) {
    routes.push({ path, component, requiresAuth });
}

export function initRouter(container: HTMLElement) {
    // Function to handle route changes
    function handleRouteChange(path: string) {
        console.log('Handling route change for path:', path);
        
        // Strip query parameters for route matching
        const pathWithoutQuery = path.split('?')[0];
        
        // First try to find an exact match
        let route = routes.find(r => r.path === pathWithoutQuery);
        
        // If no exact match, try to find a dynamic route match
        if (!route) {
            route = routes.find(r => matchRoute(r.path, pathWithoutQuery));
        }
        
        if (route) {
            console.log('Route found, requiresAuth:', route.requiresAuth);
            console.log('Current authentication state:', authService.isAuthenticated());
            
            if (route.requiresAuth && !authService.isAuthenticated()) {
                // If not authenticated, show login dialog or redirect to login page
                console.log('Authentication required for route:', path);
                authService.showLoginDialog(() => {
                    // After successful login, render the route
                    console.log('Login successful, rendering protected route');
                    route!.component(container);
                });
                return;
            }
            route.component(container);
        } else {
            // If no match found, fallback to home
            console.log('No route match found, falling back to home');
            const homeRoute = routes.find(r => r.path === '/');
            if (homeRoute) {
                homeRoute.component(container);
                navigate('/');
            }
        }
    }

    // Navigation function using History API
    function navigate(path: string) {
        console.log('Navigating to:', path); // Debug log
        history.pushState({ path }, '', path);
        handleRouteChange(path);
    }

    // Handle popstate events (back/forward navigation)
    window.addEventListener('popstate', (event) => {
        const path = event.state?.path || window.location.pathname;
        handleRouteChange(path);
    });

    // Handle all link clicks to use the router
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const closestLink = target.closest('a');
        
        if (closestLink && closestLink.getAttribute('href')?.startsWith('/') && !closestLink.hasAttribute('data-external')) {
            e.preventDefault();
            const path = closestLink.getAttribute('href') || '/';
            navigate(path);
        }
    });

    // Handle initial route on page load
    const currentPath = window.location.pathname || '/';
    handleRouteChange(currentPath);

    // Add navigation method to window
    (window as any).navigate = navigate;
} 