import { AuthModal } from '../components/AuthModal';
import { NotificationService } from './notification';

export const API_URL = 'http://localhost:4002/api';

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

type AuthStateChangeCallback = (isAuthenticated: boolean) => void;

export class AuthService {
    private static instance: AuthService;
    private currentUser: User | null = null;
    private token: string | null = null;
    private authStateListeners: AuthStateChangeCallback[] = [];
    private loginDialogVisible = false;
    private loginDialogCallback: (() => void) | null = null;
    private listeners: ((updatedFields: string[]) => void)[] = [];

    private constructor() {
        this.validateStoredToken();
    }

    private async validateStoredToken() {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        try {
            // Try to fetch user data with the stored token
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                // If token is invalid, clear storage
                console.log('Stored token is invalid, clearing auth data...');
                this.clearAuthData();
                return;
            }

            // Token is valid, update current user
            const userData = await response.json();
            this.currentUser = userData;
            localStorage.setItem('user_data', JSON.stringify(userData));
        } catch (error) {
            console.error('Error validating stored token:', error);
            this.clearAuthData();
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
            // Start with existing headers or empty object
            const existingHeaders = options.headers as Record<string, string> || {};
            
            const headers = {
                'Authorization': `Bearer ${this.token}`,
                ...existingHeaders
            };

            // Only add Content-Type: application/json if we're not sending FormData
            if (!(options.body instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
            }

            options.headers = headers;
        }

        const response = await fetch(`${API_URL}${endpoint}`, options);
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'An error occurred' }));
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    private async fetchLatestUserData(): Promise<User> {
        try {
            console.log('🔍 Fetching latest user data...');
            
            // Ensure we have a current user with ID
            if (!this.currentUser?.id) {
                throw new Error('User ID not found');
            }
            
            // Remember the current values before fetching new data
            const previousAvatarUrl = this.currentUser?.avatar_url;
            const previousDisplayName = this.currentUser?.display_name;
            console.log('🔍 Previous avatar URL:', previousAvatarUrl);
            console.log('🔍 Previous display name:', previousDisplayName);
            
            // Use makeAuthenticatedRequest with the correct endpoint including the user ID
            const userData = await this.makeAuthenticatedRequest(`/users/${this.currentUser.id}`, {
                method: 'GET'
            });
            
            console.log('🔍 Received user data:', userData);
            
            // Update the current user data with the latest from server
            if (userData.user) {
                this.currentUser = userData.user;
            } else {
                // If the response doesn't have a user property, assume the response itself is the user data
                this.currentUser = userData;
            }
            
            // Check and preserve important values if missing from the server response
            const updatedValues = [];
            
            // Check if the avatar URL is present in the response
            if (this.currentUser?.avatar_url) {
                console.log('🔍 New avatar URL from server:', this.currentUser.avatar_url);
            } else if (previousAvatarUrl) {
                // If the server response doesn't contain an avatar URL but we had one before,
                // keep using the previous one to avoid losing it
                console.warn('🔍 Server response missing avatar_url, keeping previous:', previousAvatarUrl);
                this.currentUser = {
                    ...this.currentUser,
                    avatar_url: previousAvatarUrl
                };
                updatedValues.push('avatar_url');
            } else {
                console.log('🔍 No avatar URL in server response or previous data');
            }
            
            // Check if display_name is present in the response
            if (this.currentUser?.display_name) {
                console.log('🔍 New display name from server:', this.currentUser.display_name);
            } else if (previousDisplayName) {
                // If the server response doesn't contain a display name but we had one before,
                // keep using the previous one to avoid losing it
                console.warn('🔍 Server response missing display_name, keeping previous:', previousDisplayName);
                this.currentUser = {
                    ...this.currentUser,
                    display_name: previousDisplayName
                };
                updatedValues.push('display_name');
            } else {
                console.log('🔍 No display name in server response or previous data');
            }
            
            console.log('🔍 Updated current user to:', this.currentUser);
            if (updatedValues.length > 0) {
                console.log('🔍 Values preserved from previous data:', updatedValues.join(', '));
            }
            
            localStorage.setItem('user_data', JSON.stringify(this.currentUser));
            
            return this.currentUser;
        } catch (error) {
            console.error('Failed to fetch latest user data:', error);
            throw error;
        }
    }

    public async login(username: string, password: string): Promise<AuthResponse> {
        try {
            console.log('🔍 Starting login process...');
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const responseData = await response.json();
            console.log('🔍 Login response:', responseData);
            
            if (!response.ok) {
                const errorMessage = responseData.error || 'Login failed. Please check your credentials.';
                console.error('Login error:', errorMessage);
                NotificationService.getInstance().showError(errorMessage);
                throw new Error(errorMessage);
            }

            // Set the token first
            this.token = responseData.token;
            localStorage.setItem('auth_token', responseData.token);

            // Set initial user data from login response
            if (responseData.user) {
                this.currentUser = responseData.user;
                console.log('🔍 Initial user data from login:', this.currentUser);
                
                // Check and log avatar URL specifically
                if (this.currentUser.avatar_url) {
                    console.log('🔍 Avatar URL from login response:', this.currentUser.avatar_url);
                } else {
                    console.log('🔍 No avatar URL in login response - this is a first-time login or user without avatar');
                }
                
                // Log the display name value as well
                console.log('🔍 Display name from login response:', this.currentUser.display_name || 'not provided');
                
                // Store the user data in localStorage
                localStorage.setItem('user_data', JSON.stringify(responseData.user));
                
                // Try to fetch latest user data right after login to ensure we have the most up-to-date info
                try {
                    const latestUserData = await this.fetchLatestUserData();
                    console.log('🔍 Updated user data after login:', latestUserData);
                    
                    // Make sure we keep the display_name if it's not in the latest data but was in the initial login data
                    if (!latestUserData.display_name && this.currentUser.display_name) {
                        console.log('🔍 Preserving display_name from login response:', this.currentUser.display_name);
                        this.currentUser = {
                            ...latestUserData,
                            display_name: this.currentUser.display_name
                        };
                        localStorage.setItem('user_data', JSON.stringify(this.currentUser));
                    }
                    
                    // If there's still no avatar_url after fetching latest data,
                    // we'll rely on the UI components to display the default avatar
                } catch (error) {
                    console.warn('Failed to fetch latest user data after login:', error);
                    // Continue with login process even if this fails
                }
            } else {
                console.error('🔍 No user data in login response:', responseData);
                throw new Error('No user data in login response');
            }

            // Notify of auth state change
            this.notifyAuthStateChange();
            
            return { user: this.currentUser, token: this.token };
        } catch (error) {
            console.error('Login failed:', error);
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
            const response = await this.makeAuthenticatedRequest('/users/profile', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            if (this.currentUser) {
                // Update only the fields that were in the update request
                this.currentUser = {
                    ...this.currentUser,
                    ...(data.username ? { username: data.username } : {}),
                    ...(data.display_name !== undefined ? { display_name: data.display_name } : {}),
                    ...(data.email ? { email: data.email } : {})
                };
                
                localStorage.setItem('user_data', JSON.stringify(this.currentUser));
                document.dispatchEvent(new CustomEvent('auth-state-changed', {
                    detail: { 
                        authenticated: true, 
                        updatedFields: Object.keys(data).filter(key => key !== 'current_password' && key !== 'new_password')
                    }
                }));
            }
            
            return this.currentUser as User;
        } catch (error) {
            console.error('Profile update failed:', error);
            throw error;
        }
    }

    public async updateAvatar(file: File): Promise<User | null> {
        try {
            console.log('🔍 Starting avatar update...');
            
            if (!this.currentUser?.id) {
                console.error('Cannot update avatar: user ID not found');
                return null;
            }

            const formData = new FormData();
            formData.append('avatar', file);
            
            const response = await this.makeAuthenticatedRequest(`/users/${this.currentUser.id}/avatar`, {
                method: 'PUT',
                body: formData
            });
            
            console.log('🔍 Avatar update response:', response);
            
            // Update the current user data
            if (response && response.avatar_url) {
                if (this.currentUser) {
                    this.currentUser.avatar_url = response.avatar_url;
                    localStorage.setItem('user_data', JSON.stringify(this.currentUser));
                }
                
                // Try to get the latest user data to ensure everything is up to date
                try {
                    const latestUser = await this.fetchLatestUserData();
                    console.log('🔍 Updated user data after avatar change:', latestUser);
                } catch (err) {
                    console.error('Error fetching latest user data after avatar update:', err);
                    // Continue with the existing user data if fetch fails
                }
                
                // Notify listeners about the avatar update
                document.dispatchEvent(new CustomEvent('auth-state-changed', {
                    detail: { authenticated: true, updatedFields: ['avatar_url'] }
                }));
                
                // Also call regular listeners
                this.notifyAuthStateChange();
            } else {
                console.warn('Avatar update response missing avatar_url');
            }
            
            return this.currentUser;
        } catch (error) {
            console.error('Avatar update failed:', error);
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

    public async updateUserData(data: any): Promise<any> {
        if (!this.currentUser || !this.token) {
            throw new Error('Not authenticated');
        }
        
        console.log('🔍 DEBUG: Updating user data:', data);
        
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('🔍 DEBUG: Update user data error:', error);
            throw new Error(error.message || 'Failed to update user data');
        }

        const userData = await response.json();
        console.log('🔍 DEBUG: User data updated successfully:', userData);
        
        // Update current user
        this.currentUser = userData;
        
        // Store updated user data
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        // Notify of changes
        document.dispatchEvent(new CustomEvent('auth-state-changed', {
            detail: { 
                authenticated: true,
                updatedFields: Object.keys(data)
            }
        }));
        
        return userData;
    }

    public static async updateUserData(data: { 
        username?: string; 
        email?: string; 
        display_name?: string;
    }): Promise<{ success: boolean }> {
        try {
            console.log('🔍 DEBUG: Updating user data:', data);
            
            // Get auth token from localStorage
            const token = localStorage.getItem('auth_token');
            if (!token) {
                throw new Error('Authentication required');
            }
            
            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update user data');
            }

            const result = await response.json();
            
            // Update the instance's current user if it exists
            const instance = AuthService.getInstance();
            const currentUser = instance.getCurrentUser();
            if (currentUser) {
                // Update the current user with the new data
                Object.assign(currentUser, data);
                
                // Also update the AuthService instance user
                instance['currentUser'] = currentUser;
            }
            
            // Update localStorage with all the changes
            const userData = localStorage.getItem('user_data');
            if (userData) {
                const parsedData = JSON.parse(userData);
                Object.assign(parsedData, data);
                localStorage.setItem('user_data', JSON.stringify(parsedData));
            }
            
            return { success: true, ...result };
        } catch (error) {
            console.error('Failed to update user data:', error);
            throw error;
        }
    }

    public static async updatePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
        try {
            // Get auth token from localStorage
            const token = localStorage.getItem('auth_token');
            if (!token) {
                throw new Error('Authentication required');
            }
            
            console.log('🔍 DEBUG: Updating password via /users/profile endpoint');
            
            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update password');
            }
            
            const result = await response.json();
            console.log('🔍 DEBUG: Password update response:', result);

            return { success: true };
        } catch (error) {
            console.error('Failed to update password:', error);
            throw error;
        }
    }

    public updateCurrentUserFromLocalStorage(): void {
        try {
            const userData = localStorage.getItem('user_data');
            if (userData) {
                const parsedData = JSON.parse(userData);
                console.log('🔍 DEBUG: AuthService - Updating current user from localStorage:', parsedData);
                
                // Update the current user with localStorage data
                this.currentUser = parsedData;
                
                // Trigger auth state change notification
                this.notifyAuthStateChange();
                
                // Also dispatch custom event for components listening to it
                document.dispatchEvent(new CustomEvent('auth-state-changed', {
                    detail: { 
                        authenticated: true,
                        updatedFields: ['avatar_url', 'username', 'display_name', 'email']
                    }
                }));
                
                console.log('🔍 DEBUG: AuthService - Current user updated from localStorage');
            } else {
                console.warn('🔍 DEBUG: AuthService - No user data in localStorage');
            }
        } catch (error) {
            console.error('🔍 DEBUG: AuthService - Error updating from localStorage:', error);
        }
    }
} 