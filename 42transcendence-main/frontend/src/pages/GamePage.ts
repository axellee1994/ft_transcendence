import { Pong } from '../Pong';
import { MultiViewPong } from '../MultiViewPong';

let currentGame: Pong | MultiViewPong | null = null;

function cleanupGame() {
    if (currentGame && 'dispose' in currentGame) {
        (currentGame as any).dispose();
    }
    currentGame = null;
}

export function renderGamePage(container: HTMLElement, mode: 'single' | 'multi' = 'single'): void {
    // Cleanup any existing game
    cleanupGame();

    container.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <nav class="bg-white shadow-md">
                <div class="container-game flex justify-between items-center py-4">
                    <h1 class="text-2xl font-bold text-gray-800">42 Transcendence</h1>
                    <div class="space-x-4">
                        <button onclick="navigate('/')" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-200">
                            Back to Menu
                        </button>
                    </div>
                </div>
            </nav>
            
            <div class="container-game py-8">
                <div class="bg-white rounded-lg shadow-xl p-6 max-w-4xl mx-auto">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">${mode === 'single' ? 'Single View' : 'Multi View'} Mode</h2>
                    <div class="bg-gray-900 rounded-lg shadow-lg overflow-hidden">
                        <canvas id="renderCanvas" class="w-full aspect-video touch-none"></canvas>
                    </div>
                    <div class="mt-4 flex justify-between items-center">
                        <div class="text-gray-700">
                            <span class="font-bold">Score:</span> <span id="score">0 - 0</span>
                        </div>
                        <button onclick="navigate('/')" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-200">
                            End Game
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize the appropriate game mode
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    if (mode === 'single') {
        currentGame = new Pong('renderCanvas');
    } else {
        currentGame = new MultiViewPong('renderCanvas');
    }
} 