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
        const token = AuthService.getInstance().getToken();
        if (!token) return;
        
        const apiUrl = "/api/protected/friends";
        
        try {
            console.log("Fetching friends from:", apiUrl);
                        
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log("Friends API response status:", response.status, response.statusText);
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.error = 'Your session has expired. Please log in again.';
                    AuthService.getInstance().logout();
                    return;
                }
                throw new Error(`Failed to load friends (${response.status})`);
            }

            const responseText = await response.text();
            
            if (responseText && responseText.trim()) {
                try {
                    this.friends = JSON.parse(responseText);
                    console.log("Friends loaded:", this.friends.length);
                } catch (parseError) {
                    console.error("JSON parse error:", parseError, "Response:", responseText);
                    throw new Error('Invalid response from server');
                }
            } else {
                this.friends = [];
                console.log("No friends found (empty response)");
            }
        } catch (err) {
            console.error("Friends fetch error:", err);
            this.error = err instanceof Error ? err.message : 'Failed to load friends';
        }
    }

    private async fetchPendingRequests(): Promise<void> {
        const token = AuthService.getInstance().getToken();
        if (!token) return;
        
        const apiUrl = '/api/protected/friends/pending';

        try {
            console.log("Fetching pending requests from:", apiUrl);
                        
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    return;
                }
                throw new Error(`Failed to load pending requests (${response.status})`);
            }

            const responseText = await response.text();
            
            if (responseText && responseText.trim()) {
                try {
                    this.pendingRequests = JSON.parse(responseText);
                } catch (parseError) {
                    console.error("JSON parse error for pending requests:", parseError);
                    this.pendingRequests = [];
                }
            } else {
                this.pendingRequests = [];
            }
        } catch (err) {
            console.error("Failed to load pending requests:", err);
        } finally {
            this.loading = false;
        }
    }

    public render(): void {
        this.props.container.innerHTML = '';

        const container = document.createElement('div');
        container.className = 'friends-container w-full';

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

        if (this.error) {
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message p-4 bg-red-100 text-red-600 rounded-md';
            errorElement.textContent = this.error;
            
            container.appendChild(errorElement);
            this.props.container.appendChild(container);
            return;
        }

        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'tabs-container border-b mb-4';

        const tabsList = document.createElement('div');
        tabsList.className = 'flex';

        const friendsTab = document.createElement('button');
        friendsTab.className = `tab py-2 px-4 font-medium ${this.activeTab === 'friends' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`;
        friendsTab.dataset.tab = 'friends';
        
        const friendsTabText = document.createElement('span');
        friendsTabText.textContent = `Friends (${this.friends.length})`;
        friendsTab.appendChild(friendsTabText);

        const pendingTab = document.createElement('button');
        pendingTab.className = `tab py-2 px-4 font-medium ${this.activeTab === 'pending' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`;
        pendingTab.dataset.tab = 'pending';
        
        const pendingTabText = document.createElement('span');
        pendingTabText.textContent = `Pending Requests (${this.pendingRequests.length})`;
        pendingTab.appendChild(pendingTabText);

        tabsList.appendChild(friendsTab);
        tabsList.appendChild(pendingTab);
        tabsContainer.appendChild(tabsList);
        container.appendChild(tabsContainer);

        const contentContainer = document.createElement('div');
        contentContainer.className = 'tab-content';

        if (this.activeTab === 'friends') {
            contentContainer.appendChild(this.renderFriends());
        } else {
            contentContainer.appendChild(this.renderPendingRequests());
        }

        container.appendChild(contentContainer);
        this.props.container.appendChild(container);

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
            
            const userInfo = document.createElement('div');
            userInfo.className = 'flex items-center space-x-3';
            
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
            
            const statusIndicator = document.createElement('span');
            statusIndicator.className = `absolute bottom-0 right-0 h-3 w-3 rounded-full ${friend.is_online ? 'bg-green-500' : 'bg-gray-400'}`;
            avatarContainer.appendChild(statusIndicator);
            
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
            
            listItem.appendChild(userInfo);
            listItem.appendChild(actionButtons);
            
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
            
            const userInfo = document.createElement('div');
            userInfo.className = 'flex items-center space-x-3';
            
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
            
            listItem.appendChild(userInfo);
            listItem.appendChild(actionButtons);
            
            requestsList.appendChild(listItem);
        });
        
        contentElement.appendChild(requestsList);
        return contentElement;
    }

    private formatLastSeen(lastSeen: string): string {
        return formatRelativeTime(lastSeen);
    }

    private addEventListeners(): void {
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
                    buttonElement.textContent = 'Accepting...';
                    buttonElement.classList.add('opacity-50');
                    buttonElement.classList.add('pointer-events-none');
                    
                    await this.acceptRequest(parseInt(userId));
                }
            });
        });

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
                    buttonElement.textContent = 'Rejecting...';
                    buttonElement.classList.add('opacity-50');
                    buttonElement.classList.add('pointer-events-none');
                    
                    await this.rejectRequest(parseInt(userId));
                }
            });
        });
    }

    private async removeFriend(userId: number): Promise<void> {
        const token = AuthService.getInstance().getToken();
        if (!token) return;
        
        const apiUrl = `/api/protected/friends/${userId}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'DELETE', // Correct method
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to remove friend');
            }

            await this.refresh();
        } catch (err) {
            console.error("Failed to remove friend:", err);
            alert('Failed to remove friend');
        }
    }

    private async acceptRequest(userId: number): Promise<void> {
        const token = AuthService.getInstance().getToken();
        if (!token) return;
        
        const apiUrl = `/api/protected/friends/${userId}/accept`;

        try {
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            console.log('Accept response status:', response.status, response.statusText);
            
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
            console.error("Failed to accept friend request:", err);
            alert('Failed to accept friend request');
        }
    }

    private async rejectRequest(userId: number): Promise<void> {
        const token = AuthService.getInstance().getToken();
        if (!token) return;
        
        const apiUrl = `/api/protected/friends/${userId}/reject`;

        try {
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            console.log('Reject response status:', response.status, response.statusText);
            
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
            console.error("Failed to reject friend request:", err);
            alert('Failed to reject friend request');
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

    private getFullAvatarUrl(avatarUrl: string): string {
        if (!avatarUrl) return '';
        
        if (avatarUrl.startsWith('/avatars/')) {
            const baseUrl = API_URL.substring(0, API_URL.indexOf('/api'));
            return `${baseUrl}${avatarUrl}`;
        }
        
        return avatarUrl;
    }
}