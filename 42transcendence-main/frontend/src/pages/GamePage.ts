import { Pong } from '../games/pong/Pong';
import { MultiViewPong } from '../games/pong/MultiViewPong';
import { ScoreUpdateCallback } from '../games/pong/createScene';
import { API_URL, AuthService } from '../services/auth';

let currentGame: Pong | MultiViewPong | null = null;
let gameStartTime: number | null = null;

function cleanupGame() {
    if (currentGame) {
        // Stop any ongoing game logic
        if ('dispose' in currentGame) {
            (currentGame as any).dispose();
        }
        // Clear the reference
        currentGame = null;
    }
    gameStartTime = null;

    // Remove any existing game over message
    const existingGameOverMsg = document.getElementById('game-over-msg');
    if (existingGameOverMsg) {
        existingGameOverMsg.remove();
    }
}

export function renderGamePage(container: HTMLElement): void {
    // Ensure cleanup of any existing game before creating a new one
    cleanupGame();

    // Parse query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const gameIdParam = urlParams.get('id');
    const gameMode = urlParams.get('mode') || 'single';
    const tournamentMatchId = urlParams.get('tournament_match_id');
    // Force single mode for tournament matches, otherwise use the requested mode
    const mode = tournamentMatchId ? 'single' : (gameMode === 'multi' ? 'multi' : 'single') as 'single' | 'multi';

    // Start tracking time when game starts
    gameStartTime = Date.now();

    container.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <div class="container-game py-8">
                <div class="bg-white rounded-lg shadow-xl p-6 max-w-4xl mx-auto">
                    <div class="text-center mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">${mode === 'single' ? 'Single View' : 'Multi View'} Mode</h2>
                        ${tournamentMatchId ? '<p class="text-gray-600 mt-1">Tournament Match</p>' : ''}
                    </div>
                    <div class="bg-gray-900 rounded-lg shadow-lg overflow-hidden">
                        <canvas id="renderCanvas" class="w-full aspect-video touch-none"></canvas>
                    </div>
                    <div class="mt-4 flex justify-center items-center">
                        <div class="text-gray-700 text-xl font-bold flex items-center gap-2">
                            <span id="player1-score" class="text-blue-600">0</span>
                            <span class="text-gray-600">-</span>
                            <span id="player2-score" class="text-green-600">0</span>
                        </div>
                    </div>
                    <div class="mt-4 flex justify-center">
                        <button id="endGameBtn" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition duration-200">
                            ${tournamentMatchId ? 'Back to Tournament' : 'End Game'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Set up end game button
    const endGameBtn = document.getElementById('endGameBtn');
    if (endGameBtn) {
        endGameBtn.addEventListener('click', () => {
            // Navigate based on context
            if (tournamentMatchId) {
                // Go back to tournament page
                if (typeof (window as any).navigate === 'function') {
                    (window as any).navigate('/tournaments');
                } else {
                    window.location.href = '/tournaments';
                }
            } else {
                // Go back to home page
                if (typeof (window as any).navigate === 'function') {
                    (window as any).navigate('/');
                } else {
                    window.location.href = '/';
                }
            }
        });
    }

    // Initialize the game with the appropriate mode
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    if (canvas) {
        const handleGameOver = (player1Score: number, player2Score: number) => {
            // Cleanup the game
            if (currentGame) {
                currentGame.dispose();
                currentGame = null;
            }

            // Show game over message
            const container = document.querySelector('.container-game');
            if (container) {
                const gameOverMsg = document.createElement('div');
                gameOverMsg.id = 'game-over-msg';
                gameOverMsg.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-75 text-white p-8 rounded-lg text-2xl z-50 text-center';
                
                // Create main message
                const winnerText = document.createElement('div');
                winnerText.className = player1Score > player2Score ? 'text-blue-400' : 'text-green-400';
                winnerText.textContent = `${player1Score > player2Score ? 'Player 1 (Blue)' : 'Player 2 (Green)'} Wins!`;
                gameOverMsg.appendChild(winnerText);
                
                // Create final score element
                const scoreText = document.createElement('div');
                scoreText.className = 'mt-2 text-xl';
                scoreText.innerHTML = `<span class="text-blue-400">${player1Score}</span> - <span class="text-green-400">${player2Score}</span>`;
                gameOverMsg.appendChild(scoreText);

                // Add authentication message if user is not logged in
                const authService = AuthService.getInstance();
                const token = authService.getToken();
                if (!token) {
                    const authMessage = document.createElement('div');
                    authMessage.className = 'mt-2 text-sm text-gray-400';
                    authMessage.textContent = 'Log in to save your game results!';
                    gameOverMsg.appendChild(authMessage);
                }
                
                // Create buttons container
                const buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'mt-6 flex justify-center gap-4';
                
                // Create play again button
                const playAgainButton = document.createElement('button');
                playAgainButton.className = 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200';
                playAgainButton.textContent = 'Play Again';
                playAgainButton.addEventListener('click', () => {
                    gameOverMsg.remove();
                    // Reload the page with the same mode
                    window.location.reload();
                });
                
                // Create exit button
                const exitButton = document.createElement('button');
                exitButton.className = 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-200';
                exitButton.textContent = tournamentMatchId ? 'Back to Tournament' : 'Exit Game';
                exitButton.addEventListener('click', () => {
                    gameOverMsg.remove();
                    // Navigate back based on context
                    if (tournamentMatchId) {
                        if (typeof (window as any).navigate === 'function') {
                            (window as any).navigate('/tournaments');
                        } else {
                            window.location.href = '/tournaments';
                        }
                    } else {
                        if (typeof (window as any).navigate === 'function') {
                            (window as any).navigate('/');
                        } else {
                            window.location.href = '/';
                        }
                    }
                });
                
                buttonsContainer.appendChild(playAgainButton);
                buttonsContainer.appendChild(exitButton);
                gameOverMsg.appendChild(buttonsContainer);
                
                container.appendChild(gameOverMsg);
            }
        };

        initializeGame(canvas, mode, gameIdParam, tournamentMatchId, handleGameOver);
        // Focus the canvas element so keyboard inputs work immediately
        canvas.focus();
        // Make canvas focusable
        canvas.tabIndex = 1;
    }
}

function initializeGame(canvas: HTMLCanvasElement, mode: 'single' | 'multi', gameId?: string | null, tournamentMatchId?: string | null, onGameOver?: (player1Score: number, player2Score: number) => void) {
    // Function to update the scoreboard and handle game completion
    const updateScoreboard: ScoreUpdateCallback = async (player1Score, player2Score, isGameOver) => {
        // Update the score display
        const player1ScoreElement = document.getElementById('player1-score');
        const player2ScoreElement = document.getElementById('player2-score');
        
        if (player1ScoreElement) {
            player1ScoreElement.textContent = `${player1Score}`;
        }
        
        if (player2ScoreElement) {
            player2ScoreElement.textContent = `${player2Score}`;
        }
        
        // If game is over, handle completion
        if (isGameOver) {
            if (onGameOver) {
                onGameOver(player1Score, player2Score);
            }
        }
    };

    if (mode === 'single') {
        currentGame = new Pong('renderCanvas', updateScoreboard);
    } else {
        currentGame = new MultiViewPong('renderCanvas', updateScoreboard);
    }
} 