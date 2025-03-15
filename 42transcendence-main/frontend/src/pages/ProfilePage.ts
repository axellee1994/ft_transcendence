/**
 * Renders the Profile page
 */
export function renderProfilePage(contentElement: HTMLElement): void {
    contentElement.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-8 max-w-4xl mx-auto mt-10">
            <div class="flex flex-col md:flex-row gap-8">
                <!-- Profile Sidebar -->
                <div class="md:w-1/3">
                    <div class="bg-gray-50 p-6 rounded-lg shadow-md text-center">
                        <div class="w-32 h-32 mx-auto bg-blue-500 rounded-full flex items-center justify-center mb-4">
                            <span class="text-4xl font-bold text-white">JD</span>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-1">John Doe</h2>
                        <p class="text-gray-600 mb-4">@johndoe</p>
                        
                        <div class="flex justify-center space-x-2 mb-6">
                            <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Pro Player</span>
                            <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Tournament Winner</span>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div class="bg-white p-3 rounded-lg shadow-sm">
                                <div class="text-2xl font-bold text-blue-600">42</div>
                                <div class="text-sm text-gray-500">Wins</div>
                            </div>
                            <div class="bg-white p-3 rounded-lg shadow-sm">
                                <div class="text-2xl font-bold text-red-600">18</div>
                                <div class="text-sm text-gray-500">Losses</div>
                            </div>
                        </div>
                        
                        <button class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200 mb-2">
                            Edit Profile
                        </button>
                        <button class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded transition duration-200">
                            Change Avatar
                        </button>
                    </div>
                </div>
                
                <!-- Profile Content -->
                <div class="md:w-2/3">
                    <h1 class="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>
                    
                    <!-- Stats Section -->
                    <div class="bg-blue-50 p-6 rounded-lg shadow-md mb-6">
                        <h2 class="text-xl font-bold text-blue-800 mb-4">Game Statistics</h2>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div class="bg-white p-3 rounded-lg shadow-sm text-center">
                                <div class="text-xl font-bold text-gray-800">70%</div>
                                <div class="text-sm text-gray-500">Win Rate</div>
                            </div>
                            <div class="bg-white p-3 rounded-lg shadow-sm text-center">
                                <div class="text-xl font-bold text-gray-800">60</div>
                                <div class="text-sm text-gray-500">Games Played</div>
                            </div>
                            <div class="bg-white p-3 rounded-lg shadow-sm text-center">
                                <div class="text-xl font-bold text-gray-800">3</div>
                                <div class="text-sm text-gray-500">Tournaments Won</div>
                            </div>
                            <div class="bg-white p-3 rounded-lg shadow-sm text-center">
                                <div class="text-xl font-bold text-gray-800">1250</div>
                                <div class="text-sm text-gray-500">Points Scored</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Recent Matches -->
                    <div class="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
                        <h2 class="text-xl font-bold text-gray-800 mb-4">Recent Matches</h2>
                        <div class="space-y-3">
                            <div class="bg-white p-3 rounded-lg shadow-sm">
                                <div class="flex justify-between items-center">
                                    <div class="flex items-center">
                                        <div class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">Win</div>
                                        <span class="font-medium">vs. Player2</span>
                                    </div>
                                    <div class="text-sm text-gray-500">10-5</div>
                                </div>
                            </div>
                            <div class="bg-white p-3 rounded-lg shadow-sm">
                                <div class="flex justify-between items-center">
                                    <div class="flex items-center">
                                        <div class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">Loss</div>
                                        <span class="font-medium">vs. Player3</span>
                                    </div>
                                    <div class="text-sm text-gray-500">7-10</div>
                                </div>
                            </div>
                            <div class="bg-white p-3 rounded-lg shadow-sm">
                                <div class="flex justify-between items-center">
                                    <div class="flex items-center">
                                        <div class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">Win</div>
                                        <span class="font-medium">vs. Player4</span>
                                    </div>
                                    <div class="text-sm text-gray-500">10-8</div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-4 text-center">
                            <button class="text-blue-500 hover:text-blue-700 font-medium">
                                View All Matches
                            </button>
                        </div>
                    </div>
                    
                    <!-- Achievements -->
                    <div class="bg-purple-50 p-6 rounded-lg shadow-md">
                        <h2 class="text-xl font-bold text-purple-800 mb-4">Achievements</h2>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div class="bg-white p-3 rounded-lg shadow-sm text-center">
                                <div class="w-12 h-12 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                                    <span class="text-yellow-500 text-xl">🏆</span>
                                </div>
                                <div class="text-sm font-medium">First Win</div>
                            </div>
                            <div class="bg-white p-3 rounded-lg shadow-sm text-center">
                                <div class="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                                    <span class="text-blue-500 text-xl">🔥</span>
                                </div>
                                <div class="text-sm font-medium">Win Streak</div>
                            </div>
                            <div class="bg-white p-3 rounded-lg shadow-sm text-center">
                                <div class="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-2">
                                    <span class="text-purple-500 text-xl">🎮</span>
                                </div>
                                <div class="text-sm font-medium">50 Games</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
} 