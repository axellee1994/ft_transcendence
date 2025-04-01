import { AuthService } from '../services/auth';
import { AvatarUpload } from '../components/AvatarUpload';

// Export a render function instead of a class, to match other components
export function renderSettingsPage(container: HTMLElement): void {
    const initialize = async () => {
        try {
            // Get current user data from AuthService
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
                avatar_url: currentUser.avatar_url || ''
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
                                                    value="${originalValues.display_name || ''}"
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
                                                    value="${originalValues.username}"
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
                                                    value="${originalValues.email}"
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
            const avatarUpload = new AvatarUpload({
                container: avatarContainer,
                currentAvatar: originalValues.avatar_url,
                onPendingChange: (hasPendingChanges) => {
                    console.log('🔍 DEBUG: Avatar pending changes:', hasPendingChanges);
                    updateProfileFormState(hasPendingChanges);
                }
            });
            // Store the instance on the container for later access
            (avatarContainer as any)._avatarUpload = avatarUpload;
        } else {
            console.error('Avatar container not found');
        }
    };

    // Helper functions
    const setupEventListeners = (originalValues: any) => {
        // Set up form submissions
        const profileForm = document.getElementById('profile-form') as HTMLFormElement;
        const accountForm = document.getElementById('account-form') as HTMLFormElement;
        const passwordForm = document.getElementById('password-form') as HTMLFormElement;
        const cancelProfileBtn = document.getElementById('cancel-profile-btn');

        // Set up event listeners for forms
        profileForm?.addEventListener('submit', handleProfileFormSubmit);
        accountForm?.addEventListener('submit', handleAccountFormSubmit);
        passwordForm?.addEventListener('submit', handlePasswordFormSubmit);
        
        // Set up event listener for cancel button
        cancelProfileBtn?.addEventListener('click', handleProfileCancel);
        
        // Set up event listener for display name changes
        const displayNameInput = document.getElementById('display_name') as HTMLInputElement;
        if (displayNameInput) {
            displayNameInput.addEventListener('input', () => {
                const hasNameChanges = displayNameInput.value !== (originalValues?.display_name || '');
                // Cannot access AvatarUpload instance directly in this structure, 
                // will handle changes through the onPendingChange callback
                updateProfileFormState(hasNameChanges);
            });
        }
    };

    let hasProfileChanges = false;

    const updateProfileFormState = (hasChanges: boolean): void => {
        hasProfileChanges = hasChanges;
        
        const saveButton = document.getElementById('save-profile-btn') as HTMLButtonElement;
        const cancelButton = document.getElementById('cancel-profile-btn');
        
        if (saveButton) {
            saveButton.disabled = !hasChanges;
        }
        
        if (cancelButton) {
            cancelButton.classList.toggle('hidden', !hasChanges);
        }
    };

    const handleProfileCancel = (): void => {
        // Reset display name input
        const displayNameInput = document.getElementById('display_name') as HTMLInputElement;
        if (displayNameInput) {
            displayNameInput.value = '';
        }
        
        // Update form state
        updateProfileFormState(false);
    };

    const setupTabSwitching = (): void => {
        const tabs = [
            { id: 'profile-tab', content: 'profile-content' },
            { id: 'account-tab', content: 'account-content' },
            { id: 'password-tab', content: 'password-content' }
        ];

        tabs.forEach(tab => {
            const tabButton = document.getElementById(tab.id);
            tabButton?.addEventListener('click', () => {
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
            const displayName = formData.get('display_name') as string;
            let avatarBase64: string | null = null; // Variable to hold base64 data

            // Get the AvatarUpload instance
            const avatarContainer = document.getElementById('avatar-container');
            let avatarUploadInstance;
            if (avatarContainer) {
                avatarUploadInstance = (avatarContainer as any)._avatarUpload;
            }

            // If avatar has pending changes, get the base64 data
            if (avatarUploadInstance && avatarUploadInstance.hasPendingChanges()) {
                console.log('🔍 DEBUG: SettingsPage - Getting pending avatar base64 data');
                avatarBase64 = await avatarUploadInstance.getPendingAvatarBase64();
                if (!avatarBase64) {
                    // Handle error if conversion failed (though unlikely if hasPendingChanges was true)
                    throw new Error('Failed to convert avatar to base64');
                }
                 // Clear the pending state in AvatarUpload after getting the data
                 // Note: saveChanges() now primarily clears state.
                 await avatarUploadInstance.saveChanges(); 
            }

            // Prepare the combined payload for the API call
            const updatePayload: { display_name?: string; avatar_base64?: string } = {};
            // Only include fields if they have actually changed or are present
            // Check originalValues to see if display_name changed
            const authService = AuthService.getInstance();
            const originalValues = authService.getCurrentUser(); // Assuming this holds original values
            if (originalValues && displayName !== originalValues.display_name) {
                 updatePayload.display_name = displayName;
            }
            if (avatarBase64) {
                 updatePayload.avatar_base64 = avatarBase64;
            }

            // Only call API if there's something to update
            if (Object.keys(updatePayload).length > 0) {
                 console.log('🔍 DEBUG: SettingsPage - Calling AuthService.updateUserData with payload:', updatePayload);
                 // Update profile data (including avatar if present)
                 const response = await AuthService.updateUserData(updatePayload);
    
                 if (response.success) {
                    // Trigger auth state change with updated fields
                    const updatedFields = Object.keys(updatePayload).map(key => 
                        key === 'avatar_base64' ? 'avatar_url' : key
                    );
                    document.dispatchEvent(new CustomEvent('auth-state-changed', {
                        detail: { 
                            authenticated: true,
                            updatedFields: updatedFields
                        }
                    }));
                    showSuccess('Profile information updated successfully');
                 } else {
                     // Throw generic error if AuthService indicates failure
                     // The specific error might be logged within AuthService or the backend
                     throw new Error('Failed to update user data'); 
                 }
            } else {
                console.log('🔍 DEBUG: SettingsPage - No changes detected to save.');
                 showSuccess('No changes to save.'); // Or just do nothing
            }
            
            updateProfileFormState(false); // Reset form state regardless of API call
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
        const username = formData.get('username') as string;
        const email = formData.get('email') as string;
        
        try {
            const response = await AuthService.updateUserData({
                username: username,
                email: email
            });

            if (response.success) {
                // AuthService handles user data persistence

                // Trigger auth state change 
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
        
        // Perform validation
        if (!currentPassword) {
            showError('Current password is required');
            return;
        }
        
        if (!newPassword) {
            showError('New password is required');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showError('New passwords do not match');
            return;
        }
        
        try {
            const response = await AuthService.updatePassword(currentPassword, newPassword);

            if (response.success) {
                // Clear password fields
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
            
            // Hide after 5 seconds
            setTimeout(() => {
                statusDiv.classList.add('hidden');
            }, 5000);
        }
    };

    // Initialize the page
    initialize();
} 