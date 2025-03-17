import { api, Tournament } from '../services/api.js';

/**
 * Renders the Tournament page
 */
export function renderTournamentPage(contentElement: HTMLElement): void {
    // Initial render with loading state
    contentElement.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-8 max-w-4xl mx-auto mt-10">
            <h1 class="text-4xl font-bold text-center mb-6 text-gray-800">Tournaments</h1>
            
            <div class="mb-8">
                <div class="bg-blue-50 p-6 rounded-lg shadow-md mb-6">
                    <h2 class="text-2xl font-bold text-blue-800 mb-3">Active Tournaments</h2>
                    <div id="active-tournaments">
                        <div class="flex justify-center items-center py-8">
                            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading tournaments...
                        </div>
                    </div>
                </div>
                
                <div class="bg-purple-50 p-6 rounded-lg shadow-md mb-6">
                    <h2 class="text-2xl font-bold text-purple-800 mb-3">Create Tournament</h2>
                    <form id="create-tournament-form" class="space-y-4">
                        <div>
                            <label for="tournament-name" class="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
                            <input type="text" id="tournament-name" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                        </div>
                        
                        <div>
                            <label for="tournament-description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea id="tournament-description" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" rows="3" required></textarea>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="start-date" class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input type="date" id="start-date" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                            </div>
                            
                            <div>
                                <label for="end-date" class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input type="date" id="end-date" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                            </div>
                        </div>
                        
                        <div class="flex justify-center">
                            <button type="submit" class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-6 rounded transition duration-200">
                                Create Tournament
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="bg-gray-50 p-6 rounded-lg shadow-md">
                <h2 class="text-2xl font-bold text-gray-800 mb-3">Upcoming Tournaments</h2>
                <div id="upcoming-tournaments" class="space-y-4">
                    <div class="flex justify-center items-center py-8">
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading tournaments...
                    </div>
                </div>
            </div>
        </div>
    `;

    // Fetch tournaments from API
    fetchTournaments();

    // Add event listener for tournament creation form
    const createTournamentForm = document.getElementById('create-tournament-form') as HTMLFormElement;
    if (createTournamentForm) {
        createTournamentForm.addEventListener('submit', handleCreateTournament);
    }

    async function fetchTournaments() {
        try {
            const tournaments = await api.getTournaments();
            renderTournaments(tournaments);
        } catch (error) {
            console.error('Error fetching tournaments:', error);
            showErrorMessage('active-tournaments', 'Failed to load active tournaments. Please try again later.');
            showErrorMessage('upcoming-tournaments', 'Failed to load upcoming tournaments. Please try again later.');
        }
    }

    function renderTournaments(tournaments: Tournament[]) {
        const activeTournamentsEl = document.getElementById('active-tournaments');
        const upcomingTournamentsEl = document.getElementById('upcoming-tournaments');
        
        if (!activeTournamentsEl || !upcomingTournamentsEl) return;
        
        // Filter tournaments by status
        const activeTournaments = tournaments.filter(t => t.status === 'in_progress');
        const upcomingTournaments = tournaments.filter(t => t.status === 'pending');
        
        // Render active tournaments
        if (activeTournaments.length === 0) {
            activeTournamentsEl.innerHTML = `
                <div class="bg-white p-4 rounded-lg border border-gray-200 text-center text-gray-500">
                    No active tournaments at the moment.
                </div>
            `;
        } else {
            activeTournamentsEl.innerHTML = activeTournaments.map(tournament => `
                <div class="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-gray-800">${tournament.name}</h3>
                        <span class="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded">In Progress</span>
                    </div>
                    <p class="text-gray-600 mb-4">${tournament.description}</p>
                    <p class="text-sm text-gray-500 mb-4">
                        Started: ${formatDate(tournament.start_date)} • 
                        Ends: ${formatDate(tournament.end_date)}
                    </p>
                    
                    <div class="flex justify-center">
                        <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200" 
                                onclick="viewTournament(${tournament.id})">
                            View Details
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        // Render upcoming tournaments
        if (upcomingTournaments.length === 0) {
            upcomingTournamentsEl.innerHTML = `
                <div class="bg-white p-4 rounded-lg border border-gray-200 text-center text-gray-500">
                    No upcoming tournaments scheduled.
                </div>
            `;
        } else {
            upcomingTournamentsEl.innerHTML = upcomingTournaments.map(tournament => `
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <div class="flex justify-between items-center">
                        <h3 class="font-bold text-gray-800">${tournament.name}</h3>
                        <span class="bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded">Upcoming</span>
                    </div>
                    <p class="text-gray-600 text-sm">${tournament.description}</p>
                    <p class="text-xs text-gray-500 mt-2">
                        Starts: ${formatDate(tournament.start_date)} • 
                        Ends: ${formatDate(tournament.end_date)}
                    </p>
                    <div class="mt-3 flex justify-end">
                        <button class="text-blue-500 hover:text-blue-700 text-sm font-medium" 
                                onclick="registerForTournament(${tournament.id})">
                            Register
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        // Add global functions for the onclick handlers
        window.viewTournament = viewTournament;
        window.registerForTournament = registerForTournament;
    }

    async function handleCreateTournament(event: Event) {
        event.preventDefault();
        
        const nameInput = document.getElementById('tournament-name') as HTMLInputElement;
        const descriptionInput = document.getElementById('tournament-description') as HTMLTextAreaElement;
        const startDateInput = document.getElementById('start-date') as HTMLInputElement;
        const endDateInput = document.getElementById('end-date') as HTMLInputElement;
        
        const tournamentData = {
            name: nameInput.value,
            description: descriptionInput.value,
            start_date: startDateInput.value,
            end_date: endDateInput.value
        };
        
        try {
            const newTournament = await api.createTournament(tournamentData);
            console.log('Tournament created:', newTournament);
            
            // Reset form
            createTournamentForm.reset();
            
            // Refresh tournaments list
            fetchTournaments();
            
            // Show success message
            alert('Tournament created successfully!');
        } catch (error) {
            console.error('Error creating tournament:', error);
            alert('Failed to create tournament. Please try again.');
        }
    }

    function showErrorMessage(elementId: string, message: string) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="bg-white p-4 rounded-lg border border-gray-200 text-center text-red-500">
                    ${message}
                </div>
            `;
        }
    }

    function formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    function viewTournament(tournamentId: number) {
        console.log(`View tournament ${tournamentId}`);
        // TODO: Implement tournament details view
        alert(`Viewing tournament ${tournamentId} - Feature coming soon!`);
    }

    async function registerForTournament(tournamentId: number) {
        console.log(`Register for tournament ${tournamentId}`);
        
        // For demo purposes, we'll use user ID 1
        // In a real app, you'd get the current user's ID from authentication
        const userId = 1;
        
        try {
            const result = await api.registerForTournament(tournamentId, userId);
            console.log('Registration result:', result);
            alert(`Successfully registered for tournament ${tournamentId}!`);
        } catch (error) {
            console.error('Error registering for tournament:', error);
            alert('Failed to register for tournament. Please try again.');
        }
    }
}

// Add these to the global Window interface
declare global {
    interface Window {
        viewTournament: (tournamentId: number) => void;
        registerForTournament: (tournamentId: number) => void;
    }
} 