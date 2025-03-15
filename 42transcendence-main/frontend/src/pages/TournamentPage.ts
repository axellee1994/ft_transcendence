/**
 * Renders the Tournament page
 */
export function renderTournamentPage(contentElement: HTMLElement): void {
    contentElement.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-8 max-w-4xl mx-auto mt-10">
            <h1 class="text-4xl font-bold text-center mb-6 text-gray-800">Tournaments</h1>
            
            <div class="mb-8">
                <div class="bg-blue-50 p-6 rounded-lg shadow-md mb-6">
                    <h2 class="text-2xl font-bold text-blue-800 mb-3">Active Tournament</h2>
                    <div class="bg-white p-4 rounded-lg border border-gray-200">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xl font-bold text-gray-800">Weekly Championship</h3>
                            <span class="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded">In Progress</span>
                        </div>
                        <p class="text-gray-600 mb-4">8 players competing for the weekly title. Tournament ends in 2 days.</p>
                        
                        <h4 class="font-semibold text-gray-700 mb-2">Current Matches:</h4>
                        <div class="space-y-2 mb-4">
                            <div class="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <span class="font-medium">Player1</span>
                                <div class="text-sm text-gray-500">vs</div>
                                <span class="font-medium">Player2</span>
                            </div>
                            <div class="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <span class="font-medium">Player3</span>
                                <div class="text-sm text-gray-500">vs</div>
                                <span class="font-medium">Player4</span>
                            </div>
                        </div>
                        
                        <div class="flex justify-center">
                            <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200">
                                View Bracket
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="bg-purple-50 p-6 rounded-lg shadow-md mb-6">
                    <h2 class="text-2xl font-bold text-purple-800 mb-3">Create Tournament</h2>
                    <form class="space-y-4">
                        <div>
                            <label for="tournament-name" class="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
                            <input type="text" id="tournament-name" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        
                        <div>
                            <label for="player-count" class="block text-sm font-medium text-gray-700 mb-1">Number of Players</label>
                            <select id="player-count" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="4">4 Players</option>
                                <option value="8">8 Players</option>
                                <option value="16">16 Players</option>
                            </select>
                        </div>
                        
                        <div>
                            <label for="tournament-type" class="block text-sm font-medium text-gray-700 mb-1">Tournament Type</label>
                            <select id="tournament-type" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="single">Single Elimination</option>
                                <option value="double">Double Elimination</option>
                                <option value="round">Round Robin</option>
                            </select>
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
                <div class="space-y-4">
                    <div class="bg-white p-4 rounded-lg border border-gray-200">
                        <div class="flex justify-between items-center">
                            <h3 class="font-bold text-gray-800">Weekend Challenge</h3>
                            <span class="bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded">Starting Soon</span>
                        </div>
                        <p class="text-gray-600 text-sm">Starts in 2 days - 16 players</p>
                    </div>
                    
                    <div class="bg-white p-4 rounded-lg border border-gray-200">
                        <div class="flex justify-between items-center">
                            <h3 class="font-bold text-gray-800">Monthly Championship</h3>
                            <span class="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">Registration Open</span>
                        </div>
                        <p class="text-gray-600 text-sm">Starts in 5 days - 32 players</p>
                    </div>
                </div>
            </div>
        </div>
    `;
} 