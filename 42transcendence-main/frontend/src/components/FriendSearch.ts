import { API_URL } from '../services/auth';

interface User {
    id: number;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_online: boolean;
    last_seen: string;
}

interface FriendshipStatus {
    status: string | null;
    direction: string | null;
}

interface FriendSearchProps {
    container: HTMLElement;
    onViewProfile?: (userId: number) => void;
}

// Helper function to get the full avatar URL
function getFullAvatarUrl(avatarUrl: string): string {
    if (!avatarUrl) return '';
    
    // If it's a backend path like /avatars/filename.jpg, prepend the API URL base
    if (avatarUrl.startsWith('/avatars/')) {
        const baseUrl = API_URL.substring(0, API_URL.indexOf('/api'));
        return `${baseUrl}${avatarUrl}`;
    }
    
    return avatarUrl;
}

export class FriendSearch {
    private searchResults: User[] = [];
    private friendshipStatuses: Map<number, FriendshipStatus> = new Map();
    private loading: boolean = false;
    private error: string | null = null;
    private searchQuery: string = '';
    private container: HTMLElement;

    constructor(private props: FriendSearchProps) {
        this.initialize();
    }

    private initialize(): void {
        this.render();
    }

    private render(): void {
        this.props.container.innerHTML = `
            <div class="friend-search">
                <div class="search-form mb-6">
                    <div class="relative">
                        <input 
                            type="text" 
                            id="search-input" 
                            placeholder="Search by username..." 
                            value="${this.searchQuery}"
                            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                        >
                        <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        <button id="search-button" 
                                class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-md ${this.loading ? 'opacity-50 cursor-not-allowed' : ''}"
                                ${this.loading ? 'disabled' : ''}>
                            ${this.loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </div>
                
                ${this.error ? `<div class="error bg-red-100 text-red-700 p-3 rounded-md mb-4">${this.error}</div>` : ''}
                
                <div class="search-results">
                    ${this.renderSearchResults()}
                </div>
            </div>
        `;

        this.addEventListeners();
    }

    private renderSearchResults(): string {
        if (this.loading) {
            return '<div class="loader flex justify-center items-center p-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>';
        }

        if (this.searchResults.length === 0 && this.searchQuery) {
            return '<div class="empty-state bg-gray-50 p-6 text-center text-gray-500 rounded-md">No users found. Try a different search term.</div>';
        }

        if (this.searchResults.length === 0) {
            return '<div class="empty-state bg-gray-50 p-6 text-center text-gray-500 rounded-md">Search for users to add them as friends.</div>';
        }

        return `
            <ul class="user-list divide-y divide-gray-200">
                ${this.searchResults.map(user => `
                    <li class="user-item p-4 flex items-center justify-between" data-user-id="${user.id}">
                        <div class="flex items-center space-x-3">
                            <div class="relative h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                ${user.avatar_url 
                                    ? `<img src="${getFullAvatarUrl(user.avatar_url)}" alt="${user.username}" class="h-10 w-10 rounded-full object-cover">`
                                    : `<span class="text-white font-medium">${user.username.charAt(0).toUpperCase()}</span>`
                                }
                                <span class="absolute bottom-0 right-0 h-3 w-3 rounded-full ${user.is_online ? 'bg-green-500' : 'bg-gray-400'}"></span>
                            </div>
                            <div>
                                <h4 class="font-medium text-gray-900">${user.display_name || user.username}</h4>
                                <p class="text-sm text-gray-500">@${user.username}</p>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            ${this.renderActionButton(user.id)}
                            <button class="view-profile bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 transition-colors text-sm" data-user-id="${user.id}">View Profile</button>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    private renderActionButton(userId: number): string {
        const status = this.friendshipStatuses.get(userId);
        
        if (!status || !status.status) {
            return `<button class="add-friend bg-green-100 text-green-600 px-3 py-1 rounded hover:bg-green-200 transition-colors text-sm" data-user-id="${userId}">Add Friend</button>`;
        }
        
        if (status.status === 'pending') {
            if (status.direction === 'outgoing') {
                return `<button class="pending-request bg-gray-100 text-gray-500 px-3 py-1 rounded cursor-not-allowed text-sm" disabled>Request Pending</button>`;
            } else {
                return `
                    <button class="accept-request bg-green-100 text-green-600 px-3 py-1 rounded hover:bg-green-200 transition-colors text-sm mr-2" data-user-id="${userId}">Accept</button>
                    <button class="reject-request bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition-colors text-sm" data-user-id="${userId}">Reject</button>
                `;
            }
        }
        
        if (status.status === 'accepted') {
            return `<button class="remove-friend bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition-colors text-sm" data-user-id="${userId}">Remove Friend</button>`;
        }
        
        return `<button class="add-friend bg-green-100 text-green-600 px-3 py-1 rounded hover:bg-green-200 transition-colors text-sm" data-user-id="${userId}">Add Friend</button>`;
    }

