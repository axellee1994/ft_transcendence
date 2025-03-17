/**
 * Renders the Game page
 */
export function renderGamePage(container: HTMLElement): void {
    container.innerHTML = `
        <div class="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
            <canvas id="gameCanvas" class="w-full max-w-4xl aspect-video"></canvas>
            <div id="gameUI" class="mt-4 text-white text-2xl">
                <div id="score">Player 1: 0 - Player 2: 0</div>
            </div>
        </div>
    `;

    // Initialize the game
    import('../game/Game').then(({ Game }) => {
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        const game = new Game(canvas);
        game.initialize();
    });
} 