import { AuthModal } from '../components/AuthModal';
import { NotificationService } from './notification';

// Use HTTPS in production, HTTP only in development
export const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:4002/api'
    : `https://${window.location.hostname}/api`;

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

// Constants for keys
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

export class AuthService {
    private static instance: AuthService;
    private currentUser: User | null = null;
    private token: string | null = null;
    private authStateListeners: AuthStateChangeCallback[] = [];
    private loginDialogVisible = false;
    private loginDialogCallback: (() => void) | null = null;
    private listeners: ((updatedFields: string[]) => void)[] = [];

    private constructor() {
        console.log('AuthService: Initializing...');
        this.token = localStorage.getItem(AUTH_TOKEN_KEY);
        const userData = localStorage.getItem(USER_DATA_KEY);
        
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                console.log('AuthService: Loaded user data from localStorage');
            } catch (e) {
                console.error('AuthService: Failed to parse user data from localStorage');
                localStorage.removeItem(USER_DATA_KEY);
                this.currentUser = null;
            }
        }
        
        // Perform token validation asynchronously
        this.validateTokenAsync();
    }

    private async validateTokenAsync() {
        console.log('AuthService: Starting token validation...');
        try {
            await this.validateStoredToken();
        } catch (error) {
            console.error('AuthService: Token validation failed:', error);
            this.clearAuthData();
        }
    }

    private async validateStoredToken() {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) return;

        try {
            // Set the token in the instance
            this.token = token;
            
            // CORRECTED PATH: Now includes /auth/
            const response = await fetch(`${API_URL}/protected/auth/me`, {
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
            this.token = token; // Ensure token is set
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
            
            // Notify listeners that authentication state has changed
            this.notifyAuthStateChange();
            
            console.log('Successfully validated stored token and restored session');
        } catch (error) {
            console.error('Error validating stored token:', error);
            this.clearAuthData();
        }
    }

    private clearAuthData(): void {
        this.currentUser = null;
        this.token = null;
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        this.notifyAuthStateChange();
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
        if (!this.isAuthenticated()) {
            // Token is invalid or expired
            this.clearAuthData();
            throw new Error('Session expired. Please log in again.');
        }

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

        try {
            const response = await fetch(`${API_URL}${endpoint}`, options);
            
            if (response.status === 401) {
                // Unauthorized - token is invalid or expired
                this.clearAuthData();
                // Trigger notification for user
                const notificationService = NotificationService.getInstance();
                notificationService.showError('Your session has expired. Please log in again.');
                // Dispatch auth state change event
                this.notifyAuthStateChange();
                throw new Error('Session expired. Please log in again.');
            }
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'An error occurred' }));
                throw new Error(error.message || `HTTP error! status: ${response.status}`);
            }
            
            return response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
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
            
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(this.currentUser));
            
            return this.currentUser;
        } catch (error) {
            console.error('Failed to fetch latest user data:', error);
            throw error;
        }
    }

    public async login(username: string, password: string): Promise<AuthResponse> {
        try {
            // Simplified logging - only log on entry
            console.log(`Attempting login for user: ${username}`);
            
            // Prepare request data
            const requestData = {
                username,
                password
            };
            
            // Make request to the API
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            
            // Handle unsuccessful response
            if (!response.ok) {
                // Simplified error logging - one concise message
                console.error(`Login failed with status: ${response.status}`);
                
                // Try to extract error details from the response
                let errorMessage = 'Login failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || 'Login failed';
                    
                    // Note: Not showing error notification here, will be handled in the modal
                } catch (jsonError) {
                    // Silent catch - no need to log parsing errors
                }
                
                throw new Error(errorMessage);
            }
            
            // Extract and process the login data
            const loginData = await response.json();
            
            // Set token in localStorage
            if (loginData.token) {
                this.token = loginData.token;
                localStorage.setItem(AUTH_TOKEN_KEY, loginData.token);
            } else {
                console.error('No token received in login response');
                throw new Error('Authentication token not found in response');
            }
            
            // Set user data
            if (loginData.user) {
                this.currentUser = loginData.user;
                
                // Save user data to localStorage
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(this.currentUser));
                
                // Notify listeners about the authentication change
                this.notifyAuthStateChange();
                
                return {
                    user: this.currentUser,
                    token: this.token || ''
                };
            } else {
                console.error('No user data received in login response');
                throw new Error('User data not found in response');
            }
        } catch (error) {
            // Single error log, avoiding stack traces
            console.error('Login error:', error instanceof Error ? error.message : 'Unknown error');
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
            
            localStorage.setItem(AUTH_TOKEN_KEY, responseData.token);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(responseData.user));
            
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
                
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(this.currentUser));
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
                    localStorage.setItem(USER_DATA_KEY, JSON.stringify(this.currentUser));
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
                // CORRECTED PATH: Now /protected/auth/logout
                const logoutUrl = `${API_URL}/protected/auth/logout`;
                
                await fetch(logoutUrl, {
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
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        return !!token;
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
            modalContainer.remove();
            this.loginDialogVisible = false;
        };

        const authModal = new AuthModal({
            container: modalContainer
        });

        authModal.onLogin = async (username: string, password: string) => {
            try {
                await this.login(username, password);
                cleanup();
                onSuccess();
            } catch (error) {
                // No need to log here since login() already logs errors
                
                // Ensure the error is displayed in the modal as well
                if (error instanceof Error) {
                    authModal.showError(error.message);
                } else {
                    authModal.showError('Login failed. Please try again.');
                }
                
                // Find and reset the login button
                const loginForm = modalContainer.querySelector('.login-form');
                if (loginForm) {
                    const submitButton = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement;
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = 'Login';
                    }
                }
            }
        };

        authModal.onRegister = async (username: string, password: string, email: string) => {
            try {
                await this.register(username, password, email);
                cleanup();
                onSuccess();
            } catch (error) {
                // No need to log here since register() already logs errors
                
                // Ensure the error is displayed in the modal as well
                if (error instanceof Error) {
                    authModal.showError(error.message);
                } else {
                    authModal.showError('Registration failed. Please try again.');
                }
                
                // Find and reset the register button
                const registerForm = modalContainer.querySelector('.register-form');
                if (registerForm) {
                    const submitButton = registerForm.querySelector('button[type="submit"]') as HTMLButtonElement;
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = 'Register';
                    }
                }
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
        
        const response = await fetch(`${API_URL}/protected/users/profile`, {
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
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        
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
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) {
                throw new Error('Authentication required');
            }
            
            const response = await fetch(`${API_URL}/protected/users/profile`, {
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
            const userData = localStorage.getItem(USER_DATA_KEY);
            if (userData) {
                const parsedData = JSON.parse(userData);
                Object.assign(parsedData, data);
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(parsedData));
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
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) {
                throw new Error('Authentication required');
            }
            
            console.log('🔍 DEBUG: Updating password via /protected/users/profile endpoint');
            
            const response = await fetch(`${API_URL}/protected/users/profile`, {
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

    public updateCurrentUserFromlocalStorage(): void {
        try {
            const userData = localStorage.getItem(USER_DATA_KEY);
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

    private parseJwt(token: string): any {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Error parsing JWT:", e);
            return null;
        }
    }

    private isTokenValid(): boolean {
        const token = this.token;
        if (!token) return false;
        
        try {
            const decoded = this.parseJwt(token);
            // Check if token is expired
            if (!decoded.exp)
                return true; // No expiration
            return decoded.exp * 1000 > Date.now(); // exp is in seconds, Date.now() is ms
        } catch (e) {
            console.error("Error validating token:", e);
            return false;
        }
    }


    public getToken(): string | null {
        return this.token;
    }
} 