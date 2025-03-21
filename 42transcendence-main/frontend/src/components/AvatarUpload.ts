import { API_URL } from '../services/auth';

interface AvatarUploadOptions {
    container: HTMLElement;
    currentAvatar?: string;
    onAvatarUpdate?: (newAvatarUrl: string) => void;
    onPendingChange?: (hasPendingChanges: boolean) => void;
}

export class AvatarUpload {
    private container: HTMLElement;
    private currentAvatar: string;
    private onAvatarUpdate?: (newAvatarUrl: string) => void;
    private onPendingChange?: (hasPendingChanges: boolean) => void;
    private fileInput: HTMLInputElement | null = null;
    private previewImg: HTMLImageElement | null = null;
    private errorDiv: HTMLDivElement | null = null;
    private uploadButton: HTMLButtonElement | null = null;
    private pendingFile: File | null = null;
    private pendingPreviewUrl: string | null = null;

    constructor(options: AvatarUploadOptions) {
        this.container = options.container;
        this.currentAvatar = options.currentAvatar || '';
        this.onAvatarUpdate = options.onAvatarUpdate;
        this.onPendingChange = options.onPendingChange;
        this.render();
        this.setupEventListeners();
    }

    private render(): void {
        // Default SVG avatar - same as used in Navigation
        const defaultAvatar = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzY0OTVFRCIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik03MyA2OWMtMS44LTMuNC03LjktNS42LTExLjktNi43LTQtMS4yLTEuNS0yLjYtMi43LTIuNnMtMy4xLS4xLTguMy0uMS04LjQtLjYtOS42LS42LTMuMyAxLjctNC44IDMuM2MtMS41IDEuNi41IDEzLjIuNSAxMy4yczIuNS0uOSA1LjktLjlTNTMgNzQgNTMgNzRzMS0yLjIgMi45LTIuMiAzLjctLjIgMTAgMGM2LjQuMSAxLjEgNy41IDIuMiA3LjVzNC40LS4zIDUtLjNjMy45LTIuNCAwLTEwIDAtMTB6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTUwIDYxLjhjMTEuMSAwIDIwLjEtOS4xIDIwLjEtMjAuMyAwLTExLjItOS05LTIwLjEtOS4xLTExLjEgMC0yMC4xLTIuMS0yMC4xIDkuMXM5IDIwLjMgMjAuMSAyMC4zeiIvPjwvc3ZnPg==`;
        
        // Get the avatar URL, ensuring we append API_URL if it's a relative path
        let avatarUrl = this.pendingPreviewUrl || this.currentAvatar || defaultAvatar;
        
        // If it's a backend path like /avatars/filename.jpg, prepend the API URL base
        if (avatarUrl && avatarUrl.startsWith('/avatars/')) {
            const baseUrl = API_URL.substring(0, API_URL.indexOf('/api'));
            avatarUrl = `${baseUrl}${avatarUrl}`;
        }
        
        console.log('🔍 DEBUG: AvatarUpload - Rendering with URL:', avatarUrl);
        
        this.container.innerHTML = `
            <div class="avatar-upload flex flex-col items-center gap-4">
                <div class="avatar-preview w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 bg-blue-500 flex items-center justify-center ${this.pendingPreviewUrl ? 'border-blue-500' : ''}">
                    <img 
                        src="${avatarUrl}" 
                        alt="Profile picture" 
                        class="w-full h-full object-cover"
                        onerror="this.onerror=null; this.src='${defaultAvatar}'; console.error('Failed to load avatar image');"
                    />
                </div>
                
                <div class="avatar-actions flex gap-4">
                    <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                    />
                    
                    <button
                        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Change Avatar
                    </button>
                </div>

                <div class="error-message text-red-600 text-sm text-center hidden"></div>
                ${this.pendingPreviewUrl ? '<div class="text-blue-600 text-sm text-center">New avatar selected. Click Save Profile to apply changes.</div>' : ''}
            </div>
        `;

        // Store references to DOM elements
        this.fileInput = this.container.querySelector('input[type="file"]');
        this.previewImg = this.container.querySelector('img');
        this.errorDiv = this.container.querySelector('.error-message');
        this.uploadButton = this.container.querySelector('button');

        // Add event listeners for tracking image loading
        if (this.previewImg) {
            this.previewImg.addEventListener('load', () => {
                console.log('🔍 DEBUG: AvatarUpload - Image loaded successfully:', avatarUrl);
            });
            
            this.previewImg.addEventListener('error', () => {
                console.error('🔍 DEBUG: AvatarUpload - Image failed to load:', avatarUrl);
            });
        }
    }

    private setupEventListeners(): void {
        if (!this.fileInput || !this.uploadButton) return;

        this.uploadButton.addEventListener('click', () => {
            this.fileInput?.click();
        });

        this.fileInput.addEventListener('change', (event) => {
            this.handleFileSelect(event);
        });
    }

    private handleFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
            this.showError('No file selected');
            return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select an image file');
            return;
        }

        // Check file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            this.showError('File size must be less than 5MB');
            return;
        }

        // Create object URL for preview
        this.pendingFile = file;
        this.pendingPreviewUrl = URL.createObjectURL(file);
        
        // Update the preview
        this.render();
        
        // Notify parent of pending changes
        if (this.onPendingChange) {
            this.onPendingChange(true);
        }
        
        // Hide any errors
        this.hideError();
    }

    public async saveChanges(): Promise<boolean> {
        if (!this.pendingFile) return false;

        try {
            const formData = new FormData();
            formData.append('avatar', this.pendingFile);

            // Get auth token for authorization
            const token = localStorage.getItem('auth_token');
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`${API_URL}/users/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('🔍 DEBUG: AvatarUpload - Upload successful:', data);

            // Get the avatar URL from the response
            const avatarUrl = data.avatarUrl || data.avatar_url;
            
            if (!avatarUrl) {
                console.error('🔍 DEBUG: AvatarUpload - No avatar URL in response:', data);
                throw new Error('No avatar URL in response');
            }

            // Update the current avatar and clear pending state
            this.currentAvatar = avatarUrl;
            this.pendingFile = null;
            this.pendingPreviewUrl = null;

            // Update user data in localStorage with the new avatar URL
            const userData = localStorage.getItem('user_data');
            if (userData) {
                const parsedData = JSON.parse(userData);
                parsedData.avatar_url = avatarUrl;
                localStorage.setItem('user_data', JSON.stringify(parsedData));
                console.log('🔍 DEBUG: AvatarUpload - Updated localStorage with new avatar:', avatarUrl);
            }

            // Notify parent component
            if (this.onAvatarUpdate) {
                this.onAvatarUpdate(avatarUrl);
            }

            // Clear any previous errors
            this.hideError();

            // Trigger auth state change event to update UI immediately
            document.dispatchEvent(new CustomEvent('auth-state-changed', {
                detail: { 
                    authenticated: true,
                    updatedFields: ['avatar_url']
                }
            }));

            // Force a refresh of the AuthService current user data
            const authService = (window as any).AuthService?.getInstance?.();
            if (authService && typeof authService.updateCurrentUserFromLocalStorage === 'function') {
                authService.updateCurrentUserFromLocalStorage();
            }

            console.log('🔍 DEBUG: AvatarUpload - Finished avatar update process');
            
            // Notify parent that we no longer have pending changes
            if (this.onPendingChange) {
                this.onPendingChange(false);
            }
            
            // Render to update UI
            this.render();
            
            return true;

        } catch (error) {
            console.error('🔍 DEBUG: AvatarUpload - Upload failed:', error);
            this.showError('Failed to upload avatar. Please try again.');
            return false;
        }
    }
    
    public discardChanges(): void {
        if (this.pendingPreviewUrl) {
            URL.revokeObjectURL(this.pendingPreviewUrl);
        }
        
        this.pendingFile = null;
        this.pendingPreviewUrl = null;
        
        // Notify parent that we no longer have pending changes
        if (this.onPendingChange) {
            this.onPendingChange(false);
        }
        
        // Re-render with original avatar
        this.render();
    }
    
    public hasPendingChanges(): boolean {
        return this.pendingFile !== null;
    }

    private showError(message: string): void {
        if (this.errorDiv) {
            this.errorDiv.textContent = message;
            this.errorDiv.classList.remove('hidden');
        }
    }

    private hideError(): void {
        if (this.errorDiv) {
            this.errorDiv.textContent = '';
            this.errorDiv.classList.add('hidden');
        }
    }
} 