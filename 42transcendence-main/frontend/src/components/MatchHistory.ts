import { API_URL, AuthService } from '../services/auth';

// Helper function to sanitize text to prevent XSS
function sanitizeText(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

interface MatchHistoryItem {
    id: number;
    result: 'win' | 'loss' | 'draw';
    match_date: string;
    player1_score: number;
    player2_score: number;
    game_type: 'single' | 'multi';
    opponent_username: string;
    opponent_display_name: string;
    opponent_avatar: string;
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

export async function renderMatchHistory(container: HTMLElement, userId?: number): Promise<void> {
    container.innerHTML = `
        <div class="bg-white rounded-lg shadow p-4 mb-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4">Match History</h3>
            <div id="match-history-loading" class="text-center py-4">
                <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p class="mt-2 text-gray-600">Loading match history...</p>
            </div>
            <div id="match-history-content" class="hidden space-y-3"></div>
            <div id="match-history-error" class="hidden text-center py-4 text-red-500"></div>
        </div>
    `;

    const loadingElement = document.getElementById('match-history-loading');
    const contentElement = document.getElementById('match-history-content');
    const errorElement = document.getElementById('match-history-error');

    try {
        // Get auth token from AuthService
        const authService = AuthService.getInstance();
        const token = authService.getToken();
        if (!token) {
            throw new Error('Authentication required to view match history');
        }

        // If no userId is provided, use the current user's ID
        let targetUserId = userId;
        
        if (!targetUserId) {
            // Try to get user from AuthService
            const user = authService.getCurrentUser();
            if (user) {
                targetUserId = user.id;
            }
            
            // If still no user ID, try getting it from the auth token payload
            if (!targetUserId && token) {
                try {
                    // JWT tokens are in format: header.payload.signature
                    const payload = token.split('.')[1];
                    // Decode base64
                    const decodedPayload = atob(payload);
                    const tokenData = JSON.parse(decodedPayload);
                    targetUserId = tokenData.id || tokenData.userId || tokenData.sub;
                } catch (e) {
                    console.error('Error extracting user ID from token:', e);
                }
            }
        }
        
        if (!targetUserId) {
            throw new Error('No user ID available. Please log in again.');
        }

        // Fetch match history from the API
        const response = await fetch(`${API_URL}/match-history${userId ? `?user_id=${userId}` : '?user_id=' + targetUserId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error fetching match history: ${response.status}`);
        }

        const matches: MatchHistoryItem[] = await response.json();

        if (loadingElement) loadingElement.classList.add('hidden');
        if (contentElement) {
            contentElement.classList.remove('hidden');
            
            if (matches.length === 0) {
                contentElement.innerHTML = `
                    <div class="text-center py-4 text-gray-500">
                        <p>No match history found. Play some games to see your results here!</p>
                    </div>
                `;
            } else {
                contentElement.innerHTML = matches.map(match => `
                    <div class="border-b border-gray-200 pb-3">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center space-x-2">
                                <span class="font-medium ${match.game_type === 'single' ? 'text-blue-600' : 'text-purple-600'}">
                                    ${match.game_type === 'single' ? 'Single Player' : 'Multiplayer'}
                                </span>
                                <span class="text-gray-500">•</span>
                                <span class="text-gray-600">
                                    ${formatDate(match.match_date)}
                                </span>
                            </div>
                            <div class="flex items-center space-x-3">
                                <span class="font-medium text-gray-800">
                                    ${match.player1_score} - ${match.player2_score}
                                </span>
                                <span class="font-semibold ${match.result === 'win' ? 'text-green-600' : match.result === 'loss' ? 'text-red-600' : 'text-gray-600'}">
                                    ${match.result.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error rendering match history:', error);
        if (loadingElement) loadingElement.classList.add('hidden');
        if (errorElement) {
            errorElement.classList.remove('hidden');
            errorElement.textContent = error instanceof Error ? error.message : 'An error occurred loading match history';
        }
    }
} 