import { API_URL, AuthService } from '../services/auth';
import { AvatarUpload } from './AvatarUpload';

interface User {
    username: string;
    display_name?: string;
    email?: string;
    avatar_url?: string;
    created_at: string;
    last_seen: string;
    is_online: boolean;
}

interface FormData {
    display_name: string;
    email: string;
}

export class UserProfile {
    private container: HTMLElement;
    private user: User | null = null;
    private isEditing: boolean = false;
    private formData: FormData = {
        display_name: '',
        email: ''
    };
    private avatarUpload: AvatarUpload | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            await this.fetchUserProfile();
            this.render();
        } catch (error) {
            this.renderError(error instanceof Error ? error.message : 'Failed to load profile');
        }
    }

    private async fetchUserProfile(): Promise<void> {
        const authService = AuthService.getInstance();
        const token = authService.getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        this.user = await response.json();
        this.formData = {
            display_name: this.user.display_name || '',
            email: this.user.email || ''
        };
    }

    private render(): void {
        if (!this.user) {
            this.renderError('User not found');
            return;
        }

        this.container.innerHTML = `
            <div class="max-w-4xl mx-auto p-8">
                <div class="profile-header flex flex-col items-center gap-4 mb-8">
                    <div id="avatar-container"></div>
                    <h2 class="text-2xl font-bold">${this.sanitizeText(this.user.username)}</h2>
                </div>

                <div class="bg-white rounded-lg shadow-lg p-8">
                    ${this.isEditing ? this.renderEditForm() : this.renderProfileInfo()}
                </div>
            </div>
        `;

        const avatarContainer = this.container.querySelector('#avatar-container');
        if (avatarContainer) {
            this.avatarUpload = new AvatarUpload({
                container: avatarContainer,
                currentAvatar: this.user.avatar_url,
                onAvatarUpdate: this.handleAvatarUpdate.bind(this)
            });
        }

        if (this.isEditing) {
            const form = this.container.querySelector('form');
            if (form) {
                form.addEventListener('submit', this.handleSubmit.bind(this));
            }

            const cancelButton = this.container.querySelector('.cancel-button');
            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    this.isEditing = false;
                    this.render();
                });
            }
        } else {
            const editButton = this.container.querySelector('.edit-button');
            if (editButton) {
                editButton.addEventListener('click', () => {
                    this.isEditing = true;
                    this.render();
                });
            }
        }
    }

    private renderProfileInfo(): string {
        if (!this.user) return '';

        return `
            <div class="space-y-6">
                <div class="grid gap-4">
                    <div class="info-group">
                        <label class="font-semibold text-gray-600">Display Name</label>
                        <p>${this.sanitizeText(this.user.display_name || 'Not set')}</p>
                    </div>

                    <div class="info-group">
                        <label class="font-semibold text-gray-600">Email</label>
                        <p>${this.sanitizeText(this.user.email || 'Not set')}</p>
                    </div>

                    <div class="info-group">
                        <label class="font-semibold text-gray-600">Member Since</label>
                        <p>${new Date(this.user.created_at).toLocaleDateString()}</p>
                    </div>

                    <div class="info-group">
                        <label class="font-semibold text-gray-600">Last Seen</label>
                        <p>${new Date(this.user.last_seen).toLocaleString()}</p>
                    </div>

                    <div class="info-group">
                        <label class="font-semibold text-gray-600">Status</label>
                        <p class="inline-block px-3 py-1 rounded-full text-sm ${
                            this.user.is_online 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }">
                            ${this.user.is_online ? 'Online' : 'Offline'}
                        </p>
                    </div>
                </div>

                <button class="edit-button px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                    Edit Profile
                </button>
            </div>
        `;
    }

    private renderEditForm(): string {
        return `
            <form class="space-y-6">
                <div class="form-group">
                    <label for="display_name" class="block font-semibold text-gray-600">Display Name</label>
                    <input
                        type="text"
                        id="display_name"
                        name="display_name"
                        value="${this.sanitizeText(this.formData.display_name)}"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                <div class="form-group">
                    <label for="email" class="block font-semibold text-gray-600">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value="${this.sanitizeText(this.formData.email)}"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                <div class="flex gap-4">
                    <button type="submit" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                        Save Changes
                    </button>
                    <button type="button" class="cancel-button px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                        Cancel
                    </button>
                </div>
            </form>
        `;
    }

    private renderError(message: string): void {
        this.container.innerHTML = `
            <div class="p-4 bg-red-100 text-red-700 rounded-lg">
                ${this.sanitizeText(message)}
            </div>
        `;
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault();
        
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        
        this.formData = {
            display_name: formData.get('display_name') as string || '',
            email: formData.get('email') as string || ''
        };

        try {
            await this.updateProfile();
            this.isEditing = false;
            this.render();
        } catch (error) {
            this.renderError(error instanceof Error ? error.message : 'Failed to update profile');
        }
    }

    private async updateProfile(): Promise<void> {
        const authService = AuthService.getInstance();
        const token = authService.getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_URL}/users/me`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.formData)
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        this.user = await response.json();
    }

    private handleAvatarUpdate(newAvatarUrl: string): void {
        if (this.user) {
            this.user.avatar_url = newAvatarUrl;
        }
    }

    private sanitizeText(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
} 