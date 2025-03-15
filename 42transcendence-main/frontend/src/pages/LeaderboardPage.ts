/**
 * Renders the Leaderboard page
 */
export function renderLeaderboardPage(contentElement: HTMLElement): void {
    contentElement.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-8 max-w-4xl mx-auto mt-10">
            <h1 class="text-4xl font-bold text-center mb-6 text-gray-800">Leaderboard</h1>
            
            <!-- Leaderboard Filters -->
            <div class="flex flex-wrap justify-between items-center mb-6">
                <div class="flex space-x-2 mb-4 md:mb-0">
                    <button class="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium">All Time</button>
                    <button class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition">Monthly</button>
                    <button class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition">Weekly</button>
                </div>
                <div class="relative">
                    <input type="text" placeholder="Search players..." class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <div class="absolute left-3 top-2.5 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>
            
            <!-- Leaderboard Table -->
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="px-4 py-3 rounded-tl-lg">Rank</th>
                            <th class="px-4 py-3">Player</th>
                            <th class="px-4 py-3">Wins</th>
                            <th class="px-4 py-3">Losses</th>
                            <th class="px-4 py-3">Win Rate</th>
                            <th class="px-4 py-3 rounded-tr-lg">Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="border-b border-gray-200 bg-yellow-50">
                            <td class="px-4 py-3 font-bold">1</td>
                            <td class="px-4 py-3">
                                <div class="flex items-center">
                                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                                        <span class="text-sm font-bold text-white">JD</span>
                                    </div>
                                    <div>
                                        <div class="font-medium">John Doe</div>
                                        <div class="text-xs text-gray-500">@johndoe</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-green-600 font-medium">42</td>
                            <td class="px-4 py-3 text-red-600 font-medium">18</td>
                            <td class="px-4 py-3 font-medium">70%</td>
                            <td class="px-4 py-3 font-bold">1250</td>
                        </tr>
                        <tr class="border-b border-gray-200 bg-gray-50">
                            <td class="px-4 py-3 font-bold">2</td>
                            <td class="px-4 py-3">
                                <div class="flex items-center">
                                    <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                                        <span class="text-sm font-bold text-white">JS</span>
                                    </div>
                                    <div>
                                        <div class="font-medium">Jane Smith</div>
                                        <div class="text-xs text-gray-500">@janesmith</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-green-600 font-medium">38</td>
                            <td class="px-4 py-3 text-red-600 font-medium">15</td>
                            <td class="px-4 py-3 font-medium">72%</td>
                            <td class="px-4 py-3 font-bold">1180</td>
                        </tr>
                        <tr class="border-b border-gray-200">
                            <td class="px-4 py-3 font-bold">3</td>
                            <td class="px-4 py-3">
                                <div class="flex items-center">
                                    <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                                        <span class="text-sm font-bold text-white">RJ</span>
                                    </div>
                                    <div>
                                        <div class="font-medium">Robert Johnson</div>
                                        <div class="text-xs text-gray-500">@robertj</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-green-600 font-medium">35</td>
                            <td class="px-4 py-3 text-red-600 font-medium">20</td>
                            <td class="px-4 py-3 font-medium">64%</td>
                            <td class="px-4 py-3 font-bold">1050</td>
                        </tr>
                        <tr class="border-b border-gray-200">
                            <td class="px-4 py-3 font-bold">4</td>
                            <td class="px-4 py-3">
                                <div class="flex items-center">
                                    <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                                        <span class="text-sm font-bold text-white">EW</span>
                                    </div>
                                    <div>
                                        <div class="font-medium">Emily Wilson</div>
                                        <div class="text-xs text-gray-500">@emilyw</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-green-600 font-medium">30</td>
                            <td class="px-4 py-3 text-red-600 font-medium">22</td>
                            <td class="px-4 py-3 font-medium">58%</td>
                            <td class="px-4 py-3 font-bold">980</td>
                        </tr>
                        <tr class="border-b border-gray-200">
                            <td class="px-4 py-3 font-bold">5</td>
                            <td class="px-4 py-3">
                                <div class="flex items-center">
                                    <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                                        <span class="text-sm font-bold text-white">MB</span>
                                    </div>
                                    <div>
                                        <div class="font-medium">Michael Brown</div>
                                        <div class="text-xs text-gray-500">@michaelb</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-green-600 font-medium">28</td>
                            <td class="px-4 py-3 text-red-600 font-medium">25</td>
                            <td class="px-4 py-3 font-medium">53%</td>
                            <td class="px-4 py-3 font-bold">920</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination -->
            <div class="flex justify-between items-center mt-6">
                <div class="text-sm text-gray-600">
                    Showing <span class="font-medium">1</span> to <span class="font-medium">5</span> of <span class="font-medium">24</span> players
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
    `;
} 