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
        

        document.addEventListener('auth-state-changed', (event: Event) => {
            console.log('🔍 DEBUG: Navigation - Received auth-state-changed event:', event);
            const customEvent = event as CustomEvent;
            const eventDetail = customEvent.detail || {};
            

            const updatedFields = eventDetail.updatedFields || [];
            console.log('🔍 DEBUG: Navigation - Auth state change with fields:', updatedFields);
            

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
                                    <div class="user-avatar h-8 w-8 rounded-full bg-gray-300 bg-cover bg-center overflow-hidden">
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

                if ((window as any).navigate) {
                    (window as any).navigate('/');
                } else {
                    window.location.href = '/';
                }
            });
        }

        this.updateAuthState();
    }

    public updateAuthState(updatedFields: string[] = []): void {
        const timestamp = new Date().toISOString(); 
        console.log(`[${timestamp}] 🔍 DEBUG: Navigation - updateAuthState triggered. Fields:`, updatedFields);
        
        const authService = AuthService.getInstance();
        const currentUser = authService.getCurrentUser();
        const currentUserAvatarUrl = currentUser?.avatar_url;
        console.log(currentUser)
        
        console.log(`[${timestamp}] 🔍 DEBUG: Navigation - Fetched currentUser. ID: ${currentUser?.id}, Avatar URL (first chars): ${currentUserAvatarUrl?.substring(0, 50)}...`);

        const authButtons = this.container.querySelector('.login-button');
        const userInfo = this.container.querySelector('.user-info');
        const usernameSpan = this.container.querySelector('.username');
        const userEmailSpan = this.container.querySelector('.user-email');
        const userOnlyElements = this.container.querySelectorAll('.user-only');

        if (!currentUser)
        {
            if (authButtons) authButtons.classList.remove('hidden');
            if (userInfo) userInfo.classList.add('hidden');
            userOnlyElements.forEach(element => element.classList.add('hidden'));
            console.log('🔍 DEBUG: Navigation - User logged out, UI updated.');
            const avatarContainer = this.container.querySelector<HTMLElement>('.user-avatar');
            if (avatarContainer) avatarContainer.style.backgroundImage = 'none'; 
            return;
        }

        console.log('🔍 DEBUG: Navigation - User logged in:', currentUser.username);
        if (authButtons)
            authButtons.classList.add('hidden');
        if (userInfo)
            userInfo.classList.remove('hidden');
        userOnlyElements.forEach(element => element.classList.remove('hidden'));

        if (usernameSpan)
        {
            if (usernameSpan.textContent !== currentUser.username)
            {
                usernameSpan.textContent = currentUser.username;
                console.log('🔍 DEBUG: Navigation - Updated username to:', currentUser.username);
            }
        }
        

        if (userEmailSpan)
        {
            const defaultDisplayName = `Player ${currentUser.id}`;
            const newDisplayName = (currentUser.display_name === null || currentUser.display_name === undefined || currentUser.display_name === "") 
                                    ? defaultDisplayName 
                                    : currentUser.display_name;
            if (userEmailSpan.textContent !== newDisplayName) {
                userEmailSpan.textContent = newDisplayName;
                console.log('🔍 DEBUG: Navigation - Updated display name to:', newDisplayName);
            }
        }

        console.log(`[${timestamp}] 🔍 DEBUG: Navigation - Calling updateUserAvatar.`);
        this.updateUserAvatar(currentUser);
    }

    private updateUserAvatar(currentUser: any): void {
        if (!currentUser)
            return;

        const avatarContainer = this.container.querySelector<HTMLElement>('.user-avatar');
        if (!avatarContainer)
        {
            console.error('🔍 DEBUG: Navigation - Avatar container not found during update');
            return;
        }

        const defaultAvatarUrl = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzY0OTVFRCIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik03MyA2OWMtMS44LTMuNC03LjktNS42LTExLjktNi43LTQtMS4yLTEuNS0yLjYtMi43LTIuNnMtMy4xLS4xLTguMy0uMS04LjQtLjYtOS42LS42LTMuMyAxLjctNC44IDMuM2MtMS41IDEuNi41IDEzLjIuNSAxMy4yczIuNS0uOSA1LjktLjlTNTMgNzQgNTMgNzRzMS0yLjIgMi45LTIuMiAzLjctLjIgMTAgMGM2LjQuMSAxLjEgNy41IDIuMiA3LjVzNC40LS4zIDUtLjNjMy45LTIuNCAwLTEwIDAtMTB6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTUwIDYxLjhjMTEuMSAwIDIwLjEtOS4xIDIwLjEtMjAuMyAwLTExLjItOS05LTIwLjEtOS4xLTExLjEgMC0yMC4xLTIuMS0yMC4xIDkuMXM5IDIwLjMgMjAuMSAyMC4zeiIvPjwvc3ZnPg==`;
        let finalUrlToApply: string;

        if (currentUser.avatar_url)
        {
            console.log('🔍 DEBUG: Navigation - User has avatar URL. Applying as background.');
            let avatarUrl = currentUser.avatar_url;

            if (avatarUrl.startsWith('/avatars/'))
            {
                const baseUrl = API_URL.substring(0, API_URL.indexOf('/api'));
                avatarUrl = `${baseUrl}${avatarUrl}`;
            }

            finalUrlToApply = avatarUrl;
            avatarContainer.classList.remove('bg-gray-300', 'bg-blue-500');
        }
        else
        {
            console.log('🔍 DEBUG: Navigation - No avatar URL, setting default SVG background.');
            finalUrlToApply = defaultAvatarUrl;
            avatarContainer.classList.add('bg-gray-300'); 
        }

        avatarContainer.style.backgroundImage = `url('${finalUrlToApply}')`;
    }
}