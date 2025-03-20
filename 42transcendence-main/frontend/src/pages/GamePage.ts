import { Pong } from '../Pong';
import { MultiViewPong } from '../MultiViewPong';

let currentGame: Pong | MultiViewPong | null = null;

function cleanupGame() {
    if (currentGame && 'dispose' in currentGame) {
        (currentGame as any).dispose();
    }
    currentGame = null;
}

export function renderGamePage(container: HTMLElement): void {
    // Get the game mode from window object
    const mode = (window as any).gameMode || 'single';

    // Cleanup any existing game
    cleanupGame();

    container.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <div class="container-game py-8">
                <div class="bg-white rounded-lg shadow-xl p-6 max-w-4xl mx-auto">
                    <div class="text-center mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">${mode === 'single' ? 'Single View' : 'Multi View'} Mode</h2>
                    </div>
                    <div class="bg-gray-900 rounded-lg shadow-lg overflow-hidden">
                        <canvas id="renderCanvas" class="w-full aspect-video touch-none"></canvas>
                    </div>
                    <div class="mt-4 flex justify-center items-center">
                        <div class="text-gray-700 text-xl font-bold">
                            <span id="score">0 - 0</span>
                        </div>
                    </div>
                    <div class="mt-4 flex justify-center">
                        <button onclick="navigate('/')" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition duration-200">
                            End Game
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize the game with the appropriate mode
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    if (canvas) {
        initializeGame(canvas, mode);
    }
}

function initializeGame(canvas: HTMLCanvasElement, mode: 'single' | 'multi') {
    if (mode === 'single') {
        currentGame = new Pong('renderCanvas');
    } else {
        currentGame = new MultiViewPong('renderCanvas');
    }
} 