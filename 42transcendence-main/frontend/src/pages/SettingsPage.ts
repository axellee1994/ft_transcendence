import { AuthService } from '../services/auth';
import { Navigation } from '../components/Navigation';

export function renderSettingsPage(container: HTMLElement): void {
    const authService = AuthService.getInstance();
    const currentUser = authService.getCurrentUser();

    container.innerHTML = `
        <div class="py-8">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="bg-white rounded-lg shadow-xl p-8">
                    <h1 class="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
                    
                    <div class="flex flex-col md:flex-row gap-8">
                        <!-- Settings Navigation -->
                        <div class="md:w-1/4">
                            <div class="bg-gray-50 rounded-lg shadow-md p-4">
                                <ul class="space-y-2">
                                    <li>
                                        <button id="account-tab-btn" class="w-full text-left px-4 py-2 bg-blue-500 text-white rounded-lg font-medium">
                                            Account
                                        </button>
                                    </li>
                                    <li>
                                        <button id="game-tab-btn" class="w-full text-left px-4 py-2 hover:bg-gray-200 rounded-lg font-medium transition">
                                            Game Settings
                                        </button>
                                    </li>
                                    <li>
                                        <button id="appearance-tab-btn" class="w-full text-left px-4 py-2 hover:bg-gray-200 rounded-lg font-medium transition">
                                            Appearance
                                        </button>
                                    </li>
                                    <li>
                                        <button id="notifications-tab-btn" class="w-full text-left px-4 py-2 hover:bg-gray-200 rounded-lg font-medium transition">
                                            Notifications
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        <!-- Settings Content -->
                        <div class="md:w-3/4">
                            <!-- Account Settings Tab -->
                            <div id="account-tab" class="bg-gray-50 rounded-lg shadow-md p-6">
                                <h2 class="text-2xl font-bold text-gray-800 mb-4">Account Settings</h2>
                                
                                <form id="account-form" class="space-y-6">
                                    <div class="flex items-center space-x-6 mb-6">
                                        <div class="relative">
                                            <div class="h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden">
                                                ${currentUser?.avatar_url 
                                                    ? `<img src="${currentUser.avatar_url}" alt="Profile" class="h-full w-full object-cover">`
                                                    : `<span class="text-4xl text-white font-medium">${currentUser?.username?.charAt(0).toUpperCase() || 'U'}</span>`
                                                }
                                            </div>
                                            <label for="avatar-upload" class="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </label>
                                            <input type="file" id="avatar-upload" class="hidden" accept="image/*">
                                        </div>
                                        <div>
                                            <h3 class="text-lg font-medium text-gray-900">Profile Picture</h3>
                                            <p class="text-sm text-gray-500">Click the edit icon to change your avatar</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                        <input type="text" id="username" value="${currentUser?.username || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    </div>

                                    <div>
                                        <label for="display-name" class="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                        <input type="text" id="display-name" value="${currentUser?.display_name || ''}" placeholder="Choose a unique display name for tournaments" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    </div>
                                    
                                    <div>
                                        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input type="email" id="email" value="${currentUser?.email || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    </div>
                                    
                                    <div>
                                        <label for="current-password" class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                        <input type="password" id="current-password" placeholder="Enter your current password" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    </div>
                                    
                                    <div>
                                        <label for="new-password" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                        <input type="password" id="new-password" placeholder="Enter new password" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    </div>
                                    
                                    <div>
                                        <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                        <input type="password" id="confirm-password" placeholder="Confirm new password" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    </div>
                                    
                                    <div class="flex justify-end">
                                        <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded transition duration-200">
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                            
                            <!-- Game Settings Tab (Hidden by default) -->
                            <div id="game-tab" class="hidden bg-gray-50 rounded-lg shadow-md p-6">
                                <h2 class="text-2xl font-bold text-gray-800 mb-4">Game Settings</h2>
                                
                                <form id="game-settings-form" class="space-y-6">
                                    <div>
                                        <label for="difficulty" class="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                        <select id="difficulty" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                            <option value="easy">Easy</option>
                                            <option value="medium" selected>Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label for="game-speed" class="block text-sm font-medium text-gray-700 mb-1">Game Speed</label>
                                        <input type="range" id="game-speed" min="1" max="10" value="5" class="w-full">
                                        <div class="flex justify-between text-xs text-gray-500">
                                            <span>Slow</span>
                                            <span>Fast</span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Controls</label>
                                        <div class="space-y-2">
                                            <div class="flex items-center">
                                                <input type="checkbox" id="invert-controls" class="mr-2">
                                                <label for="invert-controls">Invert Controls</label>
                                            </div>
                                            <div class="flex items-center">
                                                <input type="checkbox" id="enable-sound" checked class="mr-2">
                                                <label for="enable-sound">Enable Sound</label>
                                            </div>
                                            <div class="flex items-center">
                                                <input type="checkbox" id="enable-music" checked class="mr-2">
                                                <label for="enable-music">Enable Music</label>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="flex justify-end">
                                        <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded transition duration-200">
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add event listeners for tab switching
    const tabs = ['account', 'game', 'appearance', 'notifications'];
    tabs.forEach(tab => {
        const button = container.querySelector(`#${tab}-tab-btn`);
        const content = container.querySelector(`#${tab}-tab`);
        
        if (button && content) {
            button.addEventListener('click', () => {
                // Hide all tabs
                tabs.forEach(t => {
                    const tabContent = container.querySelector(`#${t}-tab`);
                    const tabButton = container.querySelector(`#${t}-tab-btn`);
                    if (tabContent) {
                        tabContent.classList.add('hidden');
                    }
                    if (tabButton) {
                        tabButton.classList.remove('bg-blue-500', 'text-white');
                        tabButton.classList.add('hover:bg-gray-200');
                    }
                });
                
                // Show selected tab
                content.classList.remove('hidden');
                button.classList.add('bg-blue-500', 'text-white');
                button.classList.remove('hover:bg-gray-200');
            });
        }
    });

    // Handle avatar upload
    const avatarUpload = container.querySelector('#avatar-upload') as HTMLInputElement;
    if (avatarUpload) {
        avatarUpload.addEventListener('change', async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                try {
                    const formData = new FormData();
                    formData.append('avatar', file);
                    await authService.updateAvatar(formData);
                    // Refresh the page to show the new avatar
                    renderSettingsPage(container);
                } catch (error) {
                    console.error('Failed to upload avatar:', error);
                    alert('Failed to upload avatar. Please try again.');
                }
            }
        });
    }

    // Handle account form submission
    const accountForm = container.querySelector('#account-form') as HTMLFormElement;
    if (accountForm) {
        accountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = (container.querySelector('#username') as HTMLInputElement).value;
            const displayName = (container.querySelector('#display-name') as HTMLInputElement).value;
            const email = (container.querySelector('#email') as HTMLInputElement).value;
            const currentPassword = (container.querySelector('#current-password') as HTMLInputElement).value;
            const newPassword = (container.querySelector('#new-password') as HTMLInputElement).value;
            const confirmPassword = (container.querySelector('#confirm-password') as HTMLInputElement).value;

            try {
                if (newPassword && newPassword !== confirmPassword) {
                    throw new Error('New passwords do not match');
                }

                await authService.updateProfile({
                    username,
                    display_name: displayName,
                    email,
                    current_password: currentPassword,
                    new_password: newPassword || undefined
                });

                // Get the updated user data
                const updatedUser = authService.getCurrentUser();
                if (updatedUser) {
                    // Update form fields with the new user data
                    const usernameInput = container.querySelector('#username') as HTMLInputElement;
                    const displayNameInput = container.querySelector('#display-name') as HTMLInputElement;
                    const emailInput = container.querySelector('#email') as HTMLInputElement;
                    
                    if (usernameInput) usernameInput.value = updatedUser.username;
                    if (displayNameInput) displayNameInput.value = updatedUser.display_name || '';
                    if (emailInput) emailInput.value = updatedUser.email;

                    // Clear password fields
                    const currentPasswordInput = container.querySelector('#current-password') as HTMLInputElement;
                    const newPasswordInput = container.querySelector('#new-password') as HTMLInputElement;
                    const confirmPasswordInput = container.querySelector('#confirm-password') as HTMLInputElement;
                    
                    if (currentPasswordInput) currentPasswordInput.value = '';
                    if (newPasswordInput) newPasswordInput.value = '';
                    if (confirmPasswordInput) confirmPasswordInput.value = '';

                    // Force navigation header to update
                    const navContainer = document.querySelector('nav');
                    if (navContainer) {
                        document.dispatchEvent(new CustomEvent('auth-state-changed', {
                            detail: { authenticated: true, updatedFields: ['username', 'display_name', 'email'] }
                        }));
                        
                        // Also try to update the UI directly
                        const usernameElem = document.querySelector('.username');
                        const userEmailSpan = document.querySelector('.user-email');
                        const avatarInitial = document.querySelector('.avatar-initial');
                        
                        // Update username display if it was changed
                        if (usernameElem && updatedUser.username) {
                            usernameElem.textContent = updatedUser.username;
                        }
                        
                        // Update display name if it was changed
                        if (userEmailSpan) {
                            const defaultDisplayName = `Player ${updatedUser.id}`;
                            userEmailSpan.textContent = updatedUser.display_name || defaultDisplayName;
                        }
                        
                        // Update avatar initial using display name or username
                        if (avatarInitial) {
                            const initialSource = updatedUser.display_name || updatedUser.username;
                            avatarInitial.textContent = initialSource.charAt(0).toUpperCase();
                        }
                    }

                    alert('Profile updated successfully!');
                }
            } catch (error) {
                console.error('Failed to update profile:', error);
                alert(error.message || 'Failed to update profile. Please try again.');
            }
        });
    }

    // Handle game settings form submission
    const gameSettingsForm = container.querySelector('#game-settings-form') as HTMLFormElement;
    if (gameSettingsForm) {
        gameSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const difficulty = (container.querySelector('#difficulty') as HTMLSelectElement).value;
            const gameSpeed = (container.querySelector('#game-speed') as HTMLInputElement).value;
            const invertControls = (container.querySelector('#invert-controls') as HTMLInputElement).checked;
            const enableSound = (container.querySelector('#enable-sound') as HTMLInputElement).checked;
            const enableMusic = (container.querySelector('#enable-music') as HTMLInputElement).checked;

            try {
                await authService.updateGameSettings({
                    difficulty,
                    game_speed: parseInt(gameSpeed),
                    invert_controls: invertControls,
                    enable_sound: enableSound,
                    enable_music: enableMusic
                });

                alert('Game settings updated successfully!');
            } catch (error) {
                console.error('Failed to update game settings:', error);
                alert('Failed to update game settings. Please try again.');
            }
        });
    }
} 