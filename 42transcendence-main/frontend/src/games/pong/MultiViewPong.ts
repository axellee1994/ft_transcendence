import { createScene, ScoreUpdateCallback } from './createScene';
import * as BABYLON from 'babylonjs';
import { API_URL, AuthService } from '../../services/auth';

export class MultiViewPong {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private gameInstance: any;
    private onScoreUpdate?: ScoreUpdateCallback;
    private isDisposed: boolean = false;
    private isInitialized: boolean = false;
    private scores: {
        player1Score: number;
        player2Score: number;
        isGameOver: boolean;
    } = { player1Score: 0, player2Score: 0, isGameOver: false };

    constructor(canvasId: string, onScoreUpdate?: ScoreUpdateCallback) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.onScoreUpdate = onScoreUpdate;
        
        // Make canvas focusable and focus it automatically
        this.canvas.tabIndex = 1;
        this.canvas.focus();
        
        // Initialize game in a safer way
        this.initializeGame();
    }

    private async initializeGame(): Promise<void> {
        try {
            await this.createScene();
            this.setupMultiView();
            
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
            console.error('Error initializing multi-view game:', error);
        }
    }

    private async createScene(): Promise<void> {
        const scoreCallback: ScoreUpdateCallback = (player1Score, player2Score, isGameOver) => {
            // Store scores for access later
            this.scores = { player1Score, player2Score, isGameOver };
            
            // Forward the score update to the parent component if callback exists
            if (this.onScoreUpdate) {
                this.onScoreUpdate(player1Score, player2Score, isGameOver);
            }
            
            // Here you could send the scores to the backend API
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
                if (this.engine) {
                    console.log('Game over - safely shutting down render loop');
                    this.engine.stopRenderLoop();
                }
            }
        };
        
        try {
            // Pass true for isMultiplayer to disable AI
            this.gameInstance = await createScene(this.engine, this.canvas, scoreCallback, true);
            
            // Verify all required components are initialized
            if (!this.gameInstance || !this.gameInstance.scene) {
                throw new Error('Scene not properly initialized');
            }
            
            // Verify camera is available
            if (!this.gameInstance.camera) {
                console.error('No camera returned from createScene');
                throw new Error('Camera not properly initialized');
            }
        } catch (error) {
            console.error('Error creating multi-view scene:', error);
            throw error;
        }
    }

    private setupMultiView(): void {
        if (!this.gameInstance || !this.gameInstance.scene) {
            console.error('Cannot setup multi-view: scene not initialized');
            return;
        }
        
        const scene = this.gameInstance.scene;
        
        try {
            // Create cameras
            const camera1 = this.gameInstance.camera || scene.activeCamera;
            if (!camera1) {
                throw new Error('Primary camera not available');
            }
            
            const camera2 = new BABYLON.ArcRotateCamera("camera2", Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);

            // Set up viewports for split screen
            camera1.viewport = new BABYLON.Viewport(0, 0, 0.5, 1.0);
            camera2.viewport = new BABYLON.Viewport(0.5, 0, 0.5, 1.0);

            camera1.attachControl(this.canvas, true);
            camera2.attachControl(this.canvas, true);

            scene.activeCameras = [camera1, camera2];

            this.setupCameraPositions(camera1, camera2);
            
            // Store cameras for later access
            this.gameInstance.camera1 = camera1;
            this.gameInstance.camera2 = camera2;
        } catch (error) {
            console.error('Error setting up multi-view:', error);
            throw error;
        }
    }

    private startRenderLoop(): void {
        // Ensure everything is properly initialized
        if (!this.isInitialized || !this.gameInstance || !this.gameInstance.scene) {
            console.error('Cannot start render loop: scene not fully initialized');
            return;
        }
        
        // Check for cameras
        if (!this.gameInstance.scene.activeCameras || this.gameInstance.scene.activeCameras.length === 0) {
            console.error('Cannot start render loop: no active cameras');
            return;
        }

        // Test render once before starting loop
        try {
            this.gameInstance.scene.render();
        } catch (error) {
            console.error('Failed initial render test:', error);
            return;
        }

        // Create a safer render function
        const renderFunction = () => {
            try {
                // Check if game is over first
                const gameState = this.gameInstance?.getScores?.() || this.scores;
                
                // Don't render if disposed or game over
                if (this.isDisposed || gameState.isGameOver) {
                    return;
                }
                
                // Then check if components are available
                if (this.gameInstance && this.gameInstance.scene && 
                    this.gameInstance.scene.activeCameras && 
                    this.gameInstance.scene.activeCameras.length > 0) {
                    this.gameInstance.scene.render();
                } else {
                    console.error('Invalid scene or cameras in render loop');
                    this.engine.stopRenderLoop();
                }
            } catch (error) {
                console.error('Error in multi-view render loop:', error);
                // Just stop render loop, don't dispose here
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

    private setupCameraPositions(camera1: BABYLON.ArcRotateCamera, camera2: BABYLON.ArcRotateCamera): void {
        camera1.alpha = -Math.PI / 2;
        camera1.beta = Math.PI / 2.5;
        camera1.radius = 15;
        
        camera2.alpha = Math.PI / 2;
        camera2.beta = Math.PI / 2.5;
        camera2.radius = 15;
    }

    private async saveGameResults(): Promise<void> {
        try {
            // Get auth token from sessionStorage
            const authService = AuthService.getInstance();
            const token = authService.getToken();
            if (!token) {
                console.error('Authentication required to save game results');
                return;
            }
            
            console.log('MultiViewPong: Attempting to save game results with token present');
            
            const scores = this.getScores();
            const isWinner = scores.player1Score > scores.player2Score;
            
            const requestData = {
                player1_score: scores.player1Score,
                player2_score: scores.player2Score,
                game_type: 'multi', // This is always 'multi' for MultiViewPong
                winner: isWinner ? 'player1' : 'player2'
            };
            
            console.log('MultiViewPong: Sending game results to server:', requestData);
            
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
                console.error('MultiViewPong: Server error response:', response.status, errorText);
                throw new Error(`Failed to save game results: ${response.status} - ${errorText}`);
            }
            
            console.log('MultiViewPong: Game results saved successfully');
            
            // Also update user stats
            try {
                const authService = (window as any).AuthService?.getInstance();
                const currentUser = authService?.getCurrentUser();
                
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
                        const highestScore = Math.max(stats.highest_score || 0, scores.player1Score);
                        
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
                        
                        console.log('MultiViewPong: User stats updated successfully');
                    }
                }
            } catch (statsError) {
                console.error('MultiViewPong: Error updating user stats:', statsError);
                // Don't throw here so the game can continue even if stats update fails
            }
        } catch (error) {
            console.error('MultiViewPong: Error saving game results:', error);
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
                console.error('Error during multi-view cleanup:', error);
            }
            
            // Clear the game instance
            this.gameInstance = null;
        }, 100); // Small delay to ensure render loop has stopped
    }
    
    public getScores(): any {
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
            this.createScene().then(() => {
                this.setupMultiView();
            }).catch(error => {
                console.error('Error resetting multi-view game:', error);
            });
        }
        
        // Reset scores
        this.scores = { player1Score: 0, player2Score: 0, isGameOver: false };
        
        // Make sure the canvas has focus after resetting
        this.canvas.focus();
    }
} 