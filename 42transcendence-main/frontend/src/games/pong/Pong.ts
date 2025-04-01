import * as BABYLON from 'babylonjs';
import { createScene, ScoreUpdateCallback } from './createScene';
import { API_URL, AuthService } from '../../services/auth';

export class Pong {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private gameInstance: any;
    private onScoreUpdate?: ScoreUpdateCallback;
    private scores: {
        player1Score: number;
        player2Score: number;
        isGameOver: boolean;
    } = { player1Score: 0, player2Score: 0, isGameOver: false };
    private isDisposed: boolean = false;
    private isInitialized: boolean = false;

    constructor(canvasId: string, onScoreUpdate?: ScoreUpdateCallback) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.onScoreUpdate = onScoreUpdate;
        
        // Make canvas focusable and focus it automatically
        this.canvas.tabIndex = 1;
        this.canvas.focus();
        
        // Create scene and start render loop when ready
        this.initializeGame();
    }

    private async initializeGame(): Promise<void> {
        try {
            await this.createScene();
            
            // Wait for a frame to ensure everything is initialized
            await new Promise<void>((resolve) => {
                requestAnimationFrame(() => {
                    if (!this.isDisposed) {
                        this.isInitialized = true;
                        this.startRenderLoop();
                    }
                    resolve();
                });
            });
        } catch (error) {
            console.error('Error initializing game:', error);
        }
    }

    private async createScene(): Promise<void> {
        const scoreCallback: ScoreUpdateCallback = (player1Score, player2Score, isGameOver) => {
            this.scores = { player1Score, player2Score, isGameOver };
            
            // Forward the score update to the parent component if callback exists
            if (this.onScoreUpdate) {
                this.onScoreUpdate(player1Score, player2Score, isGameOver);
            }
            
            // Only try to save results if game is over
            if (isGameOver) {
                // Check if user is authenticated before trying to save
                const authService = AuthService.getInstance();
                const token = authService.getToken();
                if (token) {
                    this.saveGameResults();
                } else {
                    console.log('Game finished but not saving results - user not authenticated');
                }
                
                // When game is over, prevent further rendering to avoid errors
                // This will be a graceful exit - don't dispose yet as the UI may need to show game over state
                // Just stop trying to render the scene as it may be in an inconsistent state
                if (this.engine) {
                    console.log('Game over - safely shutting down render loop');
                    this.engine.stopRenderLoop();
                }
            }
        };
        
        try {
            // Create scene in single player mode (isMultiplayer = false)
            this.gameInstance = await createScene(this.engine, this.canvas, scoreCallback, false);
            
            // Verify all required components are initialized
            if (!this.gameInstance || !this.gameInstance.scene) {
                throw new Error('Scene not properly initialized');
            }
            
            // Verify camera is available (now directly from gameInstance)
            if (!this.gameInstance.camera) {
                console.error('No camera returned from createScene');
                throw new Error('Camera not properly initialized');
            }
            
            // Force one render to ensure everything is initialized
            try {
                this.gameInstance.scene.render(true);
            } catch (error) {
                console.error('Error during initialization render:', error);
                throw error;
            }
        } catch (error) {
            console.error('Error creating scene:', error);
            throw error;
        }
    }

    private startRenderLoop(): void {
        // Extra double check that everything is properly initialized
        if (!this.isInitialized || !this.gameInstance || !this.gameInstance.scene) {
            console.error('Cannot start render loop: scene not fully initialized');
            return;
        }
        
        // Check specifically for camera
        if (!this.gameInstance.camera) {
            console.error('Cannot start render loop: no camera defined in gameInstance');
            return;
        }

        // Test render once before starting loop
        try {
            this.gameInstance.scene.render();
        } catch (error) {
            console.error('Failed initial render test:', error);
            return;
        }

        // Use a safer approach by creating a separate function for rendering
        const renderFunction = () => {
            try {
                // Check if game is over first
                const gameState = this.gameInstance?.getScores?.() || this.scores;
                
                // First check if disposed or game over, don't render in that case
                if (this.isDisposed || gameState.isGameOver) {
                    return;
                }
                
                // Then check if all components are available for rendering
                if (this.gameInstance && this.gameInstance.scene && this.gameInstance.camera) {
                    this.gameInstance.scene.render();
                } else {
                    console.error('Invalid scene or camera in render loop');
                    this.engine.stopRenderLoop();
                }
            } catch (error) {
                console.error('Error in render loop:', error);
                // Don't dispose here, just stop the render loop to prevent cascading errors
                this.engine.stopRenderLoop();
            }
        };
        
        // Start the render loop with our safer function
        this.engine.runRenderLoop(renderFunction);

        window.addEventListener('resize', () => {
            if (!this.isDisposed) {
                this.engine.resize();
            }
        });
    }
    
    private async saveGameResults(): Promise<void> {
        try {
            // Get auth token from AuthService
            const authService = AuthService.getInstance();
            const token = authService.getToken();
            if (!token) {
                console.log('Skipping game result save - user not authenticated');
                return;
            }
            
            console.log('Attempting to save game results with token present');
            
            // Get the current game mode from the window object
            const gameMode = (window as any).gameMode || 'single';
            console.log('Game mode for saving results:', gameMode);
            
            const isWinner = this.scores.player1Score > this.scores.player2Score;
            
            const requestData = {
                player1_score: this.scores.player1Score,
                player2_score: this.scores.player2Score,
                game_type: gameMode,
                winner: isWinner ? 'player1' : 'player2'
            };
            
            console.log('Sending game results to server:', requestData);
            
            const response = await fetch(`${API_URL}/protected/games/results`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', response.status, errorText);
                throw new Error(`Failed to save game results: ${response.status} - ${errorText}`);
            }
            
            console.log('Game results saved successfully');
            
            // Also update user stats
            try {
                const currentUser = authService.getCurrentUser();
                
                if (currentUser) {
                    // Get current stats
                    const statsResponse = await fetch(`${API_URL}/user-stats/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (statsResponse.ok) {
                        const stats = await statsResponse.json();
                        
                        // Calculate new values
                        const highestScore = Math.max(stats.highest_score || 0, this.scores.player1Score);
                        
                        // Update stats
                        await fetch(`${API_URL}/user-stats/${currentUser.id}`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                highest_score: highestScore
                            })
                        });
                        
                        console.log('User stats updated successfully');
                    }
                }
            } catch (statsError) {
                console.error('Error updating user stats:', statsError);
                // Don't throw here so the game can continue even if stats update fails
            }
        } catch (error) {
            console.error('Error saving game results:', error);
        }
    }

    public dispose(): void {
        // Mark as disposed first to prevent any new render calls
        this.isDisposed = true;
        
        // Stop the render loop first and wait for it to complete
        this.engine.stopRenderLoop();
        
        // Wait a frame before disposing resources to ensure render loop is fully stopped
        setTimeout(() => {
            try {
                // Dispose of the scene if it exists
                if (this.gameInstance) {
                    // Call the game instance's dispose method if it exists
                    if (typeof this.gameInstance.dispose === 'function') {
                        this.gameInstance.dispose();
                    } 
                    // Otherwise dispose the scene directly
                    else if (this.gameInstance.scene) {
                        this.gameInstance.scene.dispose();
                    }
                }
                
                // Dispose of the engine last
                if (this.engine) {
                    this.engine.dispose();
                }
            } catch (error) {
                console.error('Error during cleanup:', error);
            }
            
            // Clear the game instance
            this.gameInstance = null;
        }, 100); // Small delay to ensure render loop has stopped
    }
    
    public getScores(): {
        player1Score: number;
        player2Score: number;
        isGameOver: boolean;
    } {
        if (this.gameInstance && this.gameInstance.getScores) {
            return this.gameInstance.getScores();
        }
        return this.scores;
    }
    
    public resetGame(): void {
        if (this.gameInstance && this.gameInstance.resetGame) {
            this.gameInstance.resetGame();
        } else {
            // Create a new game instance
            this.createScene();
        }
        
        this.scores = { player1Score: 0, player2Score: 0, isGameOver: false };
        
        // Forward the reset scores to the parent component
        if (this.onScoreUpdate) {
            this.onScoreUpdate(0, 0, false);
        }

        // Make sure the canvas has focus after resetting
        this.canvas.focus();
    }
}