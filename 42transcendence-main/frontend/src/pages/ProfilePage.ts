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

// Use the same default avatar SVG as in Navigation component
const DEFAULT_AVATAR = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzY0OTVFRCIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik03MyA2OWMtMS44LTMuNC03LjktNS42LTExLjktNi43LTQtMS4yLTEuNS0yLjYtMi43LTIuNnMtMy4xLS4xLTguMy0uMS04LjQtLjYtOS42LS42LTMuMyAxLjctNC44IDMuM2MtMS41IDEuNi41IDEzLjIuNSAxMy4yczIuNS0uOSA1LjktLjlTNTMgNzQgNTMgNzRzMS0yLjIgMi45LTIuMiAzLjctLjIgMTAgMGM2LjQuMSAxLjEgNy41IDIuMiA3LjVzNC40LS4zIDUtLjNjMy45LTIuNCAwLTEwIDAtMTB6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTUwIDYxLjhjMTEuMSAwIDIwLjEtOS4xIDIwLjEtMjAuMyAwLTExLjItOS05LTIwLjEtOS4xLTExLjEgMC0yMC4xLTIuMS0yMC4xIDkuMXM5IDIwLjMgMjAuMSAyMC4zeiIvPjwvc3ZnPg==`;

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

    // First render a loading state
    container.innerHTML = `
        <div class="py-8">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="bg-white rounded-lg shadow-xl p-8">
                    <h1 class="text-3xl font-bold text-gray-900 mb-8">Profile</h1>
                    <div class="text-center py-4">Loading statistics...</div>
                </div>
            </div>
        </div>
    `;

    // Then fetch the detailed stats
    fetchDetailedStats(container, currentUser);
}

async function fetchDetailedStats(container: HTMLElement, currentUser: any): Promise<void> {
    try {
        const authService = AuthService.getInstance();
        const token = authService.getToken();
        if (!token) {
            throw new Error('Authentication required');
        }
        
        // Fetch detailed stats using the correct protected path
        const userStatsResponse = await fetch(`${API_URL}/protected/user-stats/me`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        // Default stats in case API fails
        let detailedStats = { 
            games_played: 0, 
            games_won: 0, 
            win_rate: 0
        };
        
        // If we got detailed stats, use them
        if (userStatsResponse.ok) {
            const fetchedStats = await userStatsResponse.json();
            detailedStats = {
                ...detailedStats,
                ...fetchedStats
            };
        }
        
        // Fetch recent matches using the correct protected path
        const matchHistoryResponse = await fetch(`${API_URL}/protected/match-history`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        let recentMatches = [];
        if (matchHistoryResponse.ok) {
            recentMatches = await matchHistoryResponse.json();
            console.log("Recent matches:", recentMatches);
        }
        
        // Render the complete profile with stats
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
                                        : `<img src="${DEFAULT_AVATAR}" alt="${sanitizeText(currentUser.username)}" class="h-full w-full object-cover">`
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
                                        <p class="text-2xl font-semibold text-gray-900">${detailedStats.games_played}</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Wins</p>
                                        <p class="text-2xl font-semibold text-gray-900">${detailedStats.games_won}</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Win Rate</p>
                                        <p class="text-2xl font-semibold text-gray-900">${detailedStats.win_rate}%</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="border-t border-gray-200 pt-6">
                                <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Matches</h3>
                                <div class="space-y-3">
                                    ${recentMatches.length > 0 
                                        ? recentMatches.slice(0, 5).map(match => `
                                            <div class="bg-gray-50 p-4 rounded-lg">
                                                <div class="flex justify-between items-center">
                                                    <div class="flex items-center">
                                                        <span class="font-medium ${match.game_type === 'single' ? 'text-blue-600' : 'text-purple-600'} mr-2">
                                                            ${match.game_type === 'single' ? 'Single Player' : 'Multiplayer'}
                                                        </span>
                                                        <span class="text-gray-600">
                                                            ${match.game_type === 'single' ? 'vs AI' : `vs ${match.opponent_display_name || match.opponent_username || 'Opponent'}`}
                                                        </span>
                                                    </div>
                                                    <span class="font-semibold ${match.result === 'win' ? 'text-green-600' : match.result === 'loss' ? 'text-red-600' : 'text-gray-600'}">
                                                        ${match.result.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div class="mt-1 flex justify-between">
                                                    <span class="text-sm font-medium text-gray-800">
                                                        Score: ${match.player1_score} - ${match.player2_score}
                                                    </span>
                                                    <span class="text-xs text-gray-500">
                                                        ${formatDate(match.match_date)}
                                                    </span>
                                                </div>
                                            </div>
                                        `).join('')
                                        : `<div class="bg-gray-50 p-4 rounded-lg">
                                            <p class="text-gray-500">No recent matches</p>
                                        </div>`
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error fetching detailed stats:', error);
        
        // Render a basic profile if stats fetching fails
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
                                        : `<img src="${DEFAULT_AVATAR}" alt="${sanitizeText(currentUser.username)}" class="h-full w-full object-cover">`
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
        `;
    }
}

