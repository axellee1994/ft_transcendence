import { Pong } from '../games/pong/Pong';
import { MultiViewPong } from '../games/pong/MultiViewPong';
import { ScoreUpdateCallback } from '../games/pong/createScene';
import { API_URL, AuthService } from '../services/auth';

const STORAGE_KEY_PREFIX = 'interruptedGame';
const PAUSE_STORAGE_KEY = 'pongGamePaused';

interface IPausableGame {
    dispose: () => void;
    getScores?: () => { player1Score: number, player2Score: number, isGameOver: boolean };
    isCurrentlyPaused?: () => boolean;
}

let currentGame: IPausableGame | null = null;
let gameMode: 'single' | 'multi' | 'tournament' = 'single';
let gameContextId: string | null = null;
let gameStartTime: number | null = null;
let navigationListenerAttached = false;

function getStorageKey(): string {
    return `${STORAGE_KEY_PREFIX}-${gameMode}-${gameContextId || 'default'}`;
}

function saveGameState() {
    if (currentGame && typeof currentGame.getScores === 'function') {
        const scores = currentGame.getScores();
        if (scores && typeof scores.player1Score !== 'undefined' && typeof scores.player2Score !== 'undefined') {
            const state = {
                p1: scores.player1Score,
                p2: scores.player2Score,
                mode: gameMode,
            };
            try {
                localStorage.setItem(getStorageKey(), JSON.stringify(state));
                console.log('[GamePage] Saved interrupted game state:', state);
            } catch (e) {
                console.error("[GamePage] Failed to save game state to localStorage", e);
            }
        } else {
             console.warn("[GamePage] Attempted to save game state, but scores were undefined.");
        }
    } else {
        console.warn("[GamePage] Attempted to save game state, but currentGame or getScores is missing.");
    }
}

function clearGameState() {
    const key = getStorageKey();
    try {
       localStorage.removeItem(key);
       console.log('[GamePage] Cleared interrupted game state for key:', key);
    } catch (e) {
       console.error("[GamePage] Failed to clear game state from localStorage for key:", key, e);
    }
}

function cleanupGame(triggeredByNavigationAway = false) {
    removeNavigationListener();

    if (currentGame) {
        if (triggeredByNavigationAway) {
            if (typeof currentGame.isCurrentlyPaused === 'function') {
                if (!currentGame.isCurrentlyPaused()) {
                    console.log('[GamePage] Navigating away: Game was running, saving pause state.');
                    sessionStorage.setItem(PAUSE_STORAGE_KEY, 'true');
                } else {
                    console.log('[GamePage] Navigating away: Game was already paused.');
                }
            } else {
                console.warn('[GamePage] Navigating away, cannot check pause state.');
            }
            saveGameState();
            console.log('[GamePage] Navigating away: Saved scores to localStorage.');
        } else {
            clearGameState();
            console.log('[GamePage] Cleanup (not navigation): Cleared scores from localStorage.');
        }

        if ('dispose' in currentGame) {
            currentGame.dispose();
        }

        currentGame = null;
    }
    gameStartTime = null;

    const existingGameOverMsg = document.getElementById('game-over-msg');
    if (existingGameOverMsg) {
        existingGameOverMsg.remove();
    }
}

const handleNavigationAway = (event?: PopStateEvent) => {
    const isStillGamePage = window.location.pathname.startsWith('/game');

    if (!isStillGamePage && currentGame) {
        console.log('[GamePage] Popstate/Navigation detected away from game page.');
        cleanupGame(true);
    }
};

const setupNavigationListener = () => {
    if (!navigationListenerAttached) {
        window.addEventListener('popstate', handleNavigationAway);
        navigationListenerAttached = true;
        console.log('[GamePage] Navigation listener attached (popstate).');
    }
};

const removeNavigationListener = () => {
     if (navigationListenerAttached) {
        window.removeEventListener('popstate', handleNavigationAway);
        navigationListenerAttached = false;
        console.log('[GamePage] Navigation listener removed.');
     }
};

