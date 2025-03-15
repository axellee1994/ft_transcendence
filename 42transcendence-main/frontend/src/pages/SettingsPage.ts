/**
 * Renders the Settings page
 */
export function renderSettingsPage(contentElement: HTMLElement): void {
    contentElement.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-8 max-w-4xl mx-auto mt-10">
            <h1 class="text-4xl font-bold text-center mb-6 text-gray-800">Settings</h1>
            
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
                            <li>
                                <button id="privacy-tab-btn" class="w-full text-left px-4 py-2 hover:bg-gray-200 rounded-lg font-medium transition">
                                    Privacy
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
                        
                        <form class="space-y-6">
                            <div>
                                <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input type="text" id="username" value="johndoe" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            </div>
                            
                            <div>
                                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" id="email" value="john.doe@example.com" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
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
                        
                        <form class="space-y-6">
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
                    
                    <!-- Other tabs would be added here, hidden by default -->
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners for tab switching
    document.getElementById('account-tab-btn')?.addEventListener('click', () => {
        // Hide all tabs
        document.getElementById('account-tab')!.classList.remove('hidden');
        document.getElementById('game-tab')!.classList.add('hidden');
        
        // Update active tab button
        document.getElementById('account-tab-btn')!.classList.add('bg-blue-500', 'text-white');
        document.getElementById('account-tab-btn')!.classList.remove('hover:bg-gray-200');
        
        document.getElementById('game-tab-btn')!.classList.remove('bg-blue-500', 'text-white');
        document.getElementById('game-tab-btn')!.classList.add('hover:bg-gray-200');
    });
    
    document.getElementById('game-tab-btn')?.addEventListener('click', () => {
        // Hide all tabs
        document.getElementById('account-tab')!.classList.add('hidden');
        document.getElementById('game-tab')!.classList.remove('hidden');
        
        // Update active tab button
        document.getElementById('account-tab-btn')!.classList.remove('bg-blue-500', 'text-white');
        document.getElementById('account-tab-btn')!.classList.add('hover:bg-gray-200');
        
        document.getElementById('game-tab-btn')!.classList.add('bg-blue-500', 'text-white');
        document.getElementById('game-tab-btn')!.classList.remove('hover:bg-gray-200');
    });
} 