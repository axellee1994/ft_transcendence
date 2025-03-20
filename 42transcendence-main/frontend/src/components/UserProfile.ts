import { AvatarUpload } from './AvatarUpload';

interface User {
    id: number;
    username: string;
    display_name: string | null;
    email: string | null;
    avatar_url: string;
    created_at: string;
    last_seen: string;
    is_online: boolean;
}

interface UserProfileProps {
    container: HTMLElement;
}

export class UserProfile {
    private user: User | null = null;
    private loading: boolean = true;
    private error: string | null = null;
    private isEditing: boolean = false;
    private formData = {
        display_name: '',
        email: ''
    };

    constructor(private props: UserProfileProps) {
        this.initialize();
    }

    private async initialize(): Promise<void> {
        await this.fetchUserProfile();
        this.render();
    }

    private async fetchUserProfile(): Promise<void> {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/users/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to load user profile');
            }

            this.user = await response.json();
            this.formData = {
                display_name: this.user.display_name || '',
                email: this.user.email || ''
            };
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to load user profile';
        } finally {
            this.loading = false;
        }
    }

    private render(): void {
        if (this.loading) {
            this.props.container.innerHTML = '<div>Loading...</div>';
            return;
        }

        if (this.error) {
            this.props.container.innerHTML = `<div class="error">${this.error}</div>`;
            return;
        }

        if (!this.user) {
            this.props.container.innerHTML = '<div>User not found</div>';
            return;
        }

        this.props.container.innerHTML = `
            <div class="user-profile">
                <div class="profile-header">
                    <div id="avatar-upload"></div>
                    <h2>${this.user.username}</h2>
                </div>

                <div class="profile-content">
                    ${this.isEditing ? this.renderEditForm() : this.renderProfileInfo()}
                </div>
            </div>
        `;

        // Initialize avatar upload
        const avatarContainer = this.props.container.querySelector('#avatar-upload');
        if (avatarContainer) {
            new AvatarUpload(avatarContainer as HTMLElement, {
                currentAvatar: this.user.avatar_url,
                onAvatarUpdate: (newAvatarUrl) => {
                    if (this.user) {
                        this.user.avatar_url = newAvatarUrl;
                    }
                }
            });
        }

        // Add event listeners
        this.addEventListeners();
    }

    private renderEditForm(): string {
        return `
            <form class="edit-form" id="edit-form">
                <div class="form-group">
                    <label for="display_name">Display Name</label>
                    <input type="text" id="display_name" name="display_name" value="${this.formData.display_name}">
                </div>

                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" value="${this.formData.email}">
                </div>

                <div class="form-actions">
                    <button type="submit" class="save-button">Save Changes</button>
                    <button type="button" class="cancel-button">Cancel</button>
                </div>
            </form>
        `;
    }

    private renderProfileInfo(): string {
        return `
            <div class="profile-info">
                <div class="info-group">
                    <label>Display Name</label>
                    <p>${this.user?.display_name || 'Not set'}</p>
                </div>

                <div class="info-group">
                    <label>Email</label>
                    <p>${this.user?.email || 'Not set'}</p>
                </div>

                <div class="info-group">
                    <label>Member Since</label>
                    <p>${new Date(this.user?.created_at || '').toLocaleDateString()}</p>
                </div>

                <div class="info-group">
                    <label>Last Seen</label>
                    <p>${new Date(this.user?.last_seen || '').toLocaleString()}</p>
                </div>

                <div class="info-group">
                    <label>Status</label>
                    <p class="status ${this.user?.is_online ? 'online' : 'offline'}">
                        ${this.user?.is_online ? 'Online' : 'Offline'}
                    </p>
                </div>

                <button class="edit-button">Edit Profile</button>
            </div>
        `;
    }

    private addEventListeners(): void {
        if (this.isEditing) {
            const form = this.props.container.querySelector('#edit-form');
            if (form) {
                form.addEventListener('submit', this.handleSubmit.bind(this));
            }

            const cancelButton = this.props.container.querySelector('.cancel-button');
            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    this.isEditing = false;
                    this.render();
                });
            }
        } else {
            const editButton = this.props.container.querySelector('.edit-button');
            if (editButton) {
                editButton.addEventListener('click', () => {
                    this.isEditing = true;
                    this.render();
                });
            }
        }

        const inputs = this.props.container.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                this.formData[target.name as keyof typeof this.formData] = target.value;
            });
        });
    }

    private async handleSubmit(e: Event): Promise<void> {
        e.preventDefault();
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/users/me', {
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
            this.isEditing = false;
            this.render();
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to update profile';
            this.render();
        }
    }
} 