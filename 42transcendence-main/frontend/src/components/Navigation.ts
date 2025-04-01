import { AuthService, API_URL } from '../services/auth';
import { AuthModal } from './AuthModal';

export class Navigation {
    private container: HTMLElement;
    private authService: AuthService;

    constructor(container: HTMLElement) {
        this.container = container;
        this.authService = AuthService.getInstance();
        this.initialize();
        this.updateAuthState();
        
        // Listen for auth state changes from custom events
        document.addEventListener('auth-state-changed', (event: Event) => {
            console.log('🔍 DEBUG: Navigation - Received auth-state-changed event:', event);
            const customEvent = event as CustomEvent;
            const eventDetail = customEvent.detail || {};
            
            // Get updated fields if any were specified
            const updatedFields = eventDetail.updatedFields || [];
            console.log('🔍 DEBUG: Navigation - Auth state change with fields:', updatedFields);
            
            // Update only specific fields or all auth state if no fields specified
            this.updateAuthState(updatedFields);
        });
    }

    private initialize(): void {
        this.container.innerHTML = `
            <nav class="bg-white shadow-md">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between h-16">
                        <div class="flex items-center space-x-8">
                            <div class="flex-shrink-0 flex items-center">
                                <a href="/" class="text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors px-3 py-2 rounded-md">42_transcendence</a>
                            </div>
                            <div class="md:flex space-x-4">
                                <a href="/friends" class="text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium user-only hidden transition-colors cursor-pointer">Friends</a>
                                <a href="/tournaments" class="text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium user-only hidden transition-colors cursor-pointer">Tournaments</a>
                                <a href="/profile" class="text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium user-only hidden transition-colors cursor-pointer">Profile</a>
                                <a href="/stats" class="text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium user-only hidden transition-colors cursor-pointer">Stats</a>
                                <a href="/settings" class="text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium user-only hidden transition-colors cursor-pointer">Settings</a>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <div class="user-info hidden flex items-center space-x-4">
                                <a href="/profile" class="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors">
                                    <div class="user-avatar h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden">
                                        <span class="avatar-initial text-white font-medium text-sm"></span>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="username text-sm font-medium text-gray-900"></span>
                                        <span class="text-xs text-gray-500 user-email"></span>
                                    </div>
                                </a>
                                <div class="border-l border-gray-200 h-6"></div>
                                <button class="logout-button text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
                                    Logout
                                </button>
                            </div>
                            <button class="login-button bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
                                Login
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        `;

        // Add event listeners
        const loginButton = this.container.querySelector('.login-button');
        const logoutButton = this.container.querySelector('.logout-button');

        if (loginButton) {
            loginButton.addEventListener('click', () => {
                console.log('Login button clicked');
                this.authService.showLoginDialog(() => {
                    console.log('Login success callback executing');
                    this.updateAuthState();
                    console.log('Auth state updated after login');
                });
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
                console.log('Logout button clicked');
                await this.authService.logout();
                this.updateAuthState();
                console.log('Auth state updated after logout');
                // Use router navigation if available
                if ((window as any).navigate) {
                    (window as any).navigate('/');
                } else {
                    window.location.href = '/';
                }
            });
        }

        // Initial auth state update
        this.updateAuthState();
    }

    public updateAuthState(updatedFields: string[] = []): void {
        console.log('🔍 DEBUG: Navigation - updateAuthState called with fields:', updatedFields);
        
        const authService = AuthService.getInstance();
        const currentUser = authService.getCurrentUser();
        
        // Get references to DOM elements
        const authButtons = this.container.querySelector('.login-button');
        const userInfo = this.container.querySelector('.user-info');
        const usernameSpan = this.container.querySelector('.username');
        const userEmailSpan = this.container.querySelector('.user-email');
        const userAvatar = this.container.querySelector('.user-avatar') as HTMLImageElement;
        
        // Get all user-only elements
        const userOnlyElements = this.container.querySelectorAll('.user-only');
        
        if (!currentUser) {
            // Handle logged out state
            if (authButtons) authButtons.classList.remove('hidden');
            if (userInfo) userInfo.classList.add('hidden');
            // Hide all user-only elements
            userOnlyElements.forEach(element => {
                element.classList.add('hidden');
            });
            return;
        }

        // Handle logged in state
        if (authButtons) authButtons.classList.add('hidden');
        if (userInfo) userInfo.classList.remove('hidden');
        
        // Show all user-only elements
        userOnlyElements.forEach(element => {
            element.classList.remove('hidden');
        });

        if (currentUser && usernameSpan && userEmailSpan) {
            console.log('Navigation: updating user display info');
            
            // Update username
            usernameSpan.textContent = currentUser.username;
            console.log('Navigation: set username to', currentUser.username);
            
            // Update display name or show default
            const defaultDisplayName = `Player ${currentUser.id}`;
            // Only use default if display_name is null or undefined, not empty string
            if (currentUser.display_name === null || currentUser.display_name === undefined) {
                userEmailSpan.textContent = defaultDisplayName;
                console.log('Navigation: display name not set, using default:', defaultDisplayName);
            } else {
                userEmailSpan.textContent = currentUser.display_name;
                console.log('Navigation: using saved display name:', currentUser.display_name);
            }
            console.log('Navigation: set display name to', userEmailSpan.textContent);
            
            // Update avatar if it's in the updated fields or if we're doing a full update
            if (updatedFields.includes('avatar_url') || updatedFields.length === 0) {
                console.log('Navigation: updating avatar with URL:', currentUser.avatar_url);
                this.updateUserAvatar(currentUser);
            }
        }
    }

