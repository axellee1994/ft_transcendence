import { AuthService } from '../services/auth';
import { AvatarUpload } from '../components/AvatarUpload';
import { isValidEmail,isValidFieldLen } from '../utils/validation';

// Export a render function instead of a class, to match other components
export function renderSettingsPage(container: HTMLElement): void {
    const initialize = async () => {
        try {
            const authService = AuthService.getInstance();
            const currentUser = authService.getCurrentUser();
            
            if (!currentUser) {
                showError('User data not found');
                return;
            }

            const originalValues = {
                username: currentUser.username || '',
                display_name: currentUser.display_name || '',
                email: currentUser.email || '',
                avatar_url: currentUser.avatar_url || '',
                is_2fa_enabled: currentUser.is_2fa_enabled || false,
                is_remote_user: currentUser.is_remote_user || false
            };
            
            await renderSettingsUI(originalValues);
            setupTabSwitching();
            setupEventListeners(originalValues);

        } catch (error) {
            console.error('Failed to initialize settings page:', error);
            showError('Failed to load settings. Please try again later.');
        }
    };

    const renderSettingsUI = async (originalValues: any) => {
        container.innerHTML = `
            <div class="settings-page p-6 max-w-6xl mx-auto">
                <h1 class="text-2xl font-bold mb-6">Account Settings</h1>
                
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <!-- Tabs -->
                    <div class="flex border-b">
                        <button id="profile-tab" class="px-6 py-3 border-b-2 border-blue-500 font-medium text-sm text-blue-600">
                            Profile
                        </button>

                        ${originalValues.is_remote_user === false ? `
                        <button id="account-tab" class="px-6 py-3 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            Account
                        </button>
                        <button id="password-tab" class="px-6 py-3 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            Password
                        </button>
                        <button id="twofa-tab" class="px-6 py-3 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            2FA
                        </button>` : ''}
                        
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
                                                    value="${originalValues.display_name || ''}"
                                                    placeholder="How you want to be known"
                                                    maxlength="20"
                                                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <p class="text-xs text-gray-500 mt-1">Max 20 characters</p>
                                                <p class="mt-1 text-sm text-gray-500">
                                                    This is the name that will be displayed to other users
                                                </p>
                                            </div>

                                            <div class="mt-6">
                                                <button 
                                                    type="submit"
                                                    id="save-profile-btn"
                                                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                                    
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
                                                    value="${originalValues.username}"
                                                    minlength="3"
                                                    maxlength="20"
                                                    required
                                                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <p class="text-xs text-gray-500 mt-1">Min 3, Max 20 characters</p>
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
                                                    value="${originalValues.email}"
                                                    maxlength="50"
                                                    required
                                                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <p class="text-xs text-gray-500 mt-1">Max 50 characters</p>
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
                                                    minlength="6"
                                                    maxlength="12"
                                                    required
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
                                                    minlength="6"
                                                    maxlength="12"
                                                    required
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
                                                    minlength="6"
                                                    maxlength="12"
                                                    required
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
                         <!-- twofa Tab -->
                        <div id="twofa-content" class="tab-content hidden">
                            <div class="space-y-6">
                                <div class="flex flex-col md:flex-row gap-6 items-start">
                                    <div class="w-full md:w-1/3">
                                        <h2 class="text-lg font-medium">Enable 2FA</h2>
                                        <p class="text-sm text-gray-500 mt-1">Ensure your account is secure with 2FA</p>
                                    </div>
                                    <div class="w-full md:w-2/3">
                                        <form id="twofa-form" class="space-y-4">

                                            <div class="form-group mt-4">
                                              
                                                <input
                                                ${originalValues.is_2fa_enabled == true ? 'checked' : ''}
                                                id="twofa_check"
                                                name="twofa_check"
                                                type="checkbox" 
                                                value="enabled"
                                                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                                <label for="twofa_check" class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Enable Email 2FA</label>
                                               
                                            </div>
                                    
                                            <div class="mt-6">
                                                <button 
                                                    type="submit"
                                                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                                >
                                                    Update
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

        const avatarContainer = document.getElementById('avatar-container');
        if (avatarContainer instanceof HTMLElement) {
            const avatarUpload = new AvatarUpload({
                container: avatarContainer,
                currentAvatar: originalValues.avatar_url,
                onPendingChange: (hasPendingChanges) => {
                    console.log('🔍 DEBUG: Avatar pending changes:', hasPendingChanges);
                }
            });
            (avatarContainer as any)._avatarUpload = avatarUpload;
        } else {
            console.error('Avatar container not found');
        }
    };

    const setupEventListeners = (originalValues: any) => {
        const profileForm = document.getElementById('profile-form') as HTMLFormElement;
        const accountForm = document.getElementById('account-form') as HTMLFormElement;
        const passwordForm = document.getElementById('password-form') as HTMLFormElement;
        const twofaForm = document.getElementById('twofa-form') as HTMLFormElement;
        
        const cancelProfileBtn = document.getElementById('cancel-profile-btn');

        profileForm?.addEventListener('submit', handleProfileFormSubmit);
        accountForm?.addEventListener('submit', handleAccountFormSubmit);
        passwordForm?.addEventListener('submit', handlePasswordFormSubmit);
        twofaForm?.addEventListener('submit', handleTwofaFormSubmit);
        
        const displayNameInput = document.getElementById('display_name') as HTMLInputElement;
        if (displayNameInput) {
            displayNameInput.addEventListener('input', () => {
                const hasNameChanges = displayNameInput.value !== (originalValues?.display_name || '');
            });
        }
    };

    const setupTabSwitching = (): void => {
        const tabs = [
            { id: 'profile-tab', content: 'profile-content' },
            { id: 'account-tab', content: 'account-content' },
            { id: 'password-tab', content: 'password-content' },
            { id: 'twofa-tab', content: 'twofa-content' }
        ];

        tabs.forEach(tab => {
            const tabButton = document.getElementById(tab.id);
            tabButton?.addEventListener('click', () => {
                tabs.forEach(t => {
                    const content = document.getElementById(t.content);
                    const button = document.getElementById(t.id);
                    
                    if (content) content.classList.add('hidden');
                    
                    if (button) {
                        button.classList.remove('border-blue-500', 'text-blue-600');
                        button.classList.add('border-transparent', 'text-gray-500');
                    }
                });

                const selectedContent = document.getElementById(tab.content);
                if (selectedContent) {
                    selectedContent.classList.remove('hidden');
                }

                if (tabButton) {
                    tabButton.classList.remove('border-transparent', 'text-gray-500');
                    tabButton.classList.add('border-blue-500', 'text-blue-600');
                }
            });
        });
    };

    const handleProfileFormSubmit = async (event: Event): Promise<void> => {
        event.preventDefault();
        
        const form = event.target as HTMLFormElement;
        const saveButton = form.querySelector('#save-profile-btn') as HTMLButtonElement;
        
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = 'Saving...';
        }

        try {
            const formData = new FormData(form);
            let displayName = formData.get('display_name') as string;
            let avatarBase64: string | null = null;

            displayName = displayName.trim();

            if (!isValidFieldLen(displayName, 0, 20))
            {
                showError('Invalid display name, max 20 characters');
                return;
            }

            const avatarContainer = document.getElementById('avatar-container');
            let avatarUploadInstance;
            if (avatarContainer) {
                avatarUploadInstance = (avatarContainer as any)._avatarUpload;
            }

            if (avatarUploadInstance && avatarUploadInstance.hasPendingChanges()) {
                console.log('🔍 DEBUG: SettingsPage - Getting pending avatar base64 data');
                avatarBase64 = await avatarUploadInstance.getPendingAvatarBase64();
                if (!avatarBase64) {
                    throw new Error('Failed to convert avatar to base64');
                }
                 await avatarUploadInstance.saveChanges(); 
            }

            const updatePayload: { display_name?: string; avatar_base64?: string } = {};
            const authService = AuthService.getInstance();
            const originalValues = authService.getCurrentUser();
            if (originalValues && displayName !== originalValues.display_name)
                 updatePayload.display_name = displayName;
            if (avatarBase64)
                 updatePayload.avatar_base64 = avatarBase64;

            if (Object.keys(updatePayload).length > 0)
            {
                console.log('🔍 DEBUG: SettingsPage - Calling AuthService.updateUserData with payload:', updatePayload);
                const response = await AuthService.updateUserData(updatePayload);
    
                if (response.success)
                {
                    showSuccess('Profile information updated successfully');

                    const updatedUser = authService.getCurrentUser();
                    if (avatarUploadInstance && updatedUser)
                    {
                        console.log('🔍 DEBUG: SettingsPage - Calling avatarUploadInstance.updateCurrentAvatar with URL:', updatedUser.avatar_url);
                        avatarUploadInstance.updateCurrentAvatar(updatedUser.avatar_url);
                    }
                }
                else
                     throw new Error('Failed to update user data'); 
            }
            else
            {
                console.log('🔍 DEBUG: SettingsPage - No changes detected to save.');
                 showSuccess('No changes to save.');
            }

        } catch (error) {
            console.error('Failed to update profile:', error);
            showError(error instanceof Error ? error.message : 'Failed to update profile');
        } finally {
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = 'Save Profile';
            }
        }
    };

    const handleAccountFormSubmit = async (event: Event): Promise<void> => {
        event.preventDefault();
        
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        let username = formData.get('username') as string;
        let email = formData.get('email') as string;

        username = username.trim();
        email = email.trim();

        if (!isValidFieldLen(username, 3, 20))
        {
            showError('Invalid username, min 3, max 20 characters');
            return;
        }

        if (!isValidFieldLen(email, 1, 50))
        {
            showError('Invalid email, max 50 characters');
            return;
        }

        if (!isValidEmail(email))
        {
            showError('Invalid email');
            return;
        }

        try {
            const response = await AuthService.updateUserData({
                username: username,
                email: email
            });

            if (response.success) {

                document.dispatchEvent(new CustomEvent('auth-state-changed', {
                    detail: { 
                        authenticated: true,
                        updatedFields: ['username', 'email']
                    }
                }));

                showSuccess('Account information updated successfully');
            }
        } catch (error) {
            console.error('Failed to update account:', error);
            showError(error instanceof Error ? error.message : 'Failed to update account');
        }
    };

    const handlePasswordFormSubmit = async (event: Event): Promise<void> => {
        event.preventDefault();
        
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        
        const currentPassword = formData.get('current_password') as string;
        const newPassword = formData.get('new_password') as string;
        const confirmPassword = formData.get('confirm_password') as string;

        if (!currentPassword)
        {
            showError('Current password is required');
            return;
        }

        if (!isValidFieldLen(newPassword, 6, 12))
        {
            showError('Invalid new password, min 6, max 12 characters');
            return;
        }

        if (!isValidFieldLen(confirmPassword, 6, 12))
        {
            showError('Invalid confirm password, min 6, max 12 characters');
            return;
        }
        
        if (newPassword !== confirmPassword)
        {
            showError('New passwords do not match');
            return;
        }
        
        try {
            const response = await AuthService.updatePassword(currentPassword, newPassword);

            if (response.success) {
                (form.querySelector('#current_password') as HTMLInputElement).value = '';
                (form.querySelector('#new_password') as HTMLInputElement).value = '';
                (form.querySelector('#confirm_password') as HTMLInputElement).value = '';
                
                showSuccess('Password updated successfully');
            }
        } catch (error) {
            console.error('Failed to update password:', error);
            showError(error instanceof Error ? error.message : 'Failed to update password');
        }
    };

    const handleTwofaFormSubmit = async (event: Event): Promise<void> => {
        event.preventDefault();
        
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        
        const twofa_check = formData.get('twofa_check') as string;
        const twofa = (twofa_check === 'enabled') ? true : false as boolean;

        try {
            const response = await AuthService.updateUserData({
                is_2fa_enabled: twofa
            });

            if (response.success) 
            {
                const userData = JSON.parse(localStorage.getItem('user_data'));
                userData.is_2fa_enabled = twofa;
                localStorage.setItem('user_data', JSON.stringify(userData));
                showSuccess('Account information updated successfully');
            }
            } catch (error) {
                console.error('Failed to update 2FA option:', error);
                showError(error instanceof Error ? error.message : 'Failed to update 2FA option');
        }
    }

    const showError = (message: string): void => {
        const statusDiv = document.getElementById('status-message');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.classList.remove('hidden', 'bg-green-100', 'text-green-800');
            statusDiv.classList.add('bg-red-100', 'text-red-800');
        }
    };

    const showSuccess = (message: string): void => {
        const statusDiv = document.getElementById('status-message');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.classList.remove('hidden', 'bg-red-100', 'text-red-800');
            statusDiv.classList.add('bg-green-100', 'text-green-800');
            
            setTimeout(() => {
                statusDiv.classList.add('hidden');
            }, 5000);
        }
    };

    initialize();
} 