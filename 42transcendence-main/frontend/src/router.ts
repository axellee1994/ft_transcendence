import { AuthService } from './services/auth';

type Route = {
    path: string;
    component: (container: HTMLElement) => void;
    requiresAuth?: boolean;
};

const routes: Route[] = [];
const authService = AuthService.getInstance();

export function registerRoute(path: string, component: (container: HTMLElement) => void, requiresAuth: boolean = false) {
    routes.push({ path, component, requiresAuth });
}

export function initRouter(container: HTMLElement) {
    // Function to handle route changes
    function handleRouteChange(path: string) {
        const route = routes.find(r => r.path === path);
        
        if (route) {
            if (route.requiresAuth && !authService.isAuthenticated()) {
                // If not authenticated, show login dialog or redirect to login page
                authService.showLoginDialog(() => {
                    // After successful login, render the route
                    route.component(container);
                });
                return;
            }
            route.component(container);
        } else {
            // If path doesn't match any route, check if it's a sub-route
            const segmentEnd = path.indexOf('/', 1);
            const basePath = segmentEnd > 0 ? path.substring(0, segmentEnd) : path;
            const baseRoute = routes.find(r => r.path === basePath);
            
            // If we found a base route, render it
            if (baseRoute) {
                if (baseRoute.requiresAuth && !authService.isAuthenticated()) {
                    authService.showLoginDialog(() => {
                        baseRoute.component(container);
                    });
                    return;
                }
                baseRoute.component(container);
            } else {
                // Fallback to home if route not found
                const homeRoute = routes.find(r => r.path === '/');
                if (homeRoute) {
                    homeRoute.component(container);
                    navigate('/');
                }
            }
        }
    }

    // Navigation function using History API
    function navigate(path: string) {
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