    private updateUserAvatar(currentUser: any): void {
        if (!currentUser) return;
        
        const avatarContainer = this.container.querySelector('.user-avatar');
        const avatarInitial = this.container.querySelector('.avatar-initial');
        
        console.log('🔍 DEBUG: Navigation - Updating avatar for user:', currentUser.username);
        
        if (currentUser && currentUser.avatar_url) {
            console.log('🔍 DEBUG: Navigation - User has avatar URL:', currentUser.avatar_url);
            
            // Ensure we have a complete URL for the avatar
            let avatarUrl = currentUser.avatar_url;
            
            // If it's a backend path like /avatars/filename.jpg, prepend the API URL base
            if (avatarUrl.startsWith('/avatars/')) {
                const baseUrl = API_URL.substring(0, API_URL.indexOf('/api'));
                avatarUrl = `${baseUrl}${avatarUrl}`;
                console.log('🔍 DEBUG: Navigation - Transformed avatar URL to:', avatarUrl);
            }
            
            console.log('🔍 DEBUG: Navigation - Final avatar URL:', avatarUrl);
            
            // Clear the container and add an image
            if (avatarContainer) {
                // Set a default avatar as fallback
                const defaultAvatar = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzY0OTVFRCIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik03MyA2OWMtMS44LTMuNC03LjktNS42LTExLjktNi43LTQtMS4yLTEuNS0yLjYtMi43LTIuNnMtMy4xLS4xLTguMy0uMS04LjQtLjYtOS42LS42LTMuMyAxLjctNC44IDMuM2MtMS41IDEuNi41IDEzLjIuNSAxMy4yczIuNS0uOSA1LjktLjlTNTMgNzQgNTMgNzRzMS0yLjIgMi45LTIuMiAzLjctLjIgMTAgMGM2LjQuMSAxLjEgNy41IDIuMiA3LjVzNC40LS4zIDUtLjNjMy45LTIuNCAwLTEwIDAtMTB6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTUwIDYxLjhjMTEuMSAwIDIwLjEtOS4xIDIwLjEtMjAuMyAwLTExLjItOS05LTIwLjEtOS4xLTExLjEgMC0yMC4xLTIuMS0yMC4xIDkuMXM5IDIwLjMgMjAuMSAyMC4zeiIvPjwvc3ZnPg==`;
                
                // Generate a unique cache-busting parameter to prevent browser caching
                const timestamp = new Date().getTime();
                const cacheParam = `?t=${timestamp}`;
                
                avatarContainer.innerHTML = `<img src="${avatarUrl}${cacheParam}" alt="${currentUser.username}" 
                                                class="h-full w-full object-cover rounded-full"
                                                onerror="this.onerror=null; this.src='${defaultAvatar}';">`;
                console.log('🔍 DEBUG: Navigation - Avatar container after update:', avatarContainer.innerHTML);
                
                // Hide the avatar initial since we're showing the image
                if (avatarInitial) {
                    (avatarInitial as HTMLElement).style.display = 'none';
                }
                
                // Add event listeners for tracking image loading
                const img = avatarContainer.querySelector('img');
                if (img) {
                    img.addEventListener('load', () => {
                        console.log('🔍 DEBUG: Navigation - Avatar image loaded successfully from:', avatarUrl);
                    });
                    
                    img.addEventListener('error', () => {
                        console.error('🔍 DEBUG: Navigation - Avatar image failed to load:', avatarUrl);
                        // The onerror attribute will handle the fallback
                    });
                }
            } else {
                console.error('🔍 DEBUG: Navigation - Avatar container not found');
            }
        } else {
            console.log('🔍 DEBUG: Navigation - No avatar URL, using initial');
            // Make sure the initial is shown
            if (avatarContainer && currentUser) {
                // Default SVG avatar - same as used in AvatarUpload
                const defaultAvatar = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzY0OTVFRCIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik03MyA2OWMtMS44LTMuNC03LjktNS42LTExLjktNi43LTQtMS4yLTEuNS0yLjYtMi43LTIuNnMtMy4xLS4xLTguMy0uMS04LjQtLjYtOS42LS42LTMuMyAxLjctNC44IDMuM2MtMS41IDEuNi41IDEzLjIuNSAxMy4yczIuNS0uOSA1LjktLjlTNTMgNzQgNTMgNzRzMS0yLjIgMi45LTIuMiAzLjctLjIgMTAgMGM2LjQuMSAxLjEgNy41IDIuMiA3LjVzNC40LS4zIDUtLjNjMy45LTIuNCAwLTEwIDAtMTB6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTUwIDYxLjhjMTEuMSAwIDIwLjEtOS4xIDIwLjEtMjAuMyAwLTExLjItOS05LTIwLjEtOS4xLTExLjEgMC0yMC4xLTIuMS0yMC4xIDkuMXM5IDIwLjMgMjAuMSAyMC4zeiIvPjwvc3ZnPg==`;
                
                // Use the default avatar instead of initials
                avatarContainer.innerHTML = `<img src="${defaultAvatar}" alt="${currentUser.username}" class="h-full w-full object-cover rounded-full">`;
                console.log('🔍 DEBUG: Navigation - Set avatar to default SVG:', avatarContainer.innerHTML);
                
                // Hide the avatar initial since we're showing the image
                if (avatarInitial) {
                    (avatarInitial as HTMLElement).style.display = 'none';
                }
            }
        }
    }
} 