import { AuthModal } from '../components/AuthModal';
import { NotificationService } from './notification';

const API_URL = 'http://localhost:4002/api';

export interface LoginResponse {
    token: string;
    user: {
        id: number;
        username: string;
        display_name: string;
        email: string;
        avatar_url: string;
    };
}

export interface RegisterResponse extends LoginResponse {}

export interface User {
    id: number;
    username: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface ProfileUpdateData {
    username?: string;
    display_name?: string;
    email?: string;
    current_password?: string;
    new_password?: string;
}

export interface GameSettings {
    difficulty: string;
    game_speed: number;
    invert_controls: boolean;
    enable_sound: boolean;
    enable_music: boolean;
}

type AuthStateChangeCallback = (isAuthenticated: boolean) => void;

export class AuthService {
    private static instance: AuthService;
    private currentUser: User | null = null;
    private token: string | null = null;
    private authStateListeners: AuthStateChangeCallback[] = [];
    private loginDialogVisible = false;

    private constructor() {
        // Try to load existing auth data
        const storedToken = localStorage.getItem('auth_token');
        const storedUserData = localStorage.getItem('user_data');
        
        if (storedToken && storedUserData) {
            try {
                this.token = storedToken;
                this.currentUser = JSON.parse(storedUserData);
                this.notifyAuthStateChange();
            } catch (error) {
                console.error('Failed to load stored auth data:', error);
                this.clearAuthData();
            }
        }
    }

    private clearAuthData(): void {
        this.currentUser = null;
        this.token = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        this.notifyAuthStateChange();
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
        if (this.token) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            };
        }

