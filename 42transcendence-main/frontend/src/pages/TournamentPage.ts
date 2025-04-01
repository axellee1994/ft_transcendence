import { Tournament, TournamentParticipant, TournamentService } from '../services/tournament';
import { AuthService } from '../services/auth';
import { API_URL } from '../services/auth';

// Use the same default avatar SVG as in other components
const DEFAULT_AVATAR = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzY0OTVFRCIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik03MyA2OWMtMS44LTMuNC03LjktNS42LTExLjktNi43LTQtMS4yLTEuNS0yLjYtMi43LTIuNnMtMy4xLS4xLTguMy0uMS04LjQtLjYtOS42LS42LTMuMyAxLjctNC44IDMuM2MtMS41IDEuNi41IDEzLjIuNSAxMy4yczIuNS0uOSA1LjktLjlTNTMgNzQgNTMgNzRzMS0yLjIgMi45LTIuMiAzLjctLjIgMTAgMGM2LjQuMSAxLjEgNy41IDIuMiA3LjVzNC40LS4zIDUtLjNjMy45LTIuNCAwLTEwIDAtMTB6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTUwIDYxLjhjMTEuMSAwIDIwLjEtOS4xIDIwLjEtMjAuMyAwLTExLjItOS05LTIwLjEtOS4xLTExLjEgMC0yMC4xLTIuMS0yMC4xIDkuMXM5IDIwLjMgMjAuMSAyMC4zeiIvPjwvc3ZnPg==`;

// Helper function to get the full avatar URL
function getFullAvatarUrl(avatarUrl: string | undefined): string {
    if (!avatarUrl) return DEFAULT_AVATAR;
    
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

export function renderTournamentPage(container: HTMLElement): void {
    const authService = AuthService.getInstance();
    const tournamentService = TournamentService.getInstance();
    const currentUser = authService.getCurrentUser();

    // Container setup
    container.innerHTML = '';
    container.className = 'container mx-auto px-4 py-8';

    // Page header
    const header = document.createElement('div');
    header.className = 'mb-8';
    header.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Tournaments</h1>
        <p class="text-gray-600">Join tournaments and compete with other players!</p>
    `;
    container.appendChild(header);

    // Main content area 
    const content = document.createElement('div');
    content.className = 'bg-white rounded-lg shadow-md p-6';
    container.appendChild(content);

    // Function to render tournament list
    const renderTournaments = async () => {
        content.innerHTML = '<div class="text-center py-8"><div class="spinner"></div><p class="mt-4 text-gray-600">Loading tournaments...</p></div>';
        
        try {
            const tournaments = await tournamentService.getTournaments();
            
            if (tournaments.length === 0) {
                content.innerHTML = `
                    <div class="text-center py-8">
                        <p class="text-gray-600 mb-6">No tournaments available.</p>
                        <button id="create-tournament-btn" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors">
                            Create Tournament
                        </button>
                    </div>
                `;
                
                const createBtn = document.getElementById('create-tournament-btn');
                if (createBtn) {
                    createBtn.addEventListener('click', showCreateTournamentForm);
                }
                return;
            }
            
            // Render tournament list
            content.innerHTML = `
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-semibold text-gray-800">Available Tournaments</h2>
                    <button id="create-tournament-btn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition-colors">
                                Create Tournament
                            </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200" id="tournaments-list">
                            ${tournaments.map((tournament, index) => `
                                <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm font-medium text-gray-900">${tournament.name}</div>
                                        <div class="text-sm text-gray-500">${tournament.description || 'No description'}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900">Start: ${new Date(tournament.start_date).toLocaleDateString()}</div>
                                        <div class="text-sm text-gray-500">End: ${new Date(tournament.end_date).toLocaleDateString()}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${tournament.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                              tournament.status === 'active' ? 'bg-green-100 text-green-800' : 
                                              'bg-blue-100 text-blue-800'}">
                                            ${tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button data-id="${tournament.id}" class="view-tournament-btn text-blue-600 hover:text-blue-900 mr-3">
                                            View
                                        </button>
                                        <button data-id="${tournament.id}" class="join-tournament-btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs transition-colors">
                                            Join
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
        </div>
    `;

            // Add event listeners
            const createBtn = document.getElementById('create-tournament-btn');
            if (createBtn) {
                createBtn.addEventListener('click', showCreateTournamentForm);
            }
            
            document.querySelectorAll('.view-tournament-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tournamentId = (e.currentTarget as HTMLElement).dataset.id;
                    if (tournamentId) {
                        viewTournamentDetails(parseInt(tournamentId));
                    }
                });
            });
            
            document.querySelectorAll('.join-tournament-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const tournamentId = (e.currentTarget as HTMLElement).dataset.id;
                    if (tournamentId) {
                        try {
                            await tournamentService.joinTournament(parseInt(tournamentId));
                            alert('You have successfully joined the tournament!');
                            renderTournaments();
                        } catch (error: any) {
                            console.error('Error joining tournament:', error);
                            
                            // Check for already registered message
                            if (error.message && error.message.includes('already registered')) {
                                alert('You are already registered for this tournament.');
                            } else {
                                alert('Failed to join tournament. Please try again.');
                            }
                        }
                    }
                });
            });
            
        } catch (error) {
            console.error('Error loading tournaments:', error);
            content.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-500 mb-4">Failed to load tournaments</p>
                    <button id="retry-btn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
                        Retry
                    </button>
                </div>
            `;
            
            const retryBtn = document.getElementById('retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', renderTournaments);
            }
        }
    };

    // Function to show tournament details
    const viewTournamentDetails = async (tournamentId: number) => {
        content.innerHTML = '<div class="text-center py-8"><div class="spinner"></div><p class="mt-4 text-gray-600">Loading tournament details...</p></div>';
        
        try {
            // Always fetch fresh data from the server to ensure we have the latest user profiles
            const tournament = await tournamentService.getTournament(tournamentId);
            const participants = await tournamentService.getTournamentParticipants(tournamentId);
            
            content.innerHTML = `
                <div class="mb-4">
                    <button id="back-btn" class="text-blue-500 hover:text-blue-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                        </svg>
                        Back to Tournaments
                    </button>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-6 mb-8">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">${tournament.name}</h2>
                    <p class="text-gray-600 mb-4">${tournament.description || 'No description provided'}</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div class="bg-white p-4 rounded-md shadow-sm">
                            <h3 class="text-sm font-medium text-gray-500">Start Date</h3>
                            <p class="mt-1 text-lg font-semibold">${new Date(tournament.start_date).toLocaleDateString()}</p>
                        </div>
                        <div class="bg-white p-4 rounded-md shadow-sm">
                            <h3 class="text-sm font-medium text-gray-500">End Date</h3>
                            <p class="mt-1 text-lg font-semibold">${new Date(tournament.end_date).toLocaleDateString()}</p>
                        </div>
                        <div class="bg-white p-4 rounded-md shadow-sm">
                            <h3 class="text-sm font-medium text-gray-500">Status</h3>
                            <p class="mt-1">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${tournament.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                      tournament.status === 'active' ? 'bg-green-100 text-green-800' : 
                                      'bg-blue-100 text-blue-800'}">
                                    ${tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                                </span>
                            </p>
                        </div>
                    </div>
                    
                    <div class="flex justify-end">
                        <button id="join-tournament-detail-btn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors">
                            Join Tournament
                        </button>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Participants (${participants.length})</h3>
                    
                    ${participants.length === 0 ? 
                        '<p class="text-gray-500">No participants yet. Be the first to join!</p>' : 
                        `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            ${participants.map(participant => `
                                <div class="bg-gray-50 p-4 rounded-md flex items-center">
                                    <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                        ${participant.avatar_url ? 
                                            `<img src="${getFullAvatarUrl(participant.avatar_url)}?t=${new Date().getTime()}" alt="${participant.username}" class="h-10 w-10 rounded-full">` : 
                                            `<img src="${DEFAULT_AVATAR}" alt="${participant.username}" class="h-10 w-10 rounded-full">`
                                        }
                                    </div>
                                    <div>
                                        <p class="font-medium text-gray-800">${participant.display_name || participant.username || 'Unknown User'}</p>
                                        <p class="text-xs text-gray-500">${participant.status}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>`
                    }
                </div>
            `;
            
            // Add event listeners
            const backBtn = document.getElementById('back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', renderTournaments);
            }
            
            const joinBtn = document.getElementById('join-tournament-detail-btn');
            if (joinBtn) {
                joinBtn.addEventListener('click', async () => {
                    try {
                        await tournamentService.joinTournament(tournamentId);
                        alert('You have successfully joined the tournament!');
                        // Refresh the tournament details to show updated participant list
                        viewTournamentDetails(tournamentId);
                    } catch (error: any) {
                        console.error('Error joining tournament:', error);
                        
                        // Check for already registered message
                        if (error.message && error.message.includes('already registered')) {
                            alert('You are already registered for this tournament.');
                        } else {
                            alert('Failed to join tournament. Please try again.');
                        }
                    }
                });
            }
            
        } catch (error) {
            console.error('Error loading tournament details:', error);
            content.innerHTML = `
                <div class="mb-4">
                    <button id="back-btn" class="text-blue-500 hover:text-blue-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                        </svg>
                        Back to Tournaments
                    </button>
                </div>
                <div class="text-center py-8">
                    <p class="text-red-500 mb-4">Failed to load tournament details</p>
                </div>
            `;
            
            const backBtn = document.getElementById('back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', renderTournaments);
            }
        }
    };

    // Function to show create tournament form
    const showCreateTournamentForm = () => {
        content.innerHTML = `
            <div class="mb-4">
                <button id="back-btn" class="text-blue-500 hover:text-blue-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                    </svg>
                    Back to Tournaments
                </button>
            </div>
            
            <h2 class="text-xl font-semibold text-gray-800 mb-6">Create New Tournament</h2>
            
            <form id="create-tournament-form" class="space-y-6">
                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700">Tournament Name</label>
                    <input type="text" id="name" name="name" required
                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                </div>
                
                <div>
                    <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="description" name="description" rows="3"
                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="start_date" class="block text-sm font-medium text-gray-700">Start Date</label>
                        <input type="date" id="start_date" name="start_date" required
                            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    
                    <div>
                        <label for="end_date" class="block text-sm font-medium text-gray-700">End Date</label>
                        <input type="date" id="end_date" name="end_date" required
                            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    </div>
                </div>
                
                <div class="flex justify-end">
                    <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
                        Create Tournament
                    </button>
                </div>
            </form>
        `;
        
        // Set default dates
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        const startDateInput = document.getElementById('start_date') as HTMLInputElement;
        const endDateInput = document.getElementById('end_date') as HTMLInputElement;
        
        if (startDateInput && endDateInput) {
            startDateInput.value = today.toISOString().split('T')[0];
            endDateInput.value = nextWeek.toISOString().split('T')[0];
        }
        
        // Add event listeners
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', renderTournaments);
        }
        
        const form = document.getElementById('create-tournament-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(e.target as HTMLFormElement);
                
                // Get form values
                const name = formData.get('name') as string;
                const description = formData.get('description') as string;
                
                // Format dates to full ISO 8601 format that strictly follows date-time specification
                // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DDTHH:mm:ss.sss+HH:mm
                const startDateStr = formData.get('start_date') as string;
                const endDateStr = formData.get('end_date') as string;
                
                try {
                    // Start date at beginning of day (midnight)
                    const startDate = new Date(startDateStr);
                    startDate.setHours(0, 0, 0, 0);
                    
                    // End date at end of day
                    const endDate = new Date(endDateStr);
                    endDate.setHours(23, 59, 59, 999);
                    
                    // Create tournament data object with properly formatted dates
                    const tournamentData = {
                        name,
                        description,
                        // Using Z to indicate UTC timezone
                        start_date: startDate.toISOString(),
                        end_date: endDate.toISOString()
                    };
                    
                    console.log('Submitting tournament with data:', tournamentData);
                    
                    await tournamentService.createTournament(tournamentData);
            alert('Tournament created successfully!');
                    renderTournaments();
        } catch (error) {
            console.error('Error creating tournament:', error);
            alert('Failed to create tournament. Please try again.');
        }
            });
        }
    };

    // Initial render
    renderTournaments();
} 