    private addEventListeners(): void {
        // Search button
        const searchButton = this.props.container.querySelector('#search-button');
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                this.performSearch();
            });
        }

        // Search input (search on enter)
        const searchInput = this.props.container.querySelector('#search-input');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e: KeyboardEvent) => {
                this.searchQuery = (e.target as HTMLInputElement).value;
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        // Add friend buttons
        const addFriendButtons = this.props.container.querySelectorAll('.add-friend');
        addFriendButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = (e.target as HTMLElement).dataset.userId;
                if (userId) {
                    await this.sendFriendRequest(parseInt(userId));
                }
            });
        });

        // Remove friend buttons
        const removeFriendButtons = this.props.container.querySelectorAll('.remove-friend');
        removeFriendButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = (e.target as HTMLElement).dataset.userId;
                if (userId) {
                    await this.removeFriend(parseInt(userId));
                }
            });
        });

        // Accept request buttons
        const acceptButtons = this.props.container.querySelectorAll('.accept-request');
        acceptButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = (e.target as HTMLElement).dataset.userId;
                if (userId) {
                    await this.acceptFriendRequest(parseInt(userId));
                }
            });
        });

        // Reject request buttons
        const rejectButtons = this.props.container.querySelectorAll('.reject-request');
        rejectButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = (e.target as HTMLElement).dataset.userId;
                if (userId) {
                    await this.rejectFriendRequest(parseInt(userId));
                }
            });
        });

        // View profile buttons
        const viewProfileButtons = this.props.container.querySelectorAll('.view-profile');
        viewProfileButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = parseInt((e.target as HTMLElement).dataset.userId || '0');
                if (userId && this.props.onViewProfile) {
                    this.props.onViewProfile(userId);
                }
            });
        });
    }

    private async performSearch(): Promise<void> {
        if (!this.searchQuery.trim()) {
            this.error = 'Please enter a search term';
            this.render();
            return;
        }

        this.loading = true;
        this.error = null;
        this.render();

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                this.error = 'You must be logged in to search for users';
                return;
            }

            // Get current user data to filter out from results
            const currentUserData = localStorage.getItem('user_data');
            const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
            
            // Make sure we have the correct API URL prefix
            const apiUrl = window.location.hostname === 'localhost' ? 
                `http://${window.location.hostname}:4002/api/users/search?query=${encodeURIComponent(this.searchQuery)}` : 
                `/api/users/search?query=${encodeURIComponent(this.searchQuery)}`;

            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to search for users');
            }

            const responseText = await response.text();
            
            if (responseText && responseText.trim()) {
                try {
                    let results = JSON.parse(responseText);
                    
                    // Filter out the current user from search results
                    if (currentUser && currentUser.id) {
                        results = results.filter((user: any) => user.id !== currentUser.id);
                    }
                    
                    this.searchResults = results;
                    
                    // Fetch friendship status for each user
                    await Promise.all(this.searchResults.map(async (user) => {
                        await this.fetchFriendshipStatus(user.id);
                    }));
                } catch (parseError) {
                    console.error("JSON parse error:", parseError, "Response:", responseText);
                    throw new Error('Invalid response from server');
                }
            } else {
                this.searchResults = [];
            }
            
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to search for users';
        } finally {
            this.loading = false;
            this.render();
        }
    }
    
    private async fetchFriendshipStatus(userId: number): Promise<void> {
        try {
            const token = localStorage.getItem('auth_token');
            
            // Make sure we have the correct API URL prefix
            const apiUrl = window.location.hostname === 'localhost' ? 
                `http://${window.location.hostname}:4002/api/users/${userId}/friendship` : 
                `/api/users/${userId}/friendship`;
            
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const responseText = await response.text();
                if (responseText && responseText.trim()) {
                    try {
                        const status = JSON.parse(responseText);
                        this.friendshipStatuses.set(userId, status);
                    } catch (error) {
                        console.error("Failed to parse friendship status:", error);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch friendship status:', err);
        }
    }

    private async sendFriendRequest(userId: number): Promise<void> {
        try {
            const token = localStorage.getItem('auth_token');
            
            // Make sure we have the correct API URL prefix
            const apiUrl = window.location.hostname === 'localhost' ? 
                `http://${window.location.hostname}:4002/api/friends/${userId}` : 
                `/api/friends/${userId}`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || 'Failed to send friend request');
            }

            // Update the friendship status in our map
            this.friendshipStatuses.set(userId, { status: 'pending', direction: 'outgoing' });
            this.render();
            alert('Friend request sent successfully!');
        } catch (err) {
            console.error('Failed to send friend request:', err);
            alert(`Failed to send friend request: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    private async removeFriend(userId: number): Promise<void> {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/friends/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to remove friend');
            }

            // Update the friendship status in our map
            this.friendshipStatuses.set(userId, { status: null, direction: null });
            this.render();
        } catch (err) {
            console.error('Failed to remove friend:', err);
            alert('Failed to remove friend. Please try again.');
        }
    }

    private async acceptFriendRequest(userId: number): Promise<void> {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/friends/${userId}/accept`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to accept friend request');
            }

            // Update the friendship status in our map
            this.friendshipStatuses.set(userId, { status: 'accepted', direction: 'incoming' });
            this.render();
        } catch (err) {
            console.error('Failed to accept friend request:', err);
            alert('Failed to accept friend request. Please try again.');
        }
    }

    private async rejectFriendRequest(userId: number): Promise<void> {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/friends/${userId}/reject`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to reject friend request');
            }

            // Update the friendship status in our map
            this.friendshipStatuses.set(userId, { status: null, direction: null });
            this.render();
        } catch (err) {
            console.error('Failed to reject friend request:', err);
            alert('Failed to reject friend request. Please try again.');
        }
    }
} 