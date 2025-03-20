import { AuthService } from '../services/auth';

export function renderProfilePage(container: HTMLElement, userId?: number): void {
    const authService = AuthService.getInstance();
    
    // If userId is provided, fetch that user's profile,
    // otherwise show the current user's profile
    if (userId) {
        fetchUserProfile(container, userId);
    } else {
        renderCurrentUserProfile(container);
    }
}

function renderCurrentUserProfile(container: HTMLElement): void {
    const authService = AuthService.getInstance();
    const currentUser = authService.getCurrentUser();

    container.innerHTML = `
        <div class="py-8">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="bg-white rounded-lg shadow-xl p-8">
                    <h1 class="text-3xl font-bold text-gray-900 mb-8">Profile</h1>
                    
                    <div class="space-y-6">
                        <div class="flex items-center space-x-6">
                            <div class="h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center">
                                <span class="text-4xl text-white font-medium">${currentUser?.username.charAt(0).toUpperCase() || 'U'}</span>
                            </div>
                            <div>
                                <h2 class="text-2xl font-semibold text-gray-900">${currentUser?.display_name || currentUser?.username || 'User'}</h2>
                                <p class="text-gray-500">${currentUser?.email || 'No email provided'}</p>
                            </div>
                        </div>
                        
                        <div class="border-t border-gray-200 pt-6">
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Game Statistics</h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <p class="text-sm text-gray-500">Games Played</p>
                                    <p class="text-2xl font-semibold text-gray-900">0</p>
                                </div>
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <p class="text-sm text-gray-500">Wins</p>
                                    <p class="text-2xl font-semibold text-gray-900">0</p>
                                </div>
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <p class="text-sm text-gray-500">Win Rate</p>
                                    <p class="text-2xl font-semibold text-gray-900">0%</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="border-t border-gray-200 pt-6">
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Matches</h3>
                            <div class="space-y-3">
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <p class="text-gray-500">No recent matches</p>
                                </div>
                            </div>
                        </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function fetchUserProfile(container: HTMLElement, userId: number): Promise<void> {
    try {
        container.innerHTML = '<div class="p-8 text-center">Loading profile...</div>';
        
        const token = localStorage.getItem('auth_token');
        
        // Ensure we have the correct API URL prefix
        const apiBaseUrl = window.location.hostname === 'localhost' ? 
            `http://${window.location.hostname}:4002` : 
            '';
        
        // Make the request to get user profile
        const response = await fetch(`${apiBaseUrl}/api/users/${userId}`, {
            headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load user profile');
        }
        
        const user = await response.json();
        
        // Also fetch user stats
        const statsResponse = await fetch(`${apiBaseUrl}/api/users/${userId}/stats`, {
            headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        
        const stats = statsResponse.ok ? await statsResponse.json() : { wins: 0, losses: 0, winRate: 0, totalGames: 0 };
        
        // Render user profile with received data
        container.innerHTML = `
            <div class="py-8">
                <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="bg-white rounded-lg shadow-xl p-8">
                        <h1 class="text-3xl font-bold text-gray-900 mb-8">User Profile</h1>
                        
                        <div class="space-y-6">
                            <div class="flex items-center space-x-6">
                                <div class="relative h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center">
                                    ${user.avatar_url 
                                        ? `<img src="${user.avatar_url}" alt="${user.username}" class="h-24 w-24 rounded-full object-cover">`
                                        : `<span class="text-4xl text-white font-medium">${user.username.charAt(0).toUpperCase()}</span>`
                                    }
                                    <span class="absolute bottom-0 right-0 h-4 w-4 rounded-full ${user.is_online ? 'bg-green-500' : 'bg-gray-400'}"></span>
                                </div>
                                <div>
                                    <h2 class="text-2xl font-semibold text-gray-900">${user.display_name || user.username}</h2>
                                    <p class="text-gray-500 ${user.is_online ? 'text-green-500' : ''}">
                                        ${user.is_online ? 'Online' : `Last seen: ${new Date(user.last_seen).toLocaleString()}`}
                                    </p>
                                </div>
                            </div>
                            
                            <div class="border-t border-gray-200 pt-6">
                                <h3 class="text-lg font-medium text-gray-900 mb-4">Game Statistics</h3>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Games Played</p>
                                        <p class="text-2xl font-semibold text-gray-900">${stats.totalGames}</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Wins</p>
                                        <p class="text-2xl font-semibold text-gray-900">${stats.wins}</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Win Rate</p>
                                        <p class="text-2xl font-semibold text-gray-900">${stats.winRate}%</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mt-4">
                                <button onclick="window.location.href = '/friends'" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
                                    Back to Friends
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        container.innerHTML = `
            <div class="p-8 text-center">
                <p class="text-red-500">Error loading profile: ${error instanceof Error ? error.message : 'Unknown error'}</p>
                <button onclick="window.location.href = '/friends'" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
                    Back to Friends
                </button>
            </div>
        `;
    }
} 