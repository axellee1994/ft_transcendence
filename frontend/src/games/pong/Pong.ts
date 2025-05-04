import * as BABYLON from 'babylonjs';
import { createScene, ScoreUpdateCallback } from './createScene';
import { API_URL, AuthService } from '../../services/auth';

// Define the expected structure of the object returned by createScene
interface SceneInstance {
    scene: BABYLON.Scene;
    camera: BABYLON.Camera;
    getScores: () => { player1Score: number, player2Score: number, isGameOver: boolean };
    resetGame: () => void;
    dispose: () => void;
    isPaused: () => boolean;
    camera1?: BABYLON.Camera;
    camera2?: BABYLON.Camera;
}

export class Pong {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private gameInstance: SceneInstance | null = null;
    private onScoreUpdate?: ScoreUpdateCallback;
    private gameTitle: string;
    private scores: { 
        player1Score: number;
        player2Score: number;
        isGameOver: boolean;
    } = { player1Score: 0, player2Score: 0, isGameOver: false };
    private isDisposed: boolean = false;
    private isInitialized: boolean = false;
    private initialP1Score: number = 0;
    private initialP2Score: number = 0;

    constructor(
        canvasId: string,
        onScoreUpdate?: ScoreUpdateCallback,
        gameTitle: string = 'Pong Game',
        initialPlayer1Score: number = 0,
        initialPlayer2Score: number = 0
    ) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.onScoreUpdate = onScoreUpdate;
        this.gameTitle = gameTitle;
        this.initialP1Score = initialPlayer1Score;
        this.initialP2Score = initialPlayer2Score;
        this.scores.player1Score = initialPlayer1Score;
        this.scores.player2Score = initialPlayer2Score;
        
        this.canvas.tabIndex = 1;
        this.canvas.focus();
        
        this.initializeGame();
    }

    private async initializeGame(): Promise<void> {
        try {
            await this.createScene();
            
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
            
            if (this.onScoreUpdate) {
                this.onScoreUpdate(player1Score, player2Score, isGameOver);
            }
            
            if (isGameOver) {
                const authService = AuthService.getInstance();
                const token = authService.getToken();
                if (token) {
                    this.saveGameResults();
                } else {
                    console.log('Game finished but not saving results - user not authenticated');
                }
                if (this.engine) {
                    console.log('Game over - safely shutting down render loop');
                    this.engine.stopRenderLoop();
                }
            }
        };
        
        try {
            this.gameInstance = await createScene(
                this.engine,
                this.canvas,
                scoreCallback,
                false,
                this.initialP1Score,
                this.initialP2Score
            );
            
            if (!this.gameInstance || !this.gameInstance.scene || !this.gameInstance.camera) {
                throw new Error('Scene or camera not properly initialized');
            }

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
        if (!this.isInitialized || !this.gameInstance || !this.gameInstance.scene || !this.gameInstance.camera) {
            console.error('Cannot start render loop: scene not fully initialized or camera missing');
            return;
        }

        try {
            this.gameInstance.scene.render();
        } catch (error) {
            console.error('Failed initial render test:', error);
            return;
        }

        const renderFunction = () => {
            try {
                const gameState = this.gameInstance?.getScores?.() || this.scores;
                if (this.isDisposed || gameState.isGameOver) {
                    return;
                }
                if (this.gameInstance && this.gameInstance.scene && this.gameInstance.camera) {
                    this.gameInstance.scene.render();
                } else {
                    console.error('Invalid scene or camera in render loop');
                    this.engine.stopRenderLoop();
                }
            } catch (error) {
                console.error('Error in render loop:', error);
                this.engine.stopRenderLoop();
            }
        };
        
        this.engine.runRenderLoop(renderFunction);

        window.addEventListener('resize', () => {
            if (!this.isDisposed) {
                this.engine.resize();
            }
        });
    }
    
    private async saveGameResults(): Promise<void> {
        try {
            const authService = AuthService.getInstance();
            const token = authService.getToken();
            if (!token) {
                console.log('Skipping game result save - user not authenticated');
                return;
            }
            
            console.log('Attempting to save game results with token present');
            
            const gameMode = (window as any).gameMode || 'single';
            console.log('Game mode for saving results:', gameMode);
            
            const isWinner = this.scores.player1Score > this.scores.player2Score;
            
            const requestData = {
                player1_score: this.scores.player1Score,
                player2_score: this.scores.player2Score,
                game_type: gameMode,
                winner: isWinner ? 'player1' : 'player2',
                game_title: this.gameTitle
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
            
        } catch (error) {
            console.error('Error saving game results:', error);
        }
    }

    public dispose(): void {
        this.isDisposed = true;
        this.engine.stopRenderLoop();
        
        setTimeout(() => {
            try {
                if (this.gameInstance) {
                    if (typeof this.gameInstance.dispose === 'function') {
                        this.gameInstance.dispose();
                    } else if (this.gameInstance.scene) {
                        this.gameInstance.scene.dispose();
                    }
                }
                if (this.engine) {
                    this.engine.dispose();
                }
            } catch (error) {
                console.error('Error during cleanup:', error);
            }
            this.gameInstance = null;
        }, 100);
    }
    
    public getScores(): { player1Score: number; player2Score: number; isGameOver: boolean; } {
        if (this.gameInstance && this.gameInstance.getScores) {
            return this.gameInstance.getScores();
        }
        return this.scores;
    }
    
    public resetGame(): void {
        if (this.gameInstance && this.gameInstance.resetGame) {
            this.gameInstance.resetGame();
        } else {
            this.createScene().catch(error => {
               console.error("Failed to recreate scene on reset:", error);
            });
        }
        
        this.scores = { player1Score: 0, player2Score: 0, isGameOver: false };
        
        if (this.onScoreUpdate) {
            this.onScoreUpdate(0, 0, false);
        }

        this.canvas.focus();
    }

    public isCurrentlyPaused(): boolean {
        if (this.gameInstance && typeof this.gameInstance.isPaused === 'function') {
            return this.gameInstance.isPaused();
        }
        console.warn('[Pong] Attempted to check pause state, but sceneInstance or isPaused method is missing.');
        return false;
    }
}