/**
 * Renders the Game page
 */
export function renderGamePage(contentElement: HTMLElement): void {
    contentElement.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-8 max-w-4xl mx-auto mt-10">
            <h1 class="text-4xl font-bold text-center mb-6 text-gray-800">Pong Game</h1>
            
            <div class="mb-6">
                <div class="flex justify-between items-center mb-4">
                    <div class="text-xl font-bold text-blue-600">Player 1: <span id="player1-score">0</span></div>
                    <div class="text-xl font-bold text-purple-600">Player 2: <span id="player2-score">0</span></div>
                </div>
                
                <!-- Game Canvas -->
                <canvas id="renderCanvas" class="w-full h-96 border-2 border-gray-300 rounded-lg"></canvas>
                
                <div class="mt-4 text-center text-gray-600">
                    <p id="game-status">Press Start to begin the game</p>
                </div>
            </div>
            
            <div class="flex flex-wrap justify-center gap-4 mb-8">
                <button id="start-game" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded transition duration-200">
                    Start Game
                </button>
                <button id="pause-game" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded transition duration-200" disabled>
                    Pause
                </button>
                <button id="reset-game" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded transition duration-200" disabled>
                    Reset
                </button>
            </div>
            
            <div class="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-3">Game Controls</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-blue-600 mb-2">Player 1</h3>
                        <ul class="list-disc list-inside text-gray-700">
                            <li>W: Move paddle up</li>
                            <li>S: Move paddle down</li>
                        </ul>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-purple-600 mb-2">Player 2</h3>
                        <ul class="list-disc list-inside text-gray-700">
                            <li>↑: Move paddle up</li>
                            <li>↓: Move paddle down</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="text-center">
                <a href="/tournament" class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200">
                    Join Tournament
                </a>
            </div>
        </div>
    `;
    
    // Add event listeners for game buttons
    document.getElementById('start-game')?.addEventListener('click', () => {
        document.getElementById('game-status')!.textContent = 'Game started!';
        document.getElementById('start-game')!.setAttribute('disabled', 'true');
        document.getElementById('pause-game')!.removeAttribute('disabled');
        document.getElementById('reset-game')!.removeAttribute('disabled');
    });
    
    document.getElementById('pause-game')?.addEventListener('click', () => {
        const pauseButton = document.getElementById('pause-game')!;
        if (pauseButton.textContent === 'Pause') {
            pauseButton.textContent = 'Resume';
            document.getElementById('game-status')!.textContent = 'Game paused';
        } else {
            pauseButton.textContent = 'Pause';
            document.getElementById('game-status')!.textContent = 'Game resumed';
        }
    });
    
    document.getElementById('reset-game')?.addEventListener('click', () => {
        document.getElementById('game-status')!.textContent = 'Game reset';
        document.getElementById('player1-score')!.textContent = '0';
        document.getElementById('player2-score')!.textContent = '0';
        document.getElementById('start-game')!.removeAttribute('disabled');
        document.getElementById('pause-game')!.setAttribute('disabled', 'true');
        document.getElementById('reset-game')!.setAttribute('disabled', 'true');
        document.getElementById('pause-game')!.textContent = 'Pause';
    });
} 