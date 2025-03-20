export function renderLeaderboardPage(container: HTMLElement): void {
    container.innerHTML = `
        <div class="py-8">
            <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="bg-white rounded-lg shadow-xl p-8">
                    <h1 class="text-3xl font-bold text-gray-900 mb-8">Leaderboard</h1>
                    
                    <div class="flex flex-wrap justify-between items-center mb-6">
                        <div class="flex space-x-2 mb-4 md:mb-0">
                            <button class="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium">All Time</button>
                            <button class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition">Monthly</button>
                            <button class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition">Weekly</button>
                        </div>
                        <div class="relative">
                            <input type="text" 
                                placeholder="Search players..." 
                                class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                            <div class="absolute left-3 top-2.5 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="bg-gray-50">
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Games</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${Array.from({ length: 10 }, (_, i) => `
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${i + 1}</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <span class="text-sm text-white">P${i + 1}</span>
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">Player ${i + 1}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Math.floor(Math.random() * 100)}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Math.floor(Math.random() * 50)}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Math.floor(Math.random() * 100)}%</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Math.floor(Math.random() * 1000)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="mt-6 flex justify-between items-center">
                        <div class="text-sm text-gray-700">
                            Showing <span class="font-medium">1</span> to <span class="font-medium">10</span> of <span class="font-medium">50</span> results
                        </div>
                        <div class="flex space-x-1">
                            <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition" disabled>Previous</button>
                            <button class="px-3 py-1 bg-blue-500 text-white rounded-md">1</button>
                            <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition">2</button>
                            <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition">3</button>
                            <button class="px-3 py-1 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
} 