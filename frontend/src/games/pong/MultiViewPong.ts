import { createScene, ScoreUpdateCallback } from './createScene';
import * as BABYLON from 'babylonjs';
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

export class MultiViewPong {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private gameInstance: SceneInstance | null = null;
    private onScoreUpdate?: ScoreUpdateCallback;
    private gameTitle: string;
    private isDisposed: boolean = false;
    private isInitialized: boolean = false;
    private scores: { 
        player1Score: number;
        player2Score: number;
        isGameOver: boolean;
    } = { player1Score: 0, player2Score: 0, isGameOver: false };
    private tournamentMatchId: number;
    private initialP1Score: number = 0;
    private initialP2Score: number = 0;

    constructor(
        canvasId: string,
        onScoreUpdate?: ScoreUpdateCallback,
        tournamentMatchId?: number,
        gameTitle: string = 'Pong Game',
        initialPlayer1Score: number = 0,
        initialPlayer2Score: number = 0
    ) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.onScoreUpdate = onScoreUpdate;
        this.tournamentMatchId = tournamentMatchId;
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
            this.setupMultiView();
            
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
                true,
                this.initialP1Score,
                this.initialP2Score
            );
            
            if (!this.gameInstance || !this.gameInstance.scene || !this.gameInstance.camera) {
                throw new Error('Scene or camera not properly initialized');
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
            const primaryCamera = this.gameInstance.camera;
            if (!primaryCamera) {
                throw new Error('Primary camera not available');
            }
            if (!(primaryCamera instanceof BABYLON.ArcRotateCamera)) {
                console.warn("Primary camera is not an ArcRotateCamera, multi-view setup might be unexpected.");
            }
            const camera1 = primaryCamera as BABYLON.ArcRotateCamera;
            
            const camera2 = new BABYLON.ArcRotateCamera("camera2", Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);

            camera1.viewport = new BABYLON.Viewport(0, 0, 0.5, 1.0);
            camera2.viewport = new BABYLON.Viewport(0.5, 0, 0.5, 1.0);

            camera1.attachControl(this.canvas, true);
            camera2.attachControl(this.canvas, true);

            scene.activeCameras = [camera1, camera2];

            this.setupCameraPositions(camera1, camera2);
            
            if (this.gameInstance) {
                this.gameInstance.camera1 = camera1;
                this.gameInstance.camera2 = camera2;
            }
        } catch (error) {
            console.error('Error setting up multi-view:', error);
            throw error;
        }
    }

    private startRenderLoop(): void {
        if (!this.isInitialized || !this.gameInstance || !this.gameInstance.scene) {
            console.error('Cannot start render loop: scene not fully initialized');
            return;
        }
        
        if (!this.gameInstance.scene.activeCameras || this.gameInstance.scene.activeCameras.length === 0) {
            console.error('Cannot start render loop: no active cameras');
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
                if (this.gameInstance && this.gameInstance.scene && this.gameInstance.scene.activeCameras && this.gameInstance.scene.activeCameras.length > 0) {
                    this.gameInstance.scene.render();
                } else {
                    console.error('Invalid scene or cameras in render loop');
                    this.engine.stopRenderLoop();
                }
            } catch (error) {
                console.error('Error in multi-view render loop:', error);
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

    private setupCameraPositions(camera1: BABYLON.ArcRotateCamera, camera2: BABYLON.ArcRotateCamera): void {
        camera1.alpha = -Math.PI / 2;
        camera1.beta = Math.PI / 2.5;
        camera1.radius = 20;
        
        camera2.alpha = Math.PI / 2;
        camera2.beta = Math.PI / 2.5;
        camera2.radius = 20;
    }

    private async saveGameResults(): Promise<void> {
        try {
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
                game_type: 'multi',
                winner: isWinner ? 'player1' : 'player2',
                tournamentMatchId: this.tournamentMatchId,
                game_title: this.gameTitle
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
                const err = await response.json();
                throw new Error(err.error);
            }
            
            console.log('MultiViewPong: Game results saved successfully');
            
        } catch (error) {
            if (error.message.includes("Already has a winner"))
                alert(`Error saving game results: Already has a winner`);
            else
                console.error('MultiViewPong: Error saving game results:', error);
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
                console.error('Error during multi-view cleanup:', error);
            }
            this.gameInstance = null;
        }, 100);
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
            this.createScene().then(() => {
                this.setupMultiView();
            }).catch(error => {
                console.error('Error resetting multi-view game:', error);
            });
        }
        
        this.scores = { player1Score: 0, player2Score: 0, isGameOver: false };
        
        this.canvas.focus();
    }

    public isCurrentlyPaused(): boolean {
        if (this.gameInstance && typeof this.gameInstance.isPaused === 'function') {
            return this.gameInstance.isPaused();
        }
        console.warn('[MultiViewPong] Attempted to check pause state, but sceneInstance or isPaused method is missing.');
        return false;
    }
} 