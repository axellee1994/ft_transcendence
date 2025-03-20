import { FriendSearch } from '../components/FriendSearch';

export function renderFriendSearchPage(container: HTMLElement): void {
    container.innerHTML = `
        <div class="py-8">
            <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="bg-white rounded-lg shadow-xl p-8">
                    <div class="flex justify-between items-center mb-6">
                        <h1 class="text-3xl font-bold text-gray-900">Find Friends</h1>
                        <a href="#/friends" class="text-blue-500 hover:text-blue-700 flex items-center" id="back-to-friends-link">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                            </svg>
                            Back to Friends List
                        </a>
                    </div>
                    
                    <p class="text-gray-600 mb-6">Search for users by username to add them as friends.</p>
                    
                    <div id="friend-search-container" class="friend-search-container"></div>
                </div>
            </div>
        </div>
    `;

    const friendSearchContainer = document.getElementById('friend-search-container');
    if (friendSearchContainer) {
        new FriendSearch({
            container: friendSearchContainer,
            onViewProfile: (userId) => {
                window.location.href = `/profile/${userId}`;
            }
        });
    }
    
    // Add click handler for the back link
    const backLink = document.getElementById('back-to-friends-link');
    if (backLink) {
        backLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/friends';
        });
    }
} 