import { Tournament, TournamentParticipant, TournamentService } from '../services/tournament';
import { AuthService } from '../services/auth';
import { API_URL } from '../services/auth';
import { TournamentBracket } from '../components/TournamentBracket';
import { DEFAULT_AVATAR } from './ProfilePage';
import { isValidFieldLen } from '../utils/validation';

function getFullAvatarUrl(avatarUrl: string | undefined): string {
    if (!avatarUrl) return DEFAULT_AVATAR;
    
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
        return avatarUrl;
    }
    
    if (avatarUrl.startsWith('/avatars/')) {
        const baseUrl = API_URL.substring(0, API_URL.indexOf('/api'));
        return `${baseUrl}${avatarUrl}`;
    }
    
    return avatarUrl;
}

export async function renderTournamentPage(container: HTMLElement /*, routeParams?: { [key: string]: string } */) {
    const authService = AuthService.getInstance();
    const tournamentService = TournamentService.getInstance();
    const currentUser = authService.getCurrentUser();
    
    container.innerHTML = '';
    container.className = 'container mx-auto px-4 py-8';

    const header = document.createElement('div');
    header.className = 'mb-8';
    header.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Tournaments</h1>
        <p class="text-gray-600">Join tournaments and compete with other players!</p>
    `;
    container.appendChild(header);

    const content = document.createElement('div');
    content.className = 'bg-white rounded-lg shadow-md p-6';
    container.appendChild(content);

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
                                        ${
                                        tournament.status === 'pending' ?
                                        `<button data-id="${tournament.id}" class="join-tournament-btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs transition-colors">
                                            Join
                                        </button>` : ''
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
        </div>
    `;

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
                            
                            if (error.message && error.message.includes('already registered')) {
                                alert('You are already registered for this tournament.');
                            }
                            else if (error.message && error.message.includes('max players')) 
                                alert('Max players for this tournament reached.') 
                            else {
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
        console.log(`--- viewTournamentDetails CALLED for ID: ${tournamentId} ---`);
        content.innerHTML = '<div class="text-center py-8"><div class="spinner"></div><p class="mt-4 text-gray-600">Loading tournament details...</p></div>';
        
        try {
            const tournament = await tournamentService.getTournament(tournamentId);
            const participants = await tournamentService.getTournamentParticipants(tournamentId);

            const tournament_matches = await tournamentService.getTournamentMatches(tournamentId);
            console.log("--- Matches fetched successfully ---", tournament_matches);

            console.log("Fetched tournament_matches data:", JSON.stringify(tournament_matches, null, 2));
            let nextMatch = null;
            const sortedMatches = tournament_matches.sort((a, b) => {
                if (a.round !== b.round) {
                    return a.round - b.round;
                }
                return a.match_order - b.match_order;
            });
            for (const match of sortedMatches)
            {
                if (match.player1_id && match.player1_id >= 1 && match.player2_id && match.player2_id >= 1 && !match.winner_id)
                {
                    nextMatch = match;
                    console.log("Found next match inside loop:", nextMatch);
                    break;
                }
            }
            console.log("Final nextMatch value after loop:", nextMatch);

            let nextMatchAnnouncementHTML = '';
            if (nextMatch) {
                const player1 = participants.find(p => p.id === nextMatch.player1_id);
                const player2 = participants.find(p => p.id === nextMatch.player2_id);
                if (player1 && player2)
                {
                    nextMatchAnnouncementHTML = `
                        <div class="mt-6 mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200 text-center">
                            <h3 class="text-lg font-semibold text-indigo-800 mb-2">Next Match</h3>
                            <p class="text-xl mb-4">
                                <span class="font-bold text-blue-600">${player1.display_name ? `${player1.username} (${player1.display_name})` : player1.username}</span>
                                <span class="text-gray-600 mx-2">vs</span>
                                <span class="font-bold text-green-600">${player2.display_name ? `${player2.username} (${player2.display_name})` : player2.username}</span>
                            </p>
                            <!-- Add Fight Button Here -->
                            <button id="fight-button" 
                                    data-match-id="${nextMatch.id}"
                                    data-tournament-id="${tournamentId}"
                                    class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200 text-lg">
                                Fight!
                            </button>
                        </div>
                    `;
                }
                else
                     console.error(`Could not find player details for next match ID ${nextMatch.id}`);
            }
            else
            {
                 console.log("No playable next match found.");
                 if (tournament.status === 'completed' || (tournament.status === 'active' && sortedMatches.length > 0)) { 
                     const winnerId = tournament.winner_id || sortedMatches.find(m => m.round === Math.max(...sortedMatches.map(match => match.round)))?.winner_id;
                     const winner = participants.find(p => p.id === winnerId);

                     nextMatchAnnouncementHTML = `
                        <div class="mt-6 mb-6 p-4 bg-green-100 rounded-lg border border-green-300 text-center">
                            <h3 class="text-lg font-semibold text-green-800">Tournament Complete!</h3>
                            ${winner ? `<p>Winner: <span class="font-bold">${winner.display_name ? `${winner.username} (${winner.display_name})`: winner.username}</span></p>` : '<p>Winner decided!</p>'}
                        </div>
                     `;
                 }
                 else
                     console.log(`Tournament status is ${tournament.status}, no next match found.`);
             }
            const bracket = new TournamentBracket(tournament_matches, participants);
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
                                      tournament.status === 'full' ? 'bg-blue-100 text-blue-800' : 
                                      'bg-gray-100 text-gray-800'}">
                                    ${tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                                </span>
                            </p>
                        </div>
                    </div>
                    
                    <div class="flex justify-end">
                    ${
                        tournament.status === 'pending' ? 
                        `<button id="join-tournament-detail-btn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors">
                            Join Tournament
                        </button>` : ''
                    }

                    ${ 
                        tournament.status === 'full' ?
                        `<button id="start-tournament-detail-btn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors">
                            Start Tournament
                        </button>` : ''
                    }
                    </div>
                </div>
                
                <!-- Inject Next Match Announcement & Button -->
                ${nextMatchAnnouncementHTML}

                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Participants (${participants.length})</h3>
                    
                    ${participants.length === 0 ? 
                        '<p class="text-gray-500">No participants yet. Be the first to join!</p>' : 
                        `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            ${participants.map(participant => {
                                console.log(`Rendering participant: ID=${participant.id}, Name=${participant.username}, AvatarURL=${participant.avatar_url}`);
                                const hasAvatar = !!participant.avatar_url;
                                let finalAvatarUrl;
                                if (hasAvatar)
                                {
                                    const avatarUrl = getFullAvatarUrl(participant.avatar_url);
                                    finalAvatarUrl = avatarUrl && !avatarUrl.startsWith('data:') ? `${avatarUrl}?t=${new Date().getTime()}` : avatarUrl;
                                }
                                else 
                                    finalAvatarUrl = DEFAULT_AVATAR;
                                const avatarContainerStyle = `style="background-image: url('${finalAvatarUrl}')"`;
                                const avatarContainerClasses = `h-10 w-10 rounded-full mr-3 bg-cover bg-center`;
                                return `
                                <div class="bg-gray-50 p-4 rounded-md flex items-center">
                                    <div class="${avatarContainerClasses}" ${avatarContainerStyle}>
                                    </div>
                                    <div>
                                        <p class="font-medium text-gray-800 overflow-hidden whitespace-nowrap text-ellipsis">${participant.display_name || participant.username || 'Unknown User'}</p>
                                        <p class="text-xs text-gray-500">${participant.status}</p>
                                    </div>
                                </div>
                            `}).join('')}
                        </div>`
                    }
                </div>

                <!--if (tournament started) display player matches-->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Player Matches</h3>
                    <div id="bracket-container"></div>
                </div>

            `;

            const container = document.getElementById('bracket-container');
            if (container) {
                bracket.renderBracket(container);
            }
            
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
                        viewTournamentDetails(tournamentId);
                    } catch (error: any) {
                        console.error('Error joining tournament:', error);
                        
                        if (error.message && error.message.includes('already registered')) {
                            alert('You are already registered for this tournament.');
                        }
                        else if (error.message && error.message.includes('max players')) 
                                alert('Max players for this tournament reached.') 
                        else {
                            alert('Failed to join tournament. Please try again.');
                        }
                    }
                });
            }

            const startBtn = document.getElementById('start-tournament-detail-btn');
            if (startBtn) {
                startBtn.addEventListener('click', async () => {

                    startBtn.setAttribute('disabled', 'true');
                    startBtn.textContent = 'Starting...';
                    startBtn.classList.add('opacity-50', 'cursor-not-allowed');

                    try
                    {
                        await tournamentService.startTournament(tournamentId);
                        await viewTournamentDetails(tournamentId); 
                    } catch (error: any)
                    {
                        alert(error);
                        startBtn.removeAttribute('disabled');
                        startBtn.textContent = 'Start Tournament';
                        startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    }
                });
            }


            const fightButton = document.getElementById('fight-button');
            if (fightButton) {
                fightButton.addEventListener('click', (e) => {
                    const target = e.currentTarget as HTMLButtonElement;
                    const matchId = target.dataset.matchId;
                    const tournId = target.dataset.tournamentId;
                    if (matchId && tournId && tournament)
                    {
 
                        const tournamentName = tournament.name || 'Tournament Match';
                        const encodedTitle = encodeURIComponent(tournamentName);
                        console.log(`Fight button clicked for match ${matchId} in tournament ${tournId}. Title: ${tournamentName}`);
                        
                        const gameUrl = `/game?mode=multi&tournament_match_id=${matchId}&tournament_id=${tournId}&title=${encodedTitle}`;

                        if (typeof (window as any).navigate === 'function')
                            (window as any).navigate(gameUrl);
                        else
                            window.location.href = gameUrl;
                    }
                    else
                        console.error("Missing matchId, tournamentId, or tournament data on fight button");
                });
            }

        }
        catch (error)
        {
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
                    <input type="text" id="name" name="name" required maxlength="50" minlength="1"
                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <p class="text-xs text-gray-500 mt-1">Min 1, Max 50 characters</p>
                </div>
                
                <div>
                    <label for="max_players" class="block text-sm font-medium text-gray-700">Max Players</label>
                    <select id="max_players" name="max_players" class="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    <option value="2">2</option>
                    <option value="4">4</option>
                    <option value="8">8</option>
                    </select>
                </div>

                <div>
                    <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="description" name="description" rows="3" maxlength="100"
                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
                        <p class="text-xs text-gray-500 mt-1">Max 100 characters</p>
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
        
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        const startDateInput = document.getElementById('start_date') as HTMLInputElement;
        const endDateInput = document.getElementById('end_date') as HTMLInputElement;
        
        if (startDateInput && endDateInput) {
            startDateInput.value = today.toISOString().split('T')[0];
            endDateInput.value = nextWeek.toISOString().split('T')[0];
        }
        
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', renderTournaments);
        }
        
        const form = document.getElementById('create-tournament-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(e.target as HTMLFormElement);
                
                let name = formData.get('name') as string;
                let description = formData.get('description') as string;
                
                const startDateStr = formData.get('start_date') as string;
                const endDateStr = formData.get('end_date') as string;
                const max_players = Number(formData.get('max_players')) as number;

                name = name.trim();
                description = description.trim();
                if(!isValidFieldLen(name, 1, 50))
                {
                    alert('Tournament name must be min 1, max 50 characters.');
                    return;
                }
                if(!isValidFieldLen(description, 0, 100))
                {
                    alert('Tournament description max 100 characters.');
                    return;
                }

                try {
                    const startDate = new Date(startDateStr);
                    const endDate = new Date(endDateStr);
                    const tournamentData = {
                        name,
                        description,
                        start_date: startDateStr,
                        end_date: endDateStr,
                        max_players: max_players
                    };
                    
                    console.log('Submitting tournament with data:', tournamentData);
                    
                    await tournamentService.createTournament(tournamentData);

            alert('Tournament created successfully!');
                    renderTournaments();
        } catch (error) {
            console.error('Error creating tournament:', error);
            alert(error || 'Failed to create tournament. Please try again.');
            
        }
            });
        }
    };


    const pathSegments = window.location.pathname.split('/');
    const possibleId = pathSegments.pop();
    const tournamentIdFromUrl = possibleId && /^[0-9]+$/.test(possibleId) ? parseInt(possibleId) : null;
    console.log(`renderTournamentPage: Detected ID from URL: ${tournamentIdFromUrl}`);
    if (tournamentIdFromUrl) 
        viewTournamentDetails(tournamentIdFromUrl);
    else 
        renderTournaments();
}