export function renderGamePage(container: HTMLElement): void {
    const urlParams = new URLSearchParams(window.location.search);
    gameMode = (urlParams.get('mode') || 'single') as 'single' | 'multi' | 'tournament';
    const tournamentIdParam = urlParams.get('tournament_id');
    gameContextId = tournamentIdParam ? parseInt(tournamentIdParam).toString() : null;
    const gameIdParam = urlParams.get('id');
    const gameTitle = urlParams.get('title') || 'Pong Game';
    const tournamentMatchId = Number(urlParams.get('tournament_match_id')) as number;
    const displayTitle = decodeURIComponent(gameTitle);

    cleanupGame(false);

    container.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <div class="container-game py-8">
                <div class="bg-white rounded-lg shadow-xl p-6 max-w-4xl mx-auto">
                    <div class="text-center mb-6">
                        <h1 class="text-3xl font-bold text-gray-900 mb-2">${displayTitle}</h1>
                        <h2 class="text-xl font-semibold text-gray-700">${gameMode === 'single' ? 'Single View' : 'Multi View'} Mode</h2>
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

    const endGameBtn = document.getElementById('endGameBtn');
    if (endGameBtn) {
        endGameBtn.addEventListener('click', () => {
            const targetPath = tournamentMatchId ? '/tournaments' : '/';
            if (typeof (window as any).navigate === 'function') {
                (window as any).navigate(targetPath);
            } else {
                window.location.href = targetPath;
            }
        });
    }

    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    if (canvas) {
        const handleGameOver = (player1Score: number, player2Score: number) => {
             removeNavigationListener();
            if (currentGame) {
                currentGame.dispose();
                currentGame = null;
            }

            const container = document.querySelector('.container-game');
            if (container) {
                const gameOverMsg = document.createElement('div');
                gameOverMsg.id = 'game-over-msg';
                gameOverMsg.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-75 text-white p-8 rounded-lg text-2xl z-50 text-center';

                const winnerText = document.createElement('div');
                winnerText.className = player1Score > player2Score ? 'text-blue-400' : 'text-green-400';
                winnerText.textContent = `${player1Score > player2Score ? 'Player 1 (Blue)' : 'Player 2 (Green)'} Wins!`;
                gameOverMsg.appendChild(winnerText);

                const scoreText = document.createElement('div');
                scoreText.className = 'mt-2 text-xl';
                scoreText.innerHTML = `<span class="text-blue-400">${player1Score}</span> - <span class="text-green-400">${player2Score}</span>`;
                gameOverMsg.appendChild(scoreText);

                const buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'mt-6 flex justify-center gap-4';

                if (tournamentMatchId) {
                    const backButton = document.createElement('button');
                    backButton.className = 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition duration-200';
                    backButton.textContent = 'Back to Tournament';
                    backButton.addEventListener('click', () => {
                        gameOverMsg.remove();
                        const targetPath = gameContextId ? `/tournaments/${gameContextId}` : '/tournaments';
                        console.log(`Navigating back to tournament: ${targetPath}`);
                        if (typeof (window as any).navigate === 'function') {
                            (window as any).navigate(targetPath);
                        } else {
                            window.location.href = targetPath;
                        }
                    });
                    buttonsContainer.appendChild(backButton);
                } else {
                    const authService = AuthService.getInstance();
                    if (!authService.getToken()) {
                        const authMessage = document.createElement('div');
                        authMessage.className = 'mt-2 text-sm text-gray-400';
                        authMessage.textContent = 'Log in to save your game results!';
                        gameOverMsg.appendChild(authMessage);
                    }

                    const playAgainButton = document.createElement('button');
                    playAgainButton.className = 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200';
                    playAgainButton.textContent = 'Play Again';
                    playAgainButton.addEventListener('click', () => {
                        gameOverMsg.remove();
                        renderGamePage(container as HTMLElement);
                    });
                    buttonsContainer.appendChild(playAgainButton);

                    const exitButton = document.createElement('button');
                    exitButton.className = 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-200';
                    exitButton.textContent = 'Exit Game';
                    exitButton.addEventListener('click', () => {
                        gameOverMsg.remove();
                        if (typeof (window as any).navigate === 'function') {
                            (window as any).navigate('/');
                        } else {
                            window.location.href = '/';
                        }
                    });
                    buttonsContainer.appendChild(exitButton);
                }
                gameOverMsg.appendChild(buttonsContainer);
                container.appendChild(gameOverMsg);
            }
        };

        initializeGame(canvas, gameMode, displayTitle, gameIdParam, tournamentMatchId, handleGameOver);

        canvas.focus();
        canvas.tabIndex = 1;
    } else {
        console.error("renderCanvas element not found!");
    }
}

function initializeGame(canvas: HTMLCanvasElement, mode: 'single' | 'multi' | 'tournament', gameTitle: string, gameId?: string | null, tournamentMatchId?: number | null, onGameOver?: (player1Score: number, player2Score: number) => void) {
    let initialP1Score = 0;
    let initialP2Score = 0;
    const storageKey = getStorageKey();
    try {
        const savedStateString = localStorage.getItem(storageKey);
        if (savedStateString) {
            const savedState = JSON.parse(savedStateString);
            initialP1Score = savedState.p1 || 0;
            initialP2Score = savedState.p2 || 0;
            console.log('[GamePage] Found saved scores in localStorage:', {p1: initialP1Score, p2: initialP2Score});
            localStorage.removeItem(storageKey);
        } else {
            console.log('[GamePage] No saved scores found in localStorage for key:', storageKey);
        }
    } catch (e) {
        console.error('[GamePage] Error reading or parsing saved state from localStorage for key:', storageKey, e);
        localStorage.removeItem(storageKey);
    }

    const updateScoreboard: ScoreUpdateCallback = async (player1Score, player2Score, isGameOver) => {
        const player1ScoreElement = document.getElementById('player1-score');
        const player2ScoreElement = document.getElementById('player2-score');
        if (player1ScoreElement) player1ScoreElement.textContent = `${player1Score}`;
        if (player2ScoreElement) player2ScoreElement.textContent = `${player2Score}`;

        if (isGameOver) {
            removeNavigationListener();
            if (onGameOver) {
                onGameOver(player1Score, player2Score);
            }
        }
    };

    if (currentGame) {
        console.warn('[GamePage] Cleaning up unexpected existing game instance before initialization.');
        cleanupGame(false);
    }
    removeNavigationListener();

    const initialPlayer1ScoreElement = document.getElementById('player1-score');
    const initialPlayer2ScoreElement = document.getElementById('player2-score');
    if (initialPlayer1ScoreElement) initialPlayer1ScoreElement.textContent = `${initialP1Score}`;
    if (initialPlayer2ScoreElement) initialPlayer2ScoreElement.textContent = `${initialP2Score}`;
    console.log('[GamePage] Updated initial score display in DOM.');

    gameStartTime = Date.now();

    if (mode === 'single') {
        currentGame = new Pong(
            'renderCanvas',
            updateScoreboard,
            gameTitle,
            initialP1Score,
            initialP2Score
        ) as IPausableGame;
    } else {
        currentGame = new MultiViewPong(
            'renderCanvas',
            updateScoreboard,
            tournamentMatchId,
            gameTitle,
            initialP1Score,
            initialP2Score
        ) as IPausableGame;
    }
    console.log("[GamePage] New game instance created with initial scores:", { p1: initialP1Score, p2: initialP2Score });

    setupNavigationListener();
} 