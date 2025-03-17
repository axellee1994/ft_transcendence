type Route = {
    path: string;
    component: (container: HTMLElement) => void;
};

const routes: Route[] = [];

export function registerRoute(path: string, component: (container: HTMLElement) => void) {
    routes.push({ path, component });
}

export function initRouter(container: HTMLElement) {
    function navigate(path: string) {
        const route = routes.find(r => r.path === path);
        if (route) {
            route.component(container);
            window.history.pushState({}, '', path);
        } else {
            // Fallback to home if route not found
            const homeRoute = routes.find(r => r.path === '/');
            if (homeRoute) {
                homeRoute.component(container);
                window.history.pushState({}, '', '/');
            }
        }
    }

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        const path = window.location.pathname;
        const route = routes.find(r => r.path === path);
        if (route) {
            route.component(container);
        } else {
            // Fallback to home if route not found
            const homeRoute = routes.find(r => r.path === '/');
            if (homeRoute) {
                homeRoute.component(container);
                window.history.pushState({}, '', '/');
            }
        }
    });

    // Handle initial route
    const path = window.location.pathname;
    const route = routes.find(r => r.path === path) || routes.find(r => r.path === '/');
    if (route) {
        route.component(container);
    } else {
        // Fallback to home if route not found
        const homeRoute = routes.find(r => r.path === '/');
        if (homeRoute) {
            homeRoute.component(container);
            window.history.pushState({}, '', '/');
        }
    }

    // Add navigation method to window
    (window as any).navigate = navigate;
} 