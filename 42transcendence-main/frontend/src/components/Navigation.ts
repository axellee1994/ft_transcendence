import { AuthService } from '../services/auth';
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
            console.log('Navigation: Received auth-state-changed event', event);
            // Get the custom event detail if available
            const customEvent = event as CustomEvent;
            const eventDetail = customEvent.detail || { authenticated: true };
            
            // Check if specific fields were updated
            const updatedFields = eventDetail.updatedFields || [];
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
                                <a href="/" class="text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors px-3 py-2 rounded-md">Transcendence</a>
                            </div>
                            <div class="hidden md:flex space-x-4">
                                <a href="/game" class="text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">Play</a>
                                <a href="/leaderboard" class="text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">Leaderboard</a>
                                <a href="/friends" class="text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium user-only hidden transition-colors cursor-pointer">Friends</a>
                                <a href="/profile" class="text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium user-only hidden transition-colors cursor-pointer">Profile</a>
                                <a href="/settings" class="text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium user-only hidden transition-colors cursor-pointer">Settings</a>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <div class="user-info hidden flex items-center space-x-4">
                                <a href="/profile" class="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors">
                                    <div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
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
                // Force a page reload to ensure we're in a clean state
                window.location.href = '/';
            });
        }

        // Initial auth state update
        this.updateAuthState();
    }

    public updateAuthState(updatedFields: string[] = []): void {
        console.log('Navigation: updateAuthState called with fields:', updatedFields);
        
        // Force re-fetch of the current user data
        const isAuthenticated = this.authService.isAuthenticated();
        
        // Get fresh user data by reading from localStorage
        let currentUser = this.authService.getCurrentUser();
        
        // Try to read directly from localStorage if specific fields have been updated
        // or if we don't have certain data in the current user
        if (updatedFields.length > 0 || 
            (currentUser && (!currentUser.display_name || !currentUser.username || !currentUser.email))) {
            try {
                const storedUserData = localStorage.getItem('user_data');
                if (storedUserData) {
                    const parsedUser = JSON.parse(storedUserData);
                    
                    // Check if the stored data has more complete information
                    const shouldUseStored = 
                        (updatedFields.includes('display_name') && parsedUser.display_name) ||
                        (updatedFields.includes('username') && parsedUser.username) ||
                        (updatedFields.includes('email') && parsedUser.email);
                    
                    if (shouldUseStored) {
                        console.log('Navigation: Found updated user data in localStorage:', parsedUser);
                        currentUser = parsedUser;
                    }
                }
            } catch (error) {
                console.error('Navigation: Failed to parse stored user data:', error);
            }
        }
        
        console.log('Navigation: isAuthenticated =', isAuthenticated);
        console.log('Navigation: currentUser =', currentUser);

        // Update UI elements
        const userOnlyElements = this.container.querySelectorAll('.user-only');
        const userInfo = this.container.querySelector('.user-info');
        const loginButton = this.container.querySelector('.login-button');
        const usernameSpan = this.container.querySelector('.username');
        const userEmailSpan = this.container.querySelector('.user-email');
        const avatarInitial = this.container.querySelector('.avatar-initial');

        if (userOnlyElements) {
            console.log('Navigation: updating userOnlyElements visibility');
            userOnlyElements.forEach(element => {
                element.classList.toggle('hidden', !isAuthenticated);
            });
        }

        if (userInfo) {
            console.log('Navigation: updating userInfo visibility');
            userInfo.classList.toggle('hidden', !isAuthenticated);
        }

        if (loginButton) {
            console.log('Navigation: updating loginButton visibility');
            loginButton.classList.toggle('hidden', isAuthenticated);
        }

        if (currentUser && usernameSpan && userEmailSpan && avatarInitial) {
            console.log('Navigation: updating user display info');
            
            // Update username
            usernameSpan.textContent = currentUser.username;
            console.log('Navigation: set username to', currentUser.username);
            
            // Update display name or show default
            const defaultDisplayName = `Player ${currentUser.id}`;
            userEmailSpan.textContent = currentUser.display_name || defaultDisplayName;
            console.log('Navigation: set display name to', userEmailSpan.textContent);
            
            // Update avatar initial (use first letter of display name if available, otherwise username)
            const initialSource = currentUser.display_name || currentUser.username;
            avatarInitial.textContent = initialSource.charAt(0).toUpperCase();
            console.log('Navigation: set avatar initial to', avatarInitial.textContent);
        } else {
            console.log('Navigation: skipping user display update, missing elements or user data');
            console.log('- currentUser:', currentUser);
            console.log('- usernameSpan:', usernameSpan);
            console.log('- userEmailSpan:', userEmailSpan);
            console.log('- avatarInitial:', avatarInitial);
        }
    }
} 