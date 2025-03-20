interface AvatarUploadProps {
    currentAvatar: string;
    onAvatarUpdate: (newAvatarUrl: string) => void;
}

export class AvatarUpload {
    private preview: string | null = null;
    private error: string | null = null;
    private isUploading: boolean = false;
    private fileInput: HTMLInputElement;
    private previewImage: HTMLImageElement;
    private errorMessage: HTMLElement;
    private uploadButton: HTMLButtonElement;

    constructor(private container: HTMLElement, private props: AvatarUploadProps) {
        this.initialize();
    }

    private initialize(): void {
        // Create DOM elements
        this.container.innerHTML = `
            <div class="avatar-upload">
                <div class="avatar-preview">
                    <img src="${this.props.currentAvatar}" alt="Avatar preview" class="avatar-image">
                </div>
                <div class="avatar-actions">
                    <input type="file" accept="image/*" style="display: none">
                    <button class="upload-button">Change Avatar</button>
                </div>
                <div class="error-message"></div>
            </div>
        `;

        // Get references to elements
        this.fileInput = this.container.querySelector('input[type="file"]') as HTMLInputElement;
        this.previewImage = this.container.querySelector('.avatar-image') as HTMLImageElement;
        this.errorMessage = this.container.querySelector('.error-message') as HTMLElement;
        this.uploadButton = this.container.querySelector('.upload-button') as HTMLButtonElement;

        // Add event listeners
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.uploadButton.addEventListener('click', () => this.fileInput.click());
    }

    private async handleFileSelect(event: Event): Promise<void> {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select an image file');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('File size must be less than 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            this.preview = reader.result as string;
            this.previewImage.src = this.preview;
            this.clearError();
        };
        reader.readAsDataURL(file);

        // Upload file
        await this.uploadAvatar(file);
    }

    private async uploadAvatar(file: File): Promise<void> {
        this.isUploading = true;
        this.uploadButton.disabled = true;
        this.uploadButton.textContent = 'Uploading...';
        this.clearError();

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/users/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload avatar');
            }

            const data = await response.json();
            this.props.onAvatarUpdate(data.avatar_url);
            this.preview = null;
        } catch (err) {
            this.showError(err instanceof Error ? err.message : 'Failed to upload avatar');
            this.preview = null;
        } finally {
            this.isUploading = false;
            this.uploadButton.disabled = false;
            this.uploadButton.textContent = 'Change Avatar';
        }
    }

    private showError(message: string): void {
        this.error = message;
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
    }

    private clearError(): void {
        this.error = null;
        this.errorMessage.textContent = '';
        this.errorMessage.style.display = 'none';
    }
} 