// Helper function to format dates in a readable way
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    // Add 8 hours to the timestamp
    date.setHours(date.getHours() + 8);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
        return `Today at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If within the last 7 days, show day name
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    if (date > oneWeekAgo) {
        return `${date.toLocaleDateString(undefined, { weekday: 'long' })} at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show full date
    return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function fetchUserProfile(container: HTMLElement, userId: number): Promise<void> {
    try {
        container.innerHTML = '<div class="p-8 text-center">Loading profile...</div>';
        
        const authService = AuthService.getInstance();
        const token = authService.getToken();
        if (!token) {
            throw new Error('Authentication required');
        }
        
        // CORRECTED PATH: Add /protected/
        const response = await fetch(`${API_URL}/protected/users/${userId}`, {
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
        
        // CORRECTED PATH: Add /protected/
        const statsResponse = await fetch(`${API_URL}/protected/users/${userId}/stats`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        // Get basic stats
        const basicStats = statsResponse.ok ? await statsResponse.json() : { wins: 0, losses: 0, winRate: 0, totalGames: 0 };
        
        // CORRECTED PATH: Add /protected/
        const matchHistoryResponse = await fetch(`${API_URL}/protected/match-history?user_id=${userId}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        let recentMatches = [];
        if (matchHistoryResponse.ok) {
            recentMatches = await matchHistoryResponse.json();
            console.log("User recent matches:", recentMatches);
        }
        
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
                                        : `<img src="${DEFAULT_AVATAR}" alt="${sanitizeText(user.username)}" class="h-full w-full object-cover">`
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
                                        <p class="text-2xl font-semibold text-gray-900">${basicStats.games_played || 0}</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Wins</p>
                                        <p class="text-2xl font-semibold text-gray-900">${basicStats.games_won || 0}</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Win Rate</p>
                                        <p class="text-2xl font-semibold text-gray-900">${basicStats.win_rate || 0}%</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="border-t border-gray-200 pt-6">
                                <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Matches</h3>
                                <div class="space-y-3">
                                    ${recentMatches.length > 0 
                                        ? recentMatches.slice(0, 5).map(match => `
                                            <div class="bg-gray-50 p-4 rounded-lg">
                                                <div class="flex justify-between items-center">
                                                    <div class="flex items-center">
                                                        <span class="font-medium ${match.game_type === 'single' ? 'text-blue-600' : 'text-purple-600'} mr-2">
                                                            ${match.game_type === 'single' ? 'Single Player' : 'Multiplayer'}
                                                        </span>
                                                        <span class="text-gray-600">
                                                            ${match.game_type === 'single' ? 'vs AI' : `vs ${match.opponent_display_name || match.opponent_username || 'Opponent'}`}
                                                        </span>
                                                    </div>
                                                    <span class="font-semibold ${match.result === 'win' ? 'text-green-600' : match.result === 'loss' ? 'text-red-600' : 'text-gray-600'}">
                                                        ${match.result.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div class="mt-1 flex justify-between">
                                                    <span class="text-sm font-medium text-gray-800">
                                                        Score: ${match.player1_score} - ${match.player2_score}
                                                    </span>
                                                    <span class="text-xs text-gray-500">
                                                        ${formatDate(match.match_date)}
                                                    </span>
                                                </div>
                                            </div>
                                        `).join('')
                                        : `<div class="bg-gray-50 p-4 rounded-lg">
                                            <p class="text-gray-500">No recent matches</p>
                                        </div>`
                                    }
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