        const response = await fetch(`${API_URL}${endpoint}`, options);
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'An error occurred' }));
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    public async login(username: string, password: string): Promise<AuthResponse> {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const responseData = await response.json();
            
            if (!response.ok) {
                const errorMessage = responseData.error || 'Login failed. Please check your credentials.';
                console.error('Login error:', errorMessage);
                // Show error notification
                NotificationService.getInstance().showError(errorMessage);
                throw new Error(errorMessage);
            }

            this.currentUser = responseData.user;
            this.token = responseData.token;
            
            localStorage.setItem('auth_token', responseData.token);
            localStorage.setItem('user_data', JSON.stringify(responseData.user));
            
            this.notifyAuthStateChange();
            return { user: responseData.user, token: responseData.token };
        } catch (error) {
            console.error('Login failed:', error);
            // Only show notification for network errors or unexpected errors
            // Don't show notification for errors already handled above
            if (!(error instanceof Error && error.message.includes('Please check your credentials') || 
                  error.message.includes('Username not found') || 
                  error.message.includes('Incorrect password'))) {
                NotificationService.getInstance().showError('Network error. Please try again later.');
            }
            throw error;
        }
    }

    public async register(username: string, password: string, email: string): Promise<AuthResponse> {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, email })
            });

            const responseData = await response.json();

            if (!response.ok) {
                const errorMessage = responseData.error || 'Registration failed';
                // Show error notification
                NotificationService.getInstance().showError(errorMessage);
                throw new Error(errorMessage);
            }

            this.currentUser = responseData.user;
            this.token = responseData.token;
            
            localStorage.setItem('auth_token', responseData.token);
            localStorage.setItem('user_data', JSON.stringify(responseData.user));
            
            this.notifyAuthStateChange();
            return { user: responseData.user, token: responseData.token };
        } catch (error) {
            console.error('Registration failed:', error);
            // Only show notification for network errors, not for errors already handled above
            if (!(error instanceof Error && (
                error.message.includes('Registration failed') || 
                error.message.includes('Username or email already exists')
            ))) {
                NotificationService.getInstance().showError('Network error. Please try again later.');
            }
            throw error;
        }
    }

    public async updateProfile(data: ProfileUpdateData): Promise<User> {
        try {
            console.log('Updating profile with data:', data);
            
            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            console.log('Profile update response status:', response.status);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Profile update failed');
            }

            const responseData = await response.json();
            console.log('Profile update response data:', responseData);
            
            // Track which fields were updated
            const updatedFields: string[] = [];
            if (data.username) updatedFields.push('username');
            if (data.display_name !== undefined) updatedFields.push('display_name');
            if (data.email) updatedFields.push('email');
            
            // Update user data
            if (responseData.user) {
                console.log('Updating user data with:', responseData.user);
                // Merge the new data with existing user data to ensure we don't lose any fields
                this.currentUser = {
                    ...this.currentUser,
                    ...responseData.user
                };
                
                // Ensure display_name is properly handled (could be empty string or null)
                if (responseData.user.display_name !== undefined) {
                    this.currentUser!.display_name = responseData.user.display_name;
                }
                
                console.log('Updated current user:', this.currentUser);
                localStorage.setItem('user_data', JSON.stringify(this.currentUser));
            } else {
                console.log('No user data in response, using the request data to update');
                // If response doesn't include user data, use the request data to update the current user
                if (this.currentUser) {
                    const updatedUser = {
                        ...this.currentUser,
                    };
                    
                    // Only update fields that were actually provided in the request
                    if (data.display_name !== undefined) {
                        updatedUser.display_name = data.display_name;
                    }
                    
                    if (data.username) {
                        updatedUser.username = data.username;
                    }
                    
                    if (data.email) {
                        updatedUser.email = data.email;
                    }
                    
                    this.currentUser = updatedUser;
                    console.log('Updated current user with request data:', this.currentUser);
                    localStorage.setItem('user_data', JSON.stringify(this.currentUser));
                }
            }
            
            // Update token if provided
            if (responseData.token) {
                this.token = responseData.token;
                localStorage.setItem('auth_token', responseData.token);
            }
            
            // Force an auth state update with details about which fields were updated
            console.log('Notifying auth state change with fields:', updatedFields);
            document.dispatchEvent(new CustomEvent('auth-state-changed', {
                detail: { 
                    authenticated: true,
                    updatedFields
                }
            }));
            
            // Also call the regular listeners
            this.notifyAuthStateChange();
            
            return this.currentUser!;
        } catch (error) {
            console.error('Profile update failed:', error);
            throw error;
        }
    }

    public async updateAvatar(formData: FormData): Promise<User> {
        try {
            const response = await fetch(`${API_URL}/users/avatar`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Avatar update failed');
            }

            const data = await response.json();
            this.currentUser = data.user;
            localStorage.setItem('user_data', JSON.stringify(data.user));
            this.notifyAuthStateChange();
            return data.user;
        } catch (error) {
            console.error('Avatar update failed:', error);
            throw error;
        }
    }

    public async updateGameSettings(settings: GameSettings): Promise<void> {
        try {
            await this.makeAuthenticatedRequest('/users/settings/game', {
                method: 'PUT',
                body: JSON.stringify(settings)
            });
        } catch (error) {
            console.error('Game settings update failed:', error);
            throw error;
        }
    }

    public async logout(): Promise<void> {
        try {
            if (this.token) {
                // Make API call to update online status on server
                const apiUrl = window.location.hostname === 'localhost' ? 
                    `http://${window.location.hostname}:4002/api/auth/logout` : 
                    '/api/auth/logout';
                
                await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            // Clear local data regardless of API success
            this.clearAuthData();
        }
    }

    public isAuthenticated(): boolean {
        return !!this.token && !!this.currentUser;
    }

    public getCurrentUser(): User | null {
        return this.currentUser;
    }

    public onAuthStateChange(callback: AuthStateChangeCallback): void {
        this.authStateListeners.push(callback);
    }

    private notifyAuthStateChange(): void {
        const isAuthenticated = this.isAuthenticated();
        this.authStateListeners.forEach(listener => listener(isAuthenticated));
    }

    public showLoginDialog(onSuccess: () => void): void {
        if (this.loginDialogVisible) return;
        
        this.loginDialogVisible = true;
        
        const modalContainer = document.createElement('div');
        document.body.appendChild(modalContainer);

        const cleanup = () => {
            console.log('Cleaning up auth modal');
            modalContainer.remove();
            this.loginDialogVisible = false;
        };

        const authModal = new AuthModal({
            container: modalContainer
        });

        authModal.onLogin = async (username: string, password: string) => {
            try {
                console.log('Attempting login with username:', username);
                await this.login(username, password);
                console.log('Login successful');
                cleanup();
                onSuccess();
            } catch (error) {
                console.error('Login error:', error);
                throw error;
            }
        };

        authModal.onRegister = async (username: string, password: string, email: string) => {
            try {
                console.log('Attempting registration with username:', username, 'and email:', email);
                await this.register(username, password, email);
                console.log('Registration successful');
                cleanup();
                onSuccess();
            } catch (error) {
                console.error('Registration error:', error);
                throw error;
            }
        };

        // Handle modal close
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                cleanup();
            }
        });

        const closeButton = modalContainer.querySelector('.auth-modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                cleanup();
            });
        }

        authModal.show();
    }
} 