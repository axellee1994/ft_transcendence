import { AuthService } from '../services/auth';
import { AvatarUpload } from '../components/AvatarUpload';

export class SettingsPage {
    private container: HTMLElement;
    private avatarUpload: AvatarUpload | null = null;
    private originalValues: {
        username: string;
        display_name: string;
        email: string;
        avatar_url: string;
    } | null = null;
    private activeTab: 'profile' | 'account' | 'password' = 'profile';
    private hasProfileChanges: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            // Get current user data
            const userData = localStorage.getItem('user_data');
            if (!userData) {
                throw new Error('User data not found');
            }

            this.originalValues = JSON.parse(userData);
            await this.renderSettingsPage();
            this.setupTabSwitching();

        } catch (error) {
            console.error('Failed to initialize settings page:', error);
            this.showError('Failed to load settings. Please try again later.');
        }
    }

    private async renderSettingsPage(): Promise<void> {
        if (!this.originalValues) return;

        this.container.innerHTML = `
            <div class="settings-page p-6 max-w-6xl mx-auto">
                <h1 class="text-2xl font-bold mb-6">Account Settings</h1>
                
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <!-- Tabs -->
                    <div class="flex border-b">
                        <button id="profile-tab" class="px-6 py-3 border-b-2 border-blue-500 font-medium text-sm text-blue-600">
                            Profile
                        </button>
                        <button id="account-tab" class="px-6 py-3 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            Account
                        </button>
                        <button id="password-tab" class="px-6 py-3 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            Password
                        </button>
                    </div>

                    <!-- Tab Content -->
                    <div class="p-6">
                        <!-- Profile Tab -->
                        <div id="profile-content" class="tab-content">
                            <div class="space-y-6">
                                <div class="flex flex-col md:flex-row gap-6 items-start">
                                    <div class="w-full md:w-1/3">
                                        <h2 class="text-lg font-medium">Profile Picture</h2>
                                        <p class="text-sm text-gray-500 mt-1">This will be displayed on your profile</p>
                                    </div>
                                    <div class="w-full md:w-2/3" id="avatar-container"></div>
                                </div>
                                
                                <div class="flex flex-col md:flex-row gap-6 items-start pt-6 border-t">
                                    <div class="w-full md:w-1/3">
                                        <h2 class="text-lg font-medium">Personal Information</h2>
                                        <p class="text-sm text-gray-500 mt-1">Update your personal details</p>
                                    </div>
                                    <div class="w-full md:w-2/3">
                                        <form id="profile-form" class="space-y-4">
                                            <div class="form-group">
                                                <label for="display_name" class="block text-sm font-medium text-gray-700">Display Name</label>
                                                <input 
                                                    type="text" 
                                                    id="display_name" 
                                                    name="display_name" 
                                                    value="${this.originalValues.display_name || ''}"
                                                    placeholder="How you want to be known"
                                                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <p class="mt-1 text-sm text-gray-500">
                                                    This is the name that will be displayed to other users
                                                </p>
                                            </div>

                                            <div class="mt-6">
                                                <button 
                                                    type="submit"
                                                    id="save-profile-btn"
                                                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                                    disabled
                                                >
                                                    Save Profile
                                                </button>
                                                <button 
                                                    type="button"
                                                    id="cancel-profile-btn"
                                                    class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors ml-2 hidden"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Account Tab -->
                        <div id="account-content" class="tab-content hidden">
                            <div class="space-y-6">
                                <div class="flex flex-col md:flex-row gap-6 items-start">
                                    <div class="w-full md:w-1/3">
                                        <h2 class="text-lg font-medium">Account Information</h2>
                                        <p class="text-sm text-gray-500 mt-1">Manage your account details</p>
                                    </div>
                                    <div class="w-full md:w-2/3">
                                        <form id="account-form" class="space-y-4">
                                            <div class="form-group">
                                                <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
                                                <input 
                                                    type="text" 
                                                    id="username" 
                                                    name="username" 
                                                    value="${this.originalValues.username}"
                                                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <p class="mt-1 text-sm text-gray-500">
                                                    This is your unique identifier on the platform
                                                </p>
                                            </div>

                                            <div class="form-group mt-4">
                                                <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                                                <input 
                                                    type="email" 
                                                    id="email" 
                                                    name="email" 
                                                    value="${this.originalValues.email}"
                                                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <p class="mt-1 text-sm text-gray-500">
                                                    We'll never share your email with anyone else
                                                </p>
                                            </div>

                                            <div class="mt-6">
                                                <button 
                                                    type="submit"
                                                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                                >
                                                    Save Account Details
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Password Tab -->
                        <div id="password-content" class="tab-content hidden">
                            <div class="space-y-6">
                                <div class="flex flex-col md:flex-row gap-6 items-start">
                                    <div class="w-full md:w-1/3">
                                        <h2 class="text-lg font-medium">Change Password</h2>
                                        <p class="text-sm text-gray-500 mt-1">Ensure your account is using a secure password</p>
                                    </div>
                                    <div class="w-full md:w-2/3">
                                        <form id="password-form" class="space-y-4">
                                            <div class="form-group">
                                                <label for="current_password" class="block text-sm font-medium text-gray-700">Current Password</label>
                                                <input 
                                                    type="password" 
                                                    id="current_password" 
                                                    name="current_password" 
                                                    placeholder="••••••••"
                                                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            <div class="form-group mt-4">
                                                <label for="new_password" class="block text-sm font-medium text-gray-700">New Password</label>
                                                <input 
                                                    type="password" 
                                                    id="new_password" 
                                                    name="new_password" 
                                                    placeholder="••••••••"
                                                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            <div class="form-group mt-4">
                                                <label for="confirm_password" class="block text-sm font-medium text-gray-700">Confirm Password</label>
                                                <input 
                                                    type="password" 
                                                    id="confirm_password" 
                                                    name="confirm_password" 
                                                    placeholder="••••••••"
                                                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            <div class="mt-6">
                                                <button 
                                                    type="submit"
                                                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                                >
                                                    Change Password
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="status-message" class="mt-4 p-4 rounded hidden"></div>
            </div>
        `;

        // Initialize avatar upload
        const avatarContainer = document.getElementById('avatar-container');
        if (avatarContainer instanceof HTMLElement) {
            this.avatarUpload = new AvatarUpload({
                container: avatarContainer,
                currentAvatar: this.originalValues.avatar_url,
                onPendingChange: (hasPendingChanges) => {
                    console.log('🔍 DEBUG: Avatar pending changes:', hasPendingChanges);
                    this.updateProfileFormState(hasPendingChanges);
                }
            });
        } else {
            console.error('Avatar container not found');
        }

        // Set up form submissions
        const profileForm = document.getElementById('profile-form') as HTMLFormElement;
        const accountForm = document.getElementById('account-form') as HTMLFormElement;
        const passwordForm = document.getElementById('password-form') as HTMLFormElement;
        const cancelProfileBtn = document.getElementById('cancel-profile-btn');

        // Set up event listeners for forms
        profileForm?.addEventListener('submit', this.handleProfileFormSubmit.bind(this));
        accountForm?.addEventListener('submit', this.handleAccountFormSubmit.bind(this));
        passwordForm?.addEventListener('submit', this.handlePasswordFormSubmit.bind(this));
        
        // Set up event listener for cancel button
        cancelProfileBtn?.addEventListener('click', this.handleProfileCancel.bind(this));
        
        // Set up event listener for display name changes
        const displayNameInput = document.getElementById('display_name') as HTMLInputElement;
        if (displayNameInput) {
            displayNameInput.addEventListener('input', () => {
                const hasNameChanges = displayNameInput.value !== (this.originalValues?.display_name || '');
                const hasAvatarChanges = this.avatarUpload?.hasPendingChanges() || false;
                this.updateProfileFormState(hasNameChanges || hasAvatarChanges);
            });
        }
    }

    private updateProfileFormState(hasChanges: boolean): void {
        this.hasProfileChanges = hasChanges;
        
        const saveButton = document.getElementById('save-profile-btn') as HTMLButtonElement;
        const cancelButton = document.getElementById('cancel-profile-btn') as HTMLButtonElement;
        
        if (saveButton) {
            saveButton.disabled = !hasChanges;
        }
        
        if (cancelButton) {
            cancelButton.classList.toggle('hidden', !hasChanges);
        }
    }
    
    private handleProfileCancel(): void {
        // Discard avatar changes
        if (this.avatarUpload) {
            this.avatarUpload.discardChanges();
        }
        
        // Reset display name input
        const displayNameInput = document.getElementById('display_name') as HTMLInputElement;
        if (displayNameInput && this.originalValues) {
            displayNameInput.value = this.originalValues.display_name || '';
        }
        
        // Update form state
        this.updateProfileFormState(false);
    }

    private setupTabSwitching(): void {
        const tabs = [
            { id: 'profile-tab', content: 'profile-content' },
            { id: 'account-tab', content: 'account-content' },
            { id: 'password-tab', content: 'password-content' }
        ];

        tabs.forEach(tab => {
            const tabButton = document.getElementById(tab.id);
            tabButton?.addEventListener('click', () => {
                // Check for unsaved changes
                if (this.hasProfileChanges && this.activeTab === 'profile') {
                    if (!confirm('You have unsaved changes. Are you sure you want to leave this tab?')) {
                        return;
                    }
                    // Discard changes if user confirms
                    this.handleProfileCancel();
                }
                
                // Hide all content
                tabs.forEach(t => {
                    const content = document.getElementById(t.content);
                    const button = document.getElementById(t.id);
                    
                    if (content) content.classList.add('hidden');
                    
                    if (button) {
                        button.classList.remove('border-blue-500', 'text-blue-600');
                        button.classList.add('border-transparent', 'text-gray-500');
                    }
                });

                // Show selected content
                const selectedContent = document.getElementById(tab.content);
                if (selectedContent) {
                    selectedContent.classList.remove('hidden');
                }

                // Update tab appearance
                if (tabButton) {
                    tabButton.classList.remove('border-transparent', 'text-gray-500');
                    tabButton.classList.add('border-blue-500', 'text-blue-600');
                }

                // Update active tab
                const tabName = tab.id.split('-')[0] as 'profile' | 'account' | 'password';
                this.activeTab = tabName;
            });
        });
    }

    private async handleProfileFormSubmit(event: Event): Promise<void> {
        event.preventDefault();
        
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        const displayName = formData.get('display_name') as string;
        const saveButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
        
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = 'Saving...';
        }
        
        try {
            // First, save avatar if there are pending changes
            if (this.avatarUpload?.hasPendingChanges()) {
                const avatarSaveSuccess = await this.avatarUpload.saveChanges();
                if (!avatarSaveSuccess) {
                    throw new Error('Failed to save avatar');
                }
            }
            
            // Then save display name if it changed
            if (displayName !== (this.originalValues?.display_name || '')) {
                const response = await AuthService.updateUserData({
                    display_name: displayName
                });

                if (response.success) {
                    // Update original values
                    if (this.originalValues) {
                        this.originalValues.display_name = displayName;
                    }

                    // Update localStorage
                    const userData = localStorage.getItem('user_data');
                    if (userData) {
                        const parsedData = JSON.parse(userData);
                        parsedData.display_name = displayName;
                        localStorage.setItem('user_data', JSON.stringify(parsedData));
                    }

                    // Trigger auth state change
                    document.dispatchEvent(new CustomEvent('auth-state-changed', {
                        detail: { 
                            authenticated: true,
                            updatedFields: ['display_name']
                        }
                    }));
                }
            }

            this.showSuccess('Profile information updated successfully');
            this.updateProfileFormState(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
            this.showError(error instanceof Error ? error.message : 'Failed to update profile');
        } finally {
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = 'Save Profile';
            }
        }
    }

    private async handleAccountFormSubmit(event: Event): Promise<void> {
        event.preventDefault();
        
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        const username = formData.get('username') as string;
        const email = formData.get('email') as string;
        
        try {
            const response = await AuthService.updateUserData({
                username: username,
                email: email
            });

            if (response.success) {
                // Update original values
                if (this.originalValues) {
                    this.originalValues.username = username;
                    this.originalValues.email = email;
                }

                // Update localStorage
                const userData = localStorage.getItem('user_data');
                if (userData) {
                    const parsedData = JSON.parse(userData);
                    parsedData.username = username;
                    parsedData.email = email;
                    localStorage.setItem('user_data', JSON.stringify(parsedData));
                }

                // Trigger auth state change 
                document.dispatchEvent(new CustomEvent('auth-state-changed', {
                    detail: { 
                        authenticated: true,
                        updatedFields: ['username', 'email']
                    }
                }));

                this.showSuccess('Account information updated successfully');
            }
        } catch (error) {
            console.error('Failed to update account:', error);
            this.showError(error instanceof Error ? error.message : 'Failed to update account');
        }
    }

    private async handlePasswordFormSubmit(event: Event): Promise<void> {
        event.preventDefault();
        
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        
        const currentPassword = formData.get('current_password') as string;
        const newPassword = formData.get('new_password') as string;
        const confirmPassword = formData.get('confirm_password') as string;
        
        // Perform validation
        if (!currentPassword) {
            this.showError('Current password is required');
            return;
        }
        
        if (!newPassword) {
            this.showError('New password is required');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showError('New passwords do not match');
            return;
        }
        
        try {
            const response = await AuthService.updatePassword(currentPassword, newPassword);

            if (response.success) {
                // Clear password fields
                (form.querySelector('#current_password') as HTMLInputElement).value = '';
                (form.querySelector('#new_password') as HTMLInputElement).value = '';
                (form.querySelector('#confirm_password') as HTMLInputElement).value = '';
                
                this.showSuccess('Password updated successfully');
            }
        } catch (error) {
            console.error('Failed to update password:', error);
            this.showError(error instanceof Error ? error.message : 'Failed to update password');
        }
    }

    private showError(message: string): void {
        const statusDiv = document.getElementById('status-message');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.classList.remove('hidden', 'bg-green-100', 'text-green-800');
            statusDiv.classList.add('bg-red-100', 'text-red-800');
        }
    }

    private showSuccess(message: string): void {
        const statusDiv = document.getElementById('status-message');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.classList.remove('hidden', 'bg-red-100', 'text-red-800');
            statusDiv.classList.add('bg-green-100', 'text-green-800');
            
            // Hide after 5 seconds
            setTimeout(() => {
                statusDiv.classList.add('hidden');
            }, 5000);
        }
    }
} 