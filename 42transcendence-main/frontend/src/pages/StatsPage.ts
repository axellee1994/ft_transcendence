import { AuthService, API_URL } from '../services/auth';

export function renderStatsPage(container: HTMLElement): void {    
    container.innerHTML = `
        <div class="py-8">
            <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="bg-white rounded-lg shadow-xl p-8">
                    <h1 class="text-3xl font-bold text-gray-900 mb-6">Player Statistics Dashboard</h1>
                    
                    <div class="flex flex-wrap justify-between items-center mb-6">
                        <div class="flex space-x-2 mb-4 md:mb-0">
                            <button id="personal-stats-btn" class="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium">My Stats</button>
                            <button id="game-history-btn" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition">Game History</button>
                        </div>
                    </div>
                    
                    <!-- Stats Dashboard Content -->
                    <div id="dashboard-content">
                        <!-- Personal Stats Section -->
                        <div id="personal-stats" class="space-y-8">
                            <!-- Stats Overview Cards -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div class="bg-purple-50 p-6 rounded-lg shadow">
                                    <h3 class="text-lg font-medium text-purple-800">Current Streak</h3>
                                    <p id="current-streak" class="text-4xl font-bold text-purple-900 mt-2">3</p>
                                    <p class="text-sm text-purple-600 mt-1">Consecutive wins</p>
                                </div>
                                <div class="bg-yellow-50 p-6 rounded-lg shadow">
                                    <h3 class="text-lg font-medium text-yellow-800">Best Streak</h3>
                                    <p id="best-streak" class="text-4xl font-bold text-yellow-900 mt-2">7</p>
                                    <p class="text-sm text-yellow-600 mt-1">Best winning streak</p>
                                </div>
                                <div class="bg-blue-50 p-6 rounded-lg shadow">
                                    <h3 class="text-lg font-medium text-blue-800">Avg Score</h3>
                                    <p id="avg-score" class="text-4xl font-bold text-blue-900 mt-2">8.5</p>
                                    <p class="text-sm text-blue-600 mt-1">Points per game</p>
                                </div>
                            </div>
                            
                            <!-- Game Type Distribution -->
                            <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
                                <h3 class="text-xl font-semibold text-gray-800 mb-4">Game Mode Comparison</h3>
                                <div class="space-y-6">
                                    <!-- Game type distribution -->
                                    <div>
                                        <div class="space-y-3">
                                            <div class="flex items-center">
                                                <span class="font-medium text-sm w-28">Single Player</span>
                                                <div class="w-2/3 bg-gray-200 rounded-full h-2.5 mx-4">
                                                    <div id="single-player-bar" class="bg-blue-600 h-2.5 rounded-full" style="width: 50%"></div>
                                                </div>
                                                <span id="single-player-count" class="text-sm w-12 text-right">50%</span>
                                            </div>
                                            <div class="flex items-center">
                                                <span class="font-medium text-sm w-28">Multiplayer</span>
                                                <div class="w-2/3 bg-gray-200 rounded-full h-2.5 mx-4">
                                                    <div id="multi-player-bar" class="bg-purple-600 h-2.5 rounded-full" style="width: 50%"></div>
                                                </div>
                                                <span id="multi-player-count" class="text-sm w-12 text-right">50%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Win/Loss Indicators -->
                            <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
                                <h3 class="text-xl font-semibold text-gray-800 mb-4">Recent Performance</h3>
                                <div id="recent-performance" class="flex justify-center space-x-2">
                                    <!-- Will be populated by JS -->
                                </div>
                            </div>
                        </div>
                        
                        <!-- Game History Section (Hidden by default) -->
                        <div id="game-history" class="hidden">
                            <div class="space-y-4">
                                <div class="flex justify-between mb-4">
                                    <h3 class="text-xl font-semibold text-gray-800">Match History</h3>
                                    <div>
                                        <select id="game-filter" class="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="all">All Games</option>
                                            <option value="single">Single Player</option>
                                            <option value="multi">Multiplayer</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div id="match-history-list" class="space-y-4">
                                    <!-- Game match cards generated by JS -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize the dashboard
    initializeStatsDashboard();
}

function initializeStatsDashboard() {
    // Tab switching functionality
    const personalStatsBtn = document.getElementById('personal-stats-btn');
    const gameHistoryBtn = document.getElementById('game-history-btn');
    
    const personalStats = document.getElementById('personal-stats');
    const gameHistory = document.getElementById('game-history');
    
    // Tab switching logic
    personalStatsBtn?.addEventListener('click', () => {
        if (!personalStatsBtn || !gameHistoryBtn || !personalStats || !gameHistory) return;

        personalStatsBtn.classList.remove('bg-gray-200', 'text-gray-800');
        personalStatsBtn.classList.add('bg-blue-500', 'text-white');
        
        gameHistoryBtn.classList.remove('bg-blue-500', 'text-white');
        gameHistoryBtn.classList.add('bg-gray-200', 'text-gray-800');
        
        personalStats.classList.remove('hidden');
        gameHistory.classList.add('hidden');
    });
    
    gameHistoryBtn?.addEventListener('click', () => {
        if (!personalStatsBtn || !gameHistoryBtn || !personalStats || !gameHistory) return;

        gameHistoryBtn.classList.remove('bg-gray-200', 'text-gray-800');
        gameHistoryBtn.classList.add('bg-blue-500', 'text-white');
        
        personalStatsBtn.classList.remove('bg-blue-500', 'text-white');
        personalStatsBtn.classList.add('bg-gray-200', 'text-gray-800');
        
        gameHistory.classList.remove('hidden');
        personalStats.classList.add('hidden');
        
        // Load game history data
        fetchGameHistory();
    });
    
    // Load the user's personal stats
    fetchPersonalStats();
}

async function fetchPersonalStats() {
    try {
        const authService = AuthService.getInstance();
        const token = authService.getToken();
        if (!token) {
            throw new Error('Authentication required');
        }
        
        // Fetch detailed stats from the API
        const statsResponse = await fetch(`${API_URL}/protected/match-history/stats`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        if (!statsResponse.ok) {
            throw new Error('Failed to fetch stats data');
        }
        
        const statsData = await statsResponse.json();
        
        // Fetch the most recent matches using the /filter endpoint
        const matchesResponse = await fetch(`${API_URL}/protected/match-history/filter?limit=10`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        if (!matchesResponse.ok) {
            throw new Error('Failed to fetch match history');
        }
        
        // Extract the matches array from the response object
        const matchesResponseData = await matchesResponse.json();
        const recentMatches = matchesResponseData.matches || []; // Use the .matches property, default to empty array
        
        // Calculate current streak
        let currentStreak = 0;
        for (const match of recentMatches) {
            if (match.result === 'win') {
                currentStreak++;
            } else {
                break;
            }
        }
        
        // Extract player and opponent scores from the matches
        const playerScores = recentMatches.map(match => match.player1_score);
        const opponentScores = recentMatches.map(match => match.player2_score);
        
        // Process data returned from userStatsSvc (statsData)
        const gamesPlayed = statsData.games_played || 0;
        const gamesWon = statsData.games_won || 0;
        const losses = gamesPlayed - gamesWon;
        const winRate = statsData.win_rate !== undefined ? statsData.win_rate : 0; // Use win_rate from backend
        
        // Create an object for the UI using the correct data fields
        const processedData = {
            wins: gamesWon, // Use gamesWon for UI
            losses: losses, // Use calculated losses
            winRate: winRate, // Use backend winRate
            currentStreak: currentStreak,
            bestStreak: 0, // Calculate this based on match history
            avgScore: calculateAverageScore(recentMatches),
            // Game mode comparison data is no longer available from this endpoint
            // We can simplify or remove this section in updatePersonalStatsUI
            singlePlayerGames: 0, // Placeholder or remove
            multiplayerGames: 0, // Placeholder or remove
            recentResults: recentMatches.map(match => match.result === 'win' ? 'W' : 'L'),
            playerScores: playerScores,
            opponentScores: opponentScores
        };
        
        // Calculate best streak from all matches (using recentMatches is likely incomplete for best overall streak)
        // TODO: Fetch full match history or adjust backend if best streak is crucial
        processedData.bestStreak = calculateBestStreak(recentMatches); 
        
        // Update the UI with the processed data, now including gameTypeCounts
        updatePersonalStatsUI(processedData, statsData.gameTypeCounts);
    } catch (error) {
        console.error('Error fetching personal stats:', error);
        
        // Fallback to mock data if the API fails
        const mockData = {
            wins: 22,
            losses: 16,
            winRate: 58,
            currentStreak: 3,
            bestStreak: 7,
            avgScore: 8.5,
            singlePlayerGames: 25,
            multiplayerGames: 13,
            recentResults: ['W', 'W', 'W', 'L', 'W', 'L', 'L', 'W', 'W', 'L'],
            playerScores: [7, 8, 10, 6, 9, 7, 5, 8, 10, 8],
            opponentScores: [5, 6, 4, 9, 7, 9, 7, 6, 3, 5]
        };
        
        updatePersonalStatsUI(mockData);
    }
}

// Helper function to calculate average score
function calculateAverageScore(matches) {
    if (!matches || matches.length === 0) return 0;
    
    const totalScore = matches.reduce((sum, match) => sum + match.player1_score, 0);
    return parseFloat((totalScore / matches.length).toFixed(1));
}

// Helper function to calculate best winning streak
function calculateBestStreak(matches) {
    if (!matches || matches.length === 0) return 0;
    
    let currentStreak = 0;
    let bestStreak = 0;
    
    for (const match of matches) {
        if (match.result === 'win') {
            currentStreak++;
            if (currentStreak > bestStreak) {
                bestStreak = currentStreak;
            }
        } else {
            currentStreak = 0;
        }
    }
    
    return bestStreak;
}

// Modify updatePersonalStatsUI to accept and use gameTypeCounts
function updatePersonalStatsUI(data: any, gameTypeCounts?: { single: number, multi: number, tournament: number }) {
    const singlePlayerBar = document.getElementById('single-player-bar');
    const singlePlayerCountEl = document.getElementById('single-player-count'); // Renamed variable
    const multiPlayerBar = document.getElementById('multi-player-bar');
    const multiPlayerCountEl = document.getElementById('multi-player-count'); // Renamed variable

    // Use gameTypeCounts if available
    if (gameTypeCounts && singlePlayerBar && singlePlayerCountEl && multiPlayerBar && multiPlayerCountEl) {
        const totalGames = gameTypeCounts.single + gameTypeCounts.multi + gameTypeCounts.tournament;
        const singlePercentage = totalGames > 0 ? (gameTypeCounts.single / totalGames) * 100 : 0;
        const multiPercentage = totalGames > 0 ? (gameTypeCounts.multi / totalGames) * 100 : 0;
        // Add tournament percentage if needed
        
        singlePlayerBar.style.width = `${singlePercentage.toFixed(0)}%`;
        singlePlayerCountEl.textContent = `${singlePercentage.toFixed(0)}%`; 
        multiPlayerBar.style.width = `${multiPercentage.toFixed(0)}%`;
        multiPlayerCountEl.textContent = `${multiPercentage.toFixed(0)}%`;
    } else if (singlePlayerBar && singlePlayerCountEl && multiPlayerBar && multiPlayerCountEl) {
        // Fallback if gameTypeCounts is missing (optional)
        singlePlayerBar.style.width = '0%';
        singlePlayerCountEl.textContent = 'N/A'; 
        multiPlayerBar.style.width = '0%';
        multiPlayerCountEl.textContent = 'N/A';
    }

    // Update recent performance indicators (using data.recentResults)
    const recentPerformanceDiv = document.getElementById('recent-performance');
    if (recentPerformanceDiv) {
        recentPerformanceDiv.innerHTML = data.recentResults.map(result => `
            <span class="w-6 h-6 rounded-full flex items-center justify-center ${result === 'W' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}">
                ${result}
            </span>
        `).join('');
    }

    // Update other stats like streaks and scores
    const currentStreakEl = document.getElementById('current-streak');
    const bestStreakEl = document.getElementById('best-streak');
    const avgScoreEl = document.getElementById('avg-score');
    if (currentStreakEl) currentStreakEl.textContent = data.currentStreak.toString();
    if (bestStreakEl) bestStreakEl.textContent = data.bestStreak.toString();
    if (avgScoreEl) avgScoreEl.textContent = data.avgScore.toString();

    // Note: We are not displaying wins/losses/winRate directly in the Overview Cards anymore in this example,
    // but they are available in the `data` object if needed elsewhere.
}

async function fetchGameHistory() {
    try {
        const matchHistoryList = document.getElementById('match-history-list');
        if (!matchHistoryList) return;
        
        // Show loading state
        matchHistoryList.innerHTML = '<div class="text-center text-gray-500 py-4">Loading match history...</div>';
        
        const authService = AuthService.getInstance();
        const token = authService.getToken();
        if (!token) {
            throw new Error('Authentication required');
        }
        
        // Fetch match history from the API - same endpoint as used in the Profile page
        const response = await fetch(`${API_URL}/protected/match-history`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch match history');
        }
        
        const matches = await response.json();
        
        // Format and display matches - consistent with Profile page formatting
        let matchesHTML = '';
        
        if (matches.length === 0) {
            matchesHTML = '<div class="text-center text-gray-500 py-4">No matches found</div>';
        } else {
            matches.forEach(match => {
                const resultClass = match.result === 'win' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                const gameTypeLabel = match.game_type === 'single' ? 'Single Player' : 'Multiplayer';
                const gameTypeClass = match.game_type === 'single' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
                
                // Format date
                const formattedDate = new Date(match.match_date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                matchesHTML += `
                    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div class="flex flex-wrap justify-between items-center">
                            <div class="flex items-center">
                                <div class="flex flex-col items-start justify-center">
                                    <span class="${gameTypeClass} text-xs px-2 py-1 rounded-full mb-1">${gameTypeLabel}</span>
                                    <p class="text-sm text-gray-500">${formattedDate}</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-3 mt-2 sm:mt-0">
                                <span class="font-medium">${match.player1_score}-${match.player2_score}</span>
                                <span class="${resultClass} text-xs px-2 py-1 rounded-full font-medium">${match.result === 'win' ? 'Victory' : 'Defeat'}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        matchHistoryList.innerHTML = matchesHTML;
        
        // Set up game filter functionality
        const gameFilter = document.getElementById('game-filter');
        gameFilter?.addEventListener('change', async (e) => {
            const target = e.target as HTMLSelectElement;
            const filterValue = target.value;
            
            // Show loading state
            matchHistoryList.innerHTML = '<div class="text-center text-gray-500 py-4">Loading filtered matches...</div>';
            
            // Use the correct endpoint for filtering
            let endpoint = `${API_URL}/protected/match-history`;
            
            if (filterValue === 'single' || filterValue === 'multi') {
                // The backend expects game_type parameter in the query
                endpoint = `${API_URL}/protected/match-history/filter?game_type=${filterValue}`;
            }
            
            // Fetch filtered match history
            const filteredResponse = await fetch(endpoint, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!filteredResponse.ok) {
                throw new Error('Failed to fetch filtered match history');
            }
            
            // Handle the different response format from the filter endpoint
            const responseData = await filteredResponse.json();
            // Check if the response is from the filter endpoint which returns {matches: [...]}
            const filteredMatches = responseData.matches || responseData;
            
            // Reuse the same format logic for filtered matches
            let filteredHTML = '';
            
            if (filteredMatches.length === 0) {
                filteredHTML = '<div class="text-center text-gray-500 py-4">No matches found for this filter</div>';
            } else {
                filteredMatches.forEach(match => {
                    const resultClass = match.result === 'win' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                    const gameTypeLabel = match.game_type === 'single' ? 'Single Player' : 'Multiplayer';
                    const gameTypeClass = match.game_type === 'single' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
                    
                    // Format date
                    const formattedDate = new Date(match.match_date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    
                    filteredHTML += `
                        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                            <div class="flex flex-wrap justify-between items-center">
                                <div class="flex items-center">
                                    <div class="flex flex-col items-start justify-center">
                                        <span class="${gameTypeClass} text-xs px-2 py-1 rounded-full mb-1">${gameTypeLabel}</span>
                                        <p class="text-sm text-gray-500">${formattedDate}</p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-3 mt-2 sm:mt-0">
                                    <span class="font-medium">${match.player1_score}-${match.player2_score}</span>
                                    <span class="${resultClass} text-xs px-2 py-1 rounded-full font-medium">${match.result === 'win' ? 'Victory' : 'Defeat'}</span>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
            
            matchHistoryList.innerHTML = filteredHTML;
        });
        
    } catch (error) {
        console.error('Error fetching game history:', error);
        
        const matchHistoryList = document.getElementById('match-history-list');
        if (matchHistoryList) {
            matchHistoryList.innerHTML = '<div class="text-center text-red-500 py-4">Failed to load match history</div>';
        }
    }
}

// Function to check if user is authenticated
function checkUserAuthentication(): boolean {
    const authService = AuthService.getInstance();
    return !!authService.getToken();
}

// Render content for users who aren't logged in
function renderLoginRequired(container: HTMLElement): void {
    container.innerHTML = `
        <div class="py-8">
            <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="bg-white rounded-lg shadow-xl p-8 text-center">
                    <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    <h1 class="text-2xl font-bold text-gray-800 mt-4">Login Required</h1>
                    <p class="text-gray-600 mt-2 mb-6">You need to be logged in to view your statistics.</p>
                    <div class="flex justify-center space-x-4">
                        <button id="login-redirect-btn" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition duration-200">
                            Login
                        </button>
                        <button id="signup-redirect-btn" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition duration-200">
                            Sign Up
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners for login/signup buttons
    const loginButton = document.getElementById('login-redirect-btn');
    const signupButton = document.getElementById('signup-redirect-btn');
    
    loginButton?.addEventListener('click', () => {
        window.location.href = '#/login';
    });
    
    signupButton?.addEventListener('click', () => {
        window.location.href = '#/signup';
    });
} 