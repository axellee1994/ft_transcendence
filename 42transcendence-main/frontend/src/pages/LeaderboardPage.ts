import { api, User } from '../services/api.js';

/**
 * Renders the Leaderboard page
 */
export function renderLeaderboardPage(contentElement: HTMLElement): void {
    // Initial render with loading state
    contentElement.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-8 max-w-4xl mx-auto mt-10">
            <h1 class="text-4xl font-bold text-center mb-6 text-gray-800">Leaderboard</h1>
            
            <!-- Leaderboard Filters -->
            <div class="flex flex-wrap justify-between items-center mb-6">
                <div class="flex space-x-2 mb-4 md:mb-0">
                    <button class="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium">All Time</button>
                    <button class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition">Monthly</button>
                    <button class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition">Weekly</button>
                </div>
                <div class="relative">
                    <input type="text" placeholder="Search players..." class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <div class="absolute left-3 top-2.5 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>
            
            <!-- Leaderboard Table -->
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="px-4 py-3 rounded-tl-lg">Rank</th>
                            <th class="px-4 py-3">Player</th>
                            <th class="px-4 py-3">Wins</th>
                            <th class="px-4 py-3">Losses</th>
                            <th class="px-4 py-3">Win Rate</th>
                            <th class="px-4 py-3 rounded-tr-lg">Points</th>
                        </tr>
                    </thead>
                    <tbody id="leaderboard-body">
                        <tr>
                            <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                                <div class="flex justify-center items-center">
                                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Loading players...
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination -->
            <div class="flex justify-between items-center mt-6">
                <div class="text-sm text-gray-600">
                    <span id="pagination-info">Loading...</span>
                </div>
                <div class="flex space-x-1">
                    <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition" disabled>Previous</button>
                    <button class="px-3 py-1 bg-blue-500 text-white rounded-md">1</button>
                    <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition">2</button>
                    <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition">3</button>
                    <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition">Next</button>
                </div>
            </div>
        </div>
    `;

    // Fetch users from API
    fetchUsers();

    async function fetchUsers() {
        try {
            const users = await api.getUsers();
            renderLeaderboard(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            const leaderboardBody = document.getElementById('leaderboard-body');
            if (leaderboardBody) {
                leaderboardBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-4 py-8 text-center text-red-500">
                            Failed to load leaderboard data. Please try again later.
                        </td>
                    </tr>
                `;
            }
        }
    }

    function renderLeaderboard(users: User[]) {
        const leaderboardBody = document.getElementById('leaderboard-body');
        const paginationInfo = document.getElementById('pagination-info');
        
        if (!leaderboardBody || !paginationInfo) return;
        
        if (users.length === 0) {
            leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                        No players found. Be the first to join!
                    </td>
                </tr>
            `;
            paginationInfo.textContent = 'No players found';
            return;
        }
        
        // Mock some game stats for each user
        const usersWithStats = users.map(user => {
            const wins = Math.floor(Math.random() * 50);
            const losses = Math.floor(Math.random() * 30);
            const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
            const points = wins * 20 + losses * 5;
            
            return {
                ...user,
                wins,
                losses,
                winRate,
                points
            };
        });
        
        // Sort by points (descending)
        usersWithStats.sort((a, b) => b.points - a.points);
        
        // Generate HTML for each user
        const userRows = usersWithStats.map((user, index) => {
            const rank = index + 1;
            const bgClass = rank === 1 ? 'bg-yellow-50' : rank === 2 ? 'bg-gray-50' : '';
            const initials = user.display_name.split(' ').map(n => n[0]).join('').toUpperCase();
            
            return `
                <tr class="border-b border-gray-200 ${bgClass}">
                    <td class="px-4 py-3 font-bold">${rank}</td>
                    <td class="px-4 py-3">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                                <span class="text-sm font-bold text-white">${initials}</span>
                            </div>
                            <div>
                                <div class="font-medium">${user.display_name}</div>
                                <div class="text-xs text-gray-500">@${user.username}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-green-600 font-medium">${user.wins}</td>
                    <td class="px-4 py-3 text-red-600 font-medium">${user.losses}</td>
                    <td class="px-4 py-3 font-medium">${user.winRate}%</td>
                    <td class="px-4 py-3 font-bold">${user.points}</td>
                </tr>
            `;
        }).join('');
        
        leaderboardBody.innerHTML = userRows;
        paginationInfo.textContent = `Showing 1 to ${users.length} of ${users.length} players`;
    }
} 