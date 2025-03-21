import { AuthService, API_URL } from '../services/auth';
import { formatRelativeTime } from '../utils/dateUtils';

interface Friend {
    id: number;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_online: boolean;
    last_seen: string;
    friendship_date: string;
}

interface FriendListProps {
    container: HTMLElement;
    onViewProfile?: (userId: number) => void;
}

export class FriendList {
    private friends: Friend[] = [];
    private pendingRequests: Friend[] = [];
    private loading: boolean = true;
    private error: string | null = null;
    private activeTab: 'friends' | 'pending' = 'friends';
    private filteredFriends: Friend[] = [];
    private filterQuery: string = '';
    
    // Static instance for global access
    private static instance: FriendList | null = null;

    constructor(private props: FriendListProps) {
        FriendList.instance = this;
        this.initialize();
    }

    public static getInstance(): FriendList | null {
        return FriendList.instance;
    }

    private async initialize(): Promise<void> {
        await this.fetchFriends();
        await this.fetchPendingRequests();
        this.filteredFriends = [...this.friends];
        this.render();
    }

    public async refresh(): Promise<void> {
        this.loading = true;
        await this.fetchFriends();
        await this.fetchPendingRequests();
        this.render();
    }

    private async fetchFriends(): Promise<void> {
        try {
            const token = localStorage.getItem('auth_token');
            console.log("Using auth_token:", token ? token.substring(0, 10) + "..." : "not found");
            
            if (!token) {
                this.error = 'You must be logged in to view friends';
                this.loading = false;
                return;
            }

            // Make sure we have the correct API URL prefix
            const apiUrl = window.location.hostname === 'localhost' ? 
                        `http://${window.location.hostname}:4002/api/friends` : 
                        '/api/friends';
            
            console.log("Fetching friends from:", apiUrl);
                        
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log("Friends API response status:", response.status, response.statusText);
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.error = 'Your session has expired. Please log in again.';
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_data');
                    return;
                }
                throw new Error(`Failed to load friends (${response.status})`);
            }

            // Get response as text first to debug potential issues
            const responseText = await response.text();
            
            // Only try to parse if we have a non-empty response
            if (responseText && responseText.trim()) {
                try {
                    this.friends = JSON.parse(responseText);
                    console.log("Friends loaded:", this.friends.length);
                } catch (parseError) {
                    console.error("JSON parse error:", parseError, "Response:", responseText);
                    throw new Error('Invalid response from server');
                }
            } else {
                // Empty response is treated as empty array
                this.friends = [];
                console.log("No friends found (empty response)");
            }
        } catch (err) {
            console.error("Friends fetch error:", err);
            this.error = err instanceof Error ? err.message : 'Failed to load friends';
        }
    }

    private async fetchPendingRequests(): Promise<void> {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                return;
            }

            // Make sure we have the correct API URL prefix
            const apiUrl = window.location.hostname === 'localhost' ? 
                        `http://${window.location.hostname}:4002/api/friends/pending` : 
                        '/api/friends/pending';
            
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Don't show error for unauthorized on pending requests
                    return;
                }
                throw new Error(`Failed to load pending requests (${response.status})`);
            }

            // Get response as text first to debug potential issues
            const responseText = await response.text();
            
            // Only try to parse if we have a non-empty response
            if (responseText && responseText.trim()) {
                try {
                    this.pendingRequests = JSON.parse(responseText);
                } catch (parseError) {
                    console.error("JSON parse error for pending requests:", parseError);
                    this.pendingRequests = [];
                }
            } else {
                // Empty response is treated as empty array
                this.pendingRequests = [];
            }
        } catch (err) {
            console.error("Failed to load pending requests:", err);
            // Don't set error for pending requests, just log it
        } finally {
            this.loading = false;
        }
    }

    public render(): void {
        // Clear previous content
        this.props.container.innerHTML = '';

        // Create main container
        const container = document.createElement('div');
        container.className = 'friends-container w-full';

        // Handle loading state
        if (this.loading) {
            const loadingElement = document.createElement('div');
            loadingElement.className = 'loading-indicator flex justify-center items-center p-8';
            
            const spinner = document.createElement('div');
            spinner.className = 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500';
            
            loadingElement.appendChild(spinner);
            container.appendChild(loadingElement);
            this.props.container.appendChild(container);
            return;
        }

        // Handle error state
        if (this.error) {
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message p-4 bg-red-100 text-red-600 rounded-md';
            errorElement.textContent = this.error;
            
            container.appendChild(errorElement);
            this.props.container.appendChild(container);
            return;
        }

        // Create tabs container
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'tabs-container border-b mb-4';

        // Create tabs
        const tabsList = document.createElement('div');
        tabsList.className = 'flex';

        // Friends tab
        const friendsTab = document.createElement('button');
        friendsTab.className = `tab py-2 px-4 font-medium ${this.activeTab === 'friends' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`;
        friendsTab.dataset.tab = 'friends';
        
        const friendsTabText = document.createElement('span');
        friendsTabText.textContent = `Friends (${this.friends.length})`;
        friendsTab.appendChild(friendsTabText);

        // Pending Requests tab
        const pendingTab = document.createElement('button');
        pendingTab.className = `tab py-2 px-4 font-medium ${this.activeTab === 'pending' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`;
        pendingTab.dataset.tab = 'pending';
        
        const pendingTabText = document.createElement('span');
        pendingTabText.textContent = `Pending Requests (${this.pendingRequests.length})`;
        pendingTab.appendChild(pendingTabText);

        // Add tabs to container
        tabsList.appendChild(friendsTab);
        tabsList.appendChild(pendingTab);
        tabsContainer.appendChild(tabsList);
        container.appendChild(tabsContainer);

        // Create search filter - only show in friends tab
        if (this.activeTab === 'friends') {
            const filterContainer = document.createElement('div');
            filterContainer.className = 'filter-container mb-4';
            
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.className = 'filter-input w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
            searchInput.placeholder = 'Search friends...';
            searchInput.value = this.filterQuery || '';
            
            // Add event listener for input
            searchInput.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                this.filterFriends(target.value);
            });
            
            filterContainer.appendChild(searchInput);
            container.appendChild(filterContainer);
        }

        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'tab-content';

        // Set the content based on active tab
        if (this.activeTab === 'friends') {
            contentContainer.appendChild(this.renderFriends());
        } else {
            contentContainer.appendChild(this.renderPendingRequests());
        }

        container.appendChild(contentContainer);
        this.props.container.appendChild(container);

        // Add event listeners after rendering
        this.addEventListeners();
    }

    private renderFriends(): HTMLElement {
        const friendsToRender = this.filterQuery ? this.filteredFriends : this.friends;
        const contentElement = document.createElement('div');

        if (friendsToRender.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state p-4 text-center text-gray-500';
            emptyState.textContent = this.filterQuery 
                ? 'No friends match your search' 
                : 'No friends yet. Start adding friends!';
            contentElement.appendChild(emptyState);
            return contentElement;
        }

        const friendsList = document.createElement('ul');
        friendsList.className = 'friends-list divide-y divide-gray-200';
        
        friendsToRender.forEach(friend => {
            const listItem = document.createElement('li');
            listItem.className = 'friend-item p-4 flex items-center justify-between';
            listItem.dataset.userId = friend.id.toString();
            
            // User info section
            const userInfo = document.createElement('div');
            userInfo.className = 'flex items-center space-x-3';
            
            // Avatar container
            const avatarContainer = document.createElement('div');
            avatarContainer.className = 'relative h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center';
            
            if (friend.avatar_url) {
                avatarContainer.classList.add('has-avatar');
                const avatarImg = document.createElement('img');
                avatarImg.src = this.getFullAvatarUrl(friend.avatar_url);
                avatarImg.alt = friend.username;
                avatarImg.className = 'h-10 w-10 rounded-full object-cover';
                avatarContainer.appendChild(avatarImg);
            } else {
                const avatarInitial = document.createElement('span');
                avatarInitial.className = 'text-white font-medium';
                avatarInitial.textContent = friend.username.charAt(0).toUpperCase();
                avatarContainer.appendChild(avatarInitial);
            }
            
            // Online status indicator
            const statusIndicator = document.createElement('span');
            statusIndicator.className = `absolute bottom-0 right-0 h-3 w-3 rounded-full ${friend.is_online ? 'bg-green-500' : 'bg-gray-400'}`;
            avatarContainer.appendChild(statusIndicator);
            
            // User details
            const userDetails = document.createElement('div');
            
            const userName = document.createElement('h4');
            userName.className = 'font-medium text-gray-900';
            userName.textContent = friend.display_name || friend.username;
            
            const userStatus = document.createElement('p');
            userStatus.className = `text-sm text-gray-500 ${friend.is_online ? 'text-green-500' : ''}`;
            userStatus.textContent = friend.is_online ? 'Online' : `Last seen: ${this.formatLastSeen(friend.last_seen)}`;
            
            userDetails.appendChild(userName);
            userDetails.appendChild(userStatus);
            
            userInfo.appendChild(avatarContainer);
            userInfo.appendChild(userDetails);
            
            // Action buttons
            const actionButtons = document.createElement('div');
            actionButtons.className = 'flex space-x-2';
            
            const viewProfileButton = document.createElement('button');
            viewProfileButton.className = 'view-profile bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 transition-colors text-sm';
            viewProfileButton.dataset.userId = friend.id.toString();
            viewProfileButton.textContent = 'View Profile';
            
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-friend bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition-colors text-sm';
            removeButton.dataset.userId = friend.id.toString();
            removeButton.textContent = 'Remove';
            
            actionButtons.appendChild(viewProfileButton);
            actionButtons.appendChild(removeButton);
            
            // Assemble the list item
            listItem.appendChild(userInfo);
            listItem.appendChild(actionButtons);
            
            // Add to list
            friendsList.appendChild(listItem);
        });
        
        contentElement.appendChild(friendsList);
        return contentElement;
    }

    private renderPendingRequests(): HTMLElement {
        const contentElement = document.createElement('div');

        if (this.pendingRequests.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state p-4 text-center text-gray-500';
            emptyState.textContent = 'No pending friend requests.';
            contentElement.appendChild(emptyState);
            return contentElement;
        }

        const requestsList = document.createElement('ul');
        requestsList.className = 'pending-requests-list divide-y divide-gray-200';
        
        this.pendingRequests.forEach(request => {
            const listItem = document.createElement('li');
            listItem.className = 'pending-request-item p-4 flex items-center justify-between';
            listItem.dataset.userId = request.id.toString();
            
            // User info section
            const userInfo = document.createElement('div');
            userInfo.className = 'flex items-center space-x-3';
            
            // Avatar container
            const avatarContainer = document.createElement('div');
            avatarContainer.className = 'h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center';
            
            if (request.avatar_url) {
                avatarContainer.classList.add('has-avatar');
                const avatarImg = document.createElement('img');
                avatarImg.src = this.getFullAvatarUrl(request.avatar_url);
                avatarImg.alt = request.username;
                avatarImg.className = 'h-10 w-10 rounded-full object-cover';
                avatarContainer.appendChild(avatarImg);
            } else {
                const avatarInitial = document.createElement('span');
                avatarInitial.className = 'text-white font-medium';
                avatarInitial.textContent = request.username.charAt(0).toUpperCase();
                avatarContainer.appendChild(avatarInitial);
            }
            
            // User details
            const userDetails = document.createElement('div');
            
            const userName = document.createElement('h4');
            userName.className = 'font-medium text-gray-900';
            userName.textContent = request.display_name || request.username;
            
            const requestInfo = document.createElement('p');
            requestInfo.className = 'text-sm text-gray-500';
            requestInfo.textContent = 'Sent a friend request';
            
            userDetails.appendChild(userName);
            userDetails.appendChild(requestInfo);
            
            userInfo.appendChild(avatarContainer);
            userInfo.appendChild(userDetails);
            
            // Action buttons
            const actionButtons = document.createElement('div');
            actionButtons.className = 'flex space-x-2';
            
            const acceptButton = document.createElement('button');
            acceptButton.className = 'accept-request bg-green-100 text-green-600 px-3 py-1 rounded hover:bg-green-200 transition-colors text-sm';
            acceptButton.dataset.userId = request.id.toString();
            acceptButton.textContent = 'Accept';
            
            const rejectButton = document.createElement('button');
            rejectButton.className = 'reject-request bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition-colors text-sm';
            rejectButton.dataset.userId = request.id.toString();
            rejectButton.textContent = 'Reject';
            
            actionButtons.appendChild(acceptButton);
            actionButtons.appendChild(rejectButton);
            
            // Assemble the list item
            listItem.appendChild(userInfo);
            listItem.appendChild(actionButtons);
            
            // Add to list
            requestsList.appendChild(listItem);
        });
        
        contentElement.appendChild(requestsList);
        return contentElement;
    }

    private formatLastSeen(lastSeen: string): string {
        return formatRelativeTime(lastSeen);
    }

    private addEventListeners(): void {
        // Add tab click listeners
        const tabs = this.props.container.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabElement = e.currentTarget as HTMLElement;
                const tabName = tabElement.dataset.tab;
                if (tabName && (tabName === 'friends' || tabName === 'pending')) {
                    this.setActiveTab(tabName as 'friends' | 'pending');
                }
            });
        });

        // View profile buttons
        const viewProfileButtons = this.props.container.querySelectorAll('.view-profile');
        viewProfileButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const buttonElement = e.currentTarget as HTMLElement;
                const userId = buttonElement.dataset.userId;
                if (userId && this.props.onViewProfile) {
                    this.props.onViewProfile(parseInt(userId));
                }
            });
        });

        // Remove friend buttons
        const removeFriendButtons = this.props.container.querySelectorAll('.remove-friend');
        removeFriendButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const buttonElement = e.currentTarget as HTMLElement;
                const userId = buttonElement.dataset.userId;
                if (userId && confirm('Are you sure you want to remove this friend?')) {
                    await this.removeFriend(parseInt(userId));
                }
            });
        });

        // Accept request buttons - Make sure this works
        const acceptButtons = this.props.container.querySelectorAll('.accept-request');
        console.log('Found accept buttons:', acceptButtons.length);
        
        acceptButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const buttonElement = e.currentTarget as HTMLElement;
                console.log('Accept button clicked:', buttonElement);
                
                const userId = buttonElement.dataset.userId;
                console.log('User ID to accept:', userId);
                
                if (userId) {
                    // Show a visual indicator
                    buttonElement.textContent = 'Accepting...';
                    buttonElement.classList.add('opacity-50');
                    buttonElement.classList.add('pointer-events-none');
                    
                    await this.acceptFriendRequest(parseInt(userId));
                }
            });
        });

        // Reject request buttons - Make sure this works
        const rejectButtons = this.props.container.querySelectorAll('.reject-request');
        console.log('Found reject buttons:', rejectButtons.length);
        
        rejectButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const buttonElement = e.currentTarget as HTMLElement;
                console.log('Reject button clicked:', buttonElement);
                
                const userId = buttonElement.dataset.userId;
                console.log('User ID to reject:', userId);
                
                if (userId) {
                    // Show a visual indicator
                    buttonElement.textContent = 'Rejecting...';
                    buttonElement.classList.add('opacity-50');
                    buttonElement.classList.add('pointer-events-none');
                    
                    await this.rejectFriendRequest(parseInt(userId));
                }
            });
        });
    }

    private async removeFriend(userId: number): Promise<void> {
        try {
            const token = localStorage.getItem('auth_token');
            
            // Make sure we have the correct API URL prefix
            const apiUrl = window.location.hostname === 'localhost' ? 
                        `http://${window.location.hostname}:4002/api/friends/${userId}` : 
                        `/api/friends/${userId}`;
                        
            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to remove friend');
            }

            await this.refresh();
        } catch (err) {
            console.error('Failed to remove friend:', err);
            alert('Failed to remove friend. Please try again.');
        }
    }

    private async acceptFriendRequest(userId: number): Promise<void> {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                alert('You must be logged in to accept friend requests');
                return;
            }
            
            // Make sure we have the correct API URL prefix
            const apiUrl = window.location.hostname === 'localhost' ? 
                        `http://${window.location.hostname}:4002/api/friends/${userId}/accept` :
                        `/api/friends/${userId}/accept`;
            
            console.log('Accepting friend request, API URL:', apiUrl);
            console.log('Using token:', token.substring(0, 10) + "...");
                        
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                // Adding an empty object as body to satisfy the Content-Type requirement
                body: JSON.stringify({})
            });

            console.log('Accept response status:', response.status, response.statusText);
            
            // Try to read the response body
            let responseBody = null;
            try {
                const responseText = await response.text();
                if (responseText) {
                    responseBody = JSON.parse(responseText);
                }
            } catch (e) {
                console.log('Failed to parse response:', e);
            }
            
            console.log('Accept response body:', responseBody);

            if (!response.ok) {
                throw new Error(`Failed to accept friend request: ${response.status} ${response.statusText}`);
            }

            console.log('Friend request accepted successfully');
            await this.refresh();
        } catch (err) {
            console.error('Failed to accept friend request:', err);
            
            // Reset the button state for all accept buttons for this user
            const acceptButtons = this.props.container.querySelectorAll(`.accept-request[data-user-id="${userId}"]`);
            acceptButtons.forEach(button => {
                const buttonElement = button as HTMLElement;
                buttonElement.textContent = 'Accept';
                buttonElement.classList.remove('opacity-50');
                buttonElement.classList.remove('pointer-events-none');
            });
            
            alert(`Failed to accept friend request: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    private async rejectFriendRequest(userId: number): Promise<void> {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                alert('You must be logged in to reject friend requests');
                return;
            }
            
            // Make sure we have the correct API URL prefix
            const apiUrl = window.location.hostname === 'localhost' ? 
                        `http://${window.location.hostname}:4002/api/friends/${userId}/reject` :
                        `/api/friends/${userId}/reject`;
            
            console.log('Rejecting friend request, API URL:', apiUrl);
            console.log('Using token:', token.substring(0, 10) + "...");
                        
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                // Adding an empty object as body to satisfy the Content-Type requirement
                body: JSON.stringify({})
            });

            console.log('Reject response status:', response.status, response.statusText);
            
            // Try to read the response body
            let responseBody = null;
            try {
                const responseText = await response.text();
                if (responseText) {
                    responseBody = JSON.parse(responseText);
                }
            } catch (e) {
                console.log('Failed to parse response:', e);
            }
            
            console.log('Reject response body:', responseBody);

            if (!response.ok) {
                throw new Error(`Failed to reject friend request: ${response.status} ${response.statusText}`);
            }

            console.log('Friend request rejected successfully');
            await this.refresh();
        } catch (err) {
            console.error('Failed to reject friend request:', err);
            
            // Reset the button state for all reject buttons for this user
            const rejectButtons = this.props.container.querySelectorAll(`.reject-request[data-user-id="${userId}"]`);
            rejectButtons.forEach(button => {
                const buttonElement = button as HTMLElement;
                buttonElement.textContent = 'Reject';
                buttonElement.classList.remove('opacity-50');
                buttonElement.classList.remove('pointer-events-none');
            });
            
            alert(`Failed to reject friend request: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    public setActiveTab(tab: 'friends' | 'pending'): void {
        this.activeTab = tab;
        this.render();
    }

    public filterFriends(query: string): void {
        this.filterQuery = query;
        if (query) {
            this.filteredFriends = this.friends.filter(friend => 
                friend.username.toLowerCase().includes(query.toLowerCase()) || 
                (friend.display_name && friend.display_name.toLowerCase().includes(query.toLowerCase()))
            );
        } else {
            this.filteredFriends = [...this.friends];
        }
        this.render();
    }

    // Helper function to get the full avatar URL
    private getFullAvatarUrl(avatarUrl: string): string {
        if (!avatarUrl) return '';
        
        // If it's a backend path like /avatars/filename.jpg, prepend the API URL base
        if (avatarUrl.startsWith('/avatars/')) {
            const baseUrl = API_URL.substring(0, API_URL.indexOf('/api'));
            return `${baseUrl}${avatarUrl}`;
        }
        
        return avatarUrl;
    }
} 