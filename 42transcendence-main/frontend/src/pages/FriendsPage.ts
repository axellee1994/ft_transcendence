import { FriendList } from '../components/FriendList';

export function renderFriendsPage(container: HTMLElement): void {
    // Completely clear the container
    container.innerHTML = '';
    
    // Create a clean main container
    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'py-8';
    container.appendChild(pageWrapper);
    
    // Create card container
    const cardContainer = document.createElement('div');
    cardContainer.className = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';
    pageWrapper.appendChild(cardContainer);
    
    // Create the main content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'bg-white rounded-lg shadow-xl p-8';
    cardContainer.appendChild(contentWrapper);
    
    // Create header with title and Add Friend button
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-6';
    
    const title = document.createElement('h1');
    title.className = 'text-3xl font-bold text-gray-900';
    title.textContent = 'Friends';
    
    const addButton = document.createElement('a');
    addButton.href = '/friends/search';
    addButton.id = 'add-friend-button';
    addButton.className = 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center';
    
    const buttonIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    buttonIcon.setAttribute('class', 'w-4 h-4 mr-2');
    buttonIcon.setAttribute('fill', 'none');
    buttonIcon.setAttribute('stroke', 'currentColor');
    buttonIcon.setAttribute('viewBox', '0 0 24 24');
    
    const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    iconPath.setAttribute('stroke-linecap', 'round');
    iconPath.setAttribute('stroke-linejoin', 'round');
    iconPath.setAttribute('stroke-width', '2');
    iconPath.setAttribute('d', 'M12 4v16m8-8H4');
    
    buttonIcon.appendChild(iconPath);
    
    const buttonText = document.createTextNode('Add Friend');
    addButton.appendChild(buttonIcon);
    addButton.appendChild(buttonText);
    
    header.appendChild(title);
    header.appendChild(addButton);
    contentWrapper.appendChild(header);
    
    // Create friend list container
    const friendListContainer = document.createElement('div');
    friendListContainer.id = 'friend-list-container';
    contentWrapper.appendChild(friendListContainer);
    
    // Initialize friend list component
    new FriendList({
        container: friendListContainer,
        onViewProfile: (userId: number) => {
            window.location.href = `/profile/${userId}`;
        }
    });
} 