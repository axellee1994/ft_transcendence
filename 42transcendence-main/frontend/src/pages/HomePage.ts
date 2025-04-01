export function renderHomePage(container: HTMLElement): void {
    container.innerHTML = `
        <div class="min-h-screen bg-gray-50">            
            <div class="bg-white rounded-lg shadow-xl p-8 max-w-4xl mx-auto mt-10">
                <h1 class="text-4xl font-bold text-center mb-6 text-gray-800">Welcome to 42 Transcendence</h1>
                <p class="text-lg text-gray-600 text-center mb-8">Experience the classic Pong game in stunning 3D</p>
                
                <div class="flex flex-col md:flex-row justify-center items-center gap-8 mb-10">
                    <div class="bg-blue-50 p-6 rounded-lg shadow-md max-w-sm w-full">
                        <h2 class="text-2xl font-bold text-blue-800 mb-3">Single View Mode</h2>
                        <p class="text-gray-700 mb-4">Classic pong game with a single view perspective.</p>
                        <button onclick="navigate('/game?mode=single')" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200">
                            Play Single View
                        </button>
                    </div>
                    
                    <div class="bg-purple-50 p-6 rounded-lg shadow-md max-w-sm w-full">
                        <h2 class="text-2xl font-bold text-purple-800 mb-3">Multi View Mode</h2>
                        <p class="text-gray-700 mb-4">Experience pong from multiple dynamic camera angles.</p>
                        <button onclick="navigate('/game?mode=multi')" class="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition duration-200">
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
                </div>

                <div class="bg-green-50 p-6 rounded-lg shadow-md">
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-2xl font-bold text-green-800 mb-3">Bonus Game</h2>
                            <p class="text-gray-700">Coming soon! An even better game!</p>
                        </div>
                        <button onclick="window.gameMode = 'bonus'; navigate('/bonus')" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded transition duration-200 cursor-not-allowed opacity-50">
                            Coming Soon
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
} 