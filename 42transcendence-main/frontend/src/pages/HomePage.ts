export function renderHomePage(container: HTMLElement): void {
    container.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <nav class="bg-white shadow-md">
                <div class="container-game flex justify-between items-center py-4">
                    <h1 class="text-2xl font-bold text-gray-800">42 Transcendence</h1>
                    <div class="space-x-4">
                        <button onclick="navigate('/game')" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200">Play</button>
                        <button onclick="navigate('/leaderboard')" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-200">Leaderboard</button>
                        <button onclick="navigate('/profile')" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-200">Profile</button>
                        <button onclick="navigate('/settings')" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-200">Settings</button>
                    </div>
                </div>
            </nav>
            
            <div class="bg-white rounded-lg shadow-xl p-8 max-w-4xl mx-auto mt-10">
                <h1 class="text-4xl font-bold text-center mb-6 text-gray-800">Welcome to 42 Transcendence</h1>
                <p class="text-lg text-gray-600 text-center mb-8">Experience the classic Pong game in stunning 3D</p>
                
                <div class="flex flex-col md:flex-row justify-center items-center gap-8 mb-10">
                    <div class="bg-blue-50 p-6 rounded-lg shadow-md max-w-sm">
                        <h2 class="text-2xl font-bold text-blue-800 mb-3">Single View Mode</h2>
                        <p class="text-gray-700 mb-4">Classic pong game with a single view perspective.</p>
                        <button onclick="navigate('/game/single')" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200">
                            Play Single View
                        </button>
                    </div>
                    
                    <div class="bg-purple-50 p-6 rounded-lg shadow-md max-w-sm">
                        <h2 class="text-2xl font-bold text-purple-800 mb-3">Multi View Mode</h2>
                        <p class="text-gray-700 mb-4">Experience pong from multiple dynamic camera angles.</p>
                        <button onclick="navigate('/game/multi')" class="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition duration-200">
                            Play Multi View
                        </button>
                    </div>
                </div>
                
                <div class="bg-gray-50 p-6 rounded-lg shadow-md mb-8">
                    <h2 class="text-2xl font-bold text-gray-800 mb-3">How to Play</h2>
                    <p class="text-gray-700 mb-2">Pong is a simple game with simple rules:</p>
                    <ul class="list-disc list-inside text-gray-700 mb-4">
                        <li>Use your paddle to hit the ball</li>
                        <li>Don't let the ball pass your paddle</li>
                        <li>Score points when your opponent misses</li>
                        <li>First to reach the score limit wins</li>
                    </ul>
                    <button onclick="navigate('/about')" class="text-blue-500 hover:text-blue-700 font-medium">Learn more about the game</button>
                </div>
                
                <div class="text-center">
                    <h2 class="text-2xl font-bold text-gray-800 mb-3">Ready to Play?</h2>
                    <button onclick="navigate('/game/single')" class="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 text-lg">
                        Play Pong Now
                    </button>
                </div>
            </div>
        </div>
    `;
} 