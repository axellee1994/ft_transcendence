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
    
    const pathWithoutQuery = path.split('?')[0];
    const patternParts = pattern.split('/');
    const pathParts = pathWithoutQuery.split('/');
    
    if (patternParts.length !== pathParts.length) return false;
    
    return patternParts.every((part, i) => {
        if (part.startsWith(':')) return true;
        return part === pathParts[i];
    });
}

export function registerRoute(path: string, component: (container: HTMLElement) => void, requiresAuth: boolean = false) {
    routes.push({ path, component, requiresAuth });
}

export function initRouter(container: HTMLElement) {
    
    function handleRouteChange(path: string) {
        console.log('Handling route change for path:', path);
        
        const pathWithoutQuery = path.split('?')[0];
        
        let route = routes.find(r => r.path === pathWithoutQuery);
        
        if (!route) {
            route = routes.find(r => matchRoute(r.path, pathWithoutQuery));
        }
        
        if (route) {
            console.log('Route found, requiresAuth:', route.requiresAuth);
            console.log('Current authentication state:', authService.isAuthenticated());
            
            if (route.requiresAuth && !authService.isAuthenticated()) {

                console.log('Authentication required for route:', path);
                authService.showLoginDialog(() => {

                    console.log('Login successful, rendering protected route');
                    route!.component(container);
                });
                return;
            }
            route.component(container);
        } else {

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
        console.log('Navigating to:', path);
        history.pushState({ path }, '', path);
        handleRouteChange(path);
    }

    // Handle popstate events (back/forward navigation)
    window.addEventListener('popstate', (event) => {
        const path = event.state?.path || window.location.pathname;
        handleRouteChange(path);
    });

    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const closestLink = target.closest('a');
        
        if (closestLink && closestLink.getAttribute('href')?.startsWith('/') && !closestLink.hasAttribute('data-external')) {
            e.preventDefault();
            const path = closestLink.getAttribute('href') || '/';
            navigate(path);
        }
    });

    const currentPath = window.location.pathname || '/';
    handleRouteChange(currentPath);

    (window as any).navigate = navigate;
} 