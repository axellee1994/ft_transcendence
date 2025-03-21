import { AuthService, API_URL } from '../services/auth';
import { FriendList } from '../components/FriendList';
import { UserProfile } from '../components/UserProfile';
import { formatRelativeTime } from '../utils/dateUtils';

// Helper function to sanitize text to prevent XSS
function sanitizeText(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to get the full avatar URL
function getFullAvatarUrl(avatarUrl: string | undefined): string {
    if (!avatarUrl) return '';
    
    // If it's already a full URL, return it as is
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
        return avatarUrl;
    }
    
    // If it's a backend path like /avatars/filename.jpg, prepend the API URL base
    if (avatarUrl.startsWith('/avatars/')) {
        const baseUrl = API_URL.substring(0, API_URL.indexOf('/api'));
        return `${baseUrl}${avatarUrl}`;
    }
    
    return avatarUrl;
}

export function renderProfilePage(container: HTMLElement, userId?: number): void {
    // Input validation
    if (userId !== undefined && (!Number.isInteger(userId) || userId < 1)) {
        container.innerHTML = `
            <div class="p-8 text-center">
                <p class="text-red-500">Invalid user ID</p>
            </div>
        `;
        return;
    }

    const authService = AuthService.getInstance();
    
    if (userId) {
        fetchUserProfile(container, userId);
    } else {
        renderCurrentUserProfile(container);
    }
}

function renderCurrentUserProfile(container: HTMLElement): void {
    const authService = AuthService.getInstance();
    const currentUser = authService.getCurrentUser();

    if (!currentUser) {
        container.innerHTML = `
            <div class="p-8 text-center">
                <p class="text-red-500">Please log in to view your profile</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="py-8">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="bg-white rounded-lg shadow-xl p-8">
                    <h1 class="text-3xl font-bold text-gray-900 mb-8">Profile</h1>
                    
                    <div class="space-y-6">
                        <div class="flex items-center space-x-6">
                            <div class="h-24 w-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                ${currentUser.avatar_url 
                                    ? `<img src="${getFullAvatarUrl(currentUser.avatar_url)}" alt="${sanitizeText(currentUser.username)}" class="h-full w-full object-cover">`
                                    : `<div class="h-full w-full flex items-center justify-center bg-blue-500">
                                         <span class="text-4xl text-white font-medium">${sanitizeText(currentUser.username.charAt(0).toUpperCase() || 'U')}</span>
                                       </div>`
                                }
                            </div>
                            <div>
                                <h2 class="text-2xl font-semibold text-gray-900">${sanitizeText(currentUser.display_name || currentUser.username || 'User')}</h2>
                                <p class="text-gray-500">${sanitizeText(currentUser.email || 'No email provided')}</p>
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
        if (!token) {
            throw new Error('Authentication required');
        }
        
        // Use API_URL which should be configured for HTTPS in production
        const response = await fetch(`${API_URL}/users/${userId}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load user profile');
        }
        
        const user = await response.json();
        
        // Validate user object
        if (!user || typeof user !== 'object' || !user.username) {
            throw new Error('Invalid user data received');
        }
        
        // Also fetch user stats
        const statsResponse = await fetch(`${API_URL}/users/${userId}/stats`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
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
                                <div class="relative h-24 w-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                    ${user.avatar_url 
                                        ? `<img src="${getFullAvatarUrl(user.avatar_url)}" alt="${sanitizeText(user.username)}" class="h-full w-full object-cover">`
                                        : `<div class="h-full w-full flex items-center justify-center bg-blue-500">
                                             <span class="text-4xl text-white font-medium">${sanitizeText(user.username.charAt(0).toUpperCase())}</span>
                                           </div>`
                                    }
                                    <span class="absolute bottom-0 right-0 h-4 w-4 rounded-full ${user.is_online ? 'bg-green-500' : 'bg-gray-400'}"></span>
                                </div>
                                <div>
                                    <h2 class="text-2xl font-semibold text-gray-900">${sanitizeText(user.display_name || user.username)}</h2>
                                    <p class="text-gray-500 ${user.is_online ? 'text-green-500' : ''}">
                                        ${user.is_online ? 'Online' : `Last seen: ${formatRelativeTime(user.last_seen)}`}
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
                                <button id="back-to-friends-btn" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
                                    Back to Friends
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners for the back buttons
        document.getElementById('back-to-friends-btn')?.addEventListener('click', () => {
            if ((window as any).navigate) {
                (window as any).navigate('/friends');
            } else {
                window.location.href = '/friends';
            }
        });
        
    } catch (error) {
        container.innerHTML = `
            <div class="p-8 text-center">
                <p class="text-red-500">Error loading profile: ${error instanceof Error ? error.message : 'Unknown error'}</p>
                <button id="error-back-btn" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
                    Back to Friends
                </button>
            </div>
        `;
        
        // Add event listeners for the back buttons
        document.getElementById('error-back-btn')?.addEventListener('click', () => {
            if ((window as any).navigate) {
                (window as any).navigate('/friends');
            } else {
                window.location.href = '/friends';
            }
        });
    }
} 