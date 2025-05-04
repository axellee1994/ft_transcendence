import { API_URL, AuthService } from '../services/auth';

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
    }

    private render(): void {

        let avatarUrl = this.pendingPreviewUrl || this.currentAvatar;
        
        const defaultAvatar = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzY0OTVFRCIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik03MyA2OWMtMS44LTMuNC03LjktNS42LTExLjktNi43LTQtMS4yLTEuNS0yLjYtMi43LTIuNnMtMy4xLS4xLTguMy0uMS04LjQtLjYtOS42LS42LTMuMyAxLjctNC44IDMuM2MtMS41IDEuNi41IDEzLjIuNSAxMy4yczIuNS0uOSA1LjktLjlTNTMgNzQgNTMgNzRzMS0yLjIgMi45LTIuMiAzLjctLjIgMTAgMGM2LjQuMSAxLjEgNy41IDIuMiA3LjVzNC40LS4zIDUtLjNjMy45LTIuNCAwLTEwIDAtMTB6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTUwIDYxLjhjMTEuMSAwIDIwLjEtOS4xIDIwLjEtMjAuMyAwLTExLjItOS05LTIwLjEtOS4xLTExLjEgMC0yMC4xLTIuMS0yMC4xIDkuMXM5IDIwLjMgMjAuMSAyMC4zeiIvPjwvc3ZnPg==`;
        
        if (!avatarUrl) {
            avatarUrl = defaultAvatar;
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

        this.fileInput = this.container.querySelector('input[type="file"]');
        this.previewImg = this.container.querySelector('img');
        this.errorDiv = this.container.querySelector('.error-message');
        this.uploadButton = this.container.querySelector('button');

        if (this.previewImg) {
            this.previewImg.addEventListener('load', () => {
                console.log('🔍 DEBUG: AvatarUpload - Image loaded successfully:', avatarUrl);
            });
            
            this.previewImg.addEventListener('error', () => {
                console.error('🔍 DEBUG: AvatarUpload - Image failed to load:', avatarUrl);
            });
        }

        if (this.uploadButton) {
            this.uploadButton.addEventListener('click', () => {
                this.fileInput?.click();
            });
        }

        if (this.fileInput) {
            this.fileInput.addEventListener('change', (event) => {
                this.handleFileSelect(event);
            });
        }
    }

    private handleFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
            this.showError('No file selected');
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.showError('Please select an image file');
            return;
        }

        const maxSize = 150 * 1024;
        if (file.size > maxSize) {
            this.showError('File size must be less than 150KB');
            return;
        }

        this.pendingFile = file;
        this.pendingPreviewUrl = URL.createObjectURL(file);
        
        this.render();
        
        if (this.onPendingChange) {
            this.onPendingChange(true);
        }
        
        this.hideError();
    }

    public async saveChanges(): Promise<boolean> {
        console.warn('AvatarUpload.saveChanges() called, but upload logic is now handled by the parent component.');
        if (!this.pendingFile) return false; // Still need to check if there was a pending file

        const hadPendingFile = this.pendingFile !== null;
        if (this.pendingPreviewUrl) {
            URL.revokeObjectURL(this.pendingPreviewUrl);
        }
        this.pendingFile = null;
        this.pendingPreviewUrl = null;
        
        if (this.onPendingChange) {
            this.onPendingChange(false);
        }
        this.render();
        return hadPendingFile;
    }
    
    public discardChanges(): void {
        if (this.pendingPreviewUrl) {
            URL.revokeObjectURL(this.pendingPreviewUrl);
        }
        
        this.pendingFile = null;
        this.pendingPreviewUrl = null;
        
        if (this.onPendingChange) {
            this.onPendingChange(false);
        }
        
        this.render();
    }
    
    public hasPendingChanges(): boolean {
        return this.pendingFile !== null;
    }

    public getPendingAvatarBase64(): Promise<string | null> {
        return new Promise((resolve, reject) => {
            if (!this.pendingFile) {
                resolve(null);
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result as string);
            };
            reader.onerror = (error) => {
                console.error('Error reading file for base64 conversion:', error);
                reject(error);
            };

            reader.readAsDataURL(this.pendingFile);
        });
    }

    private showError(message: string): void {
        if (this.errorDiv) {
            alert(`Error: ${message}`);
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

    // This is used to update the current avatar from the parent component
    public updateCurrentAvatar(newUrl: string): void
    {
        if (this.currentAvatar !== newUrl)
        {
            console.log(`🔍 DEBUG: AvatarUpload - Updating currentAvatar from ${this.currentAvatar?.substring(0,30)}... to ${newUrl?.substring(0,30)}...`);
            this.currentAvatar = newUrl || '';
            this.pendingPreviewUrl = null; 
            this.pendingFile = null;
            this.render(); 
        }
        else
            console.log('🔍 DEBUG: AvatarUpload - updateCurrentAvatar called but URL is the same.');
    }
} 