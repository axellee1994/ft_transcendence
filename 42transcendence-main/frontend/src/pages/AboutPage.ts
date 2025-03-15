/**
 * Renders the About page
 */
export function renderAboutPage(contentElement: HTMLElement): void {
    contentElement.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-8 max-w-4xl mx-auto mt-10">
            <h1 class="text-4xl font-bold text-center mb-6 text-gray-800">About Pong</h1>
            
            <div class="mb-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-3">The Game</h2>
                <div class="bg-gray-50 p-6 rounded-lg shadow-md">
                    <p class="text-gray-700 mb-4">
                        Pong is one of the earliest arcade video games and the first sports arcade game. It is a table tennis sports game featuring simple two-dimensional graphics.
                    </p>
                    <p class="text-gray-700 mb-4">
                        The game was originally manufactured by Atari and released in 1972. Pong was created by Allan Alcorn as a training exercise assigned to him by Atari co-founder Nolan Bushnell.
                    </p>
                    <p class="text-gray-700">
                        Our version of Pong brings this classic game into the modern era with stunning 3D graphics powered by Babylon.js, while maintaining the simple and addictive gameplay that made the original so popular.
                    </p>
                </div>
            </div>
            
            <div class="mb-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-3">How to Play</h2>
                <div class="bg-blue-50 p-6 rounded-lg shadow-md">
                    <p class="text-gray-700 mb-4">
                        Pong is a two-dimensional sports game that simulates table tennis. Players control an in-game paddle by moving it vertically across the left or right side of the screen. Players use the paddles to hit a ball back and forth.
                    </p>
                    
                    <h3 class="text-xl font-semibold text-blue-800 mb-2">Controls</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <h4 class="text-lg font-semibold text-blue-600 mb-2">Player 1</h4>
                            <ul class="list-disc list-inside text-gray-700">
                                <li>W: Move paddle up</li>
                                <li>S: Move paddle down</li>
                            </ul>
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold text-purple-600 mb-2">Player 2</h4>
                            <ul class="list-disc list-inside text-gray-700">
                                <li>↑: Move paddle up</li>
                                <li>↓: Move paddle down</li>
                            </ul>
                        </div>
                    </div>
                    
                    <h3 class="text-xl font-semibold text-blue-800 mb-2">Rules</h3>
                    <ul class="list-disc list-inside text-gray-700">
                        <li>The game starts when a player serves the ball.</li>
                        <li>Players must hit the ball with their paddle to return it to the opponent's side.</li>
                        <li>If a player fails to return the ball, their opponent scores a point.</li>
                        <li>The first player to reach 10 points wins the game.</li>
                        <li>The ball speeds up as the rally continues, making the game progressively more challenging.</li>
                    </ul>
                </div>
            </div>
            
            <div class="mb-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-3">Features</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-purple-50 p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-semibold text-purple-800 mb-2">3D Graphics</h3>
                        <p class="text-gray-700">
                            Experience Pong like never before with stunning 3D graphics powered by Babylon.js. Enjoy realistic lighting, shadows, and physics that bring the game to life.
                        </p>
                    </div>
                    <div class="bg-green-50 p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-semibold text-green-800 mb-2">Tournaments</h3>
                        <p class="text-gray-700">
                            Compete in tournaments against other players. Rise through the ranks and become the ultimate Pong champion.
                        </p>
                    </div>
                    <div class="bg-yellow-50 p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-semibold text-yellow-800 mb-2">Customization</h3>
                        <p class="text-gray-700">
                            Customize your gameplay experience with different difficulty levels, game speeds, and visual settings.
                        </p>
                    </div>
                    <div class="bg-red-50 p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-semibold text-red-800 mb-2">Leaderboards</h3>
                        <p class="text-gray-700">
                            Track your progress and compare your skills with other players on our global leaderboards.
                        </p>
                    </div>
                </div>
            </div>
            
            <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-3">About the Project</h2>
                <div class="bg-gray-50 p-6 rounded-lg shadow-md">
                    <p class="text-gray-700 mb-4">
                        This project was developed as part of the 42 curriculum. It showcases the use of modern web technologies including:
                    </p>
                    <ul class="list-disc list-inside text-gray-700 mb-4">
                        <li>TypeScript for type-safe JavaScript</li>
                        <li>Tailwind CSS for responsive design</li>
                        <li>Babylon.js for 3D graphics</li>
                        <li>Fastify with Node.js for the backend</li>
                        <li>SQLite for data storage</li>
                    </ul>
                    <p class="text-gray-700">
                        The goal was to create a modern version of the classic Pong game while learning and applying these technologies in a real-world project.
                    </p>
                </div>
            </div>
        </div>
    `;
} 