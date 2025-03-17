import * as GUI from 'babylonjs-gui';
import * as BABYLON from 'babylonjs';
import { Pong } from './Pong';

export class LandingPage {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        
        // Set dark background
        this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.2, 1);
        
        this.createUI();
        
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    private createUI(): void {
        const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        const button = GUI.Button.CreateSimpleButton("pongButton", "Play Pong");
        button.width = "200px";
        button.height = "60px";
        button.color = "white";
        button.cornerRadius = 20;
        button.background = "#4CAF50";
        button.fontSize = 24;
        button.thickness = 2;
        
        button.onPointerUpObservable.add(() => {
            this.startPongGame();
        });
        
        advancedTexture.addControl(button);
    }

    private startPongGame(): void {
        // Dispose current scene and engine
        this.scene.dispose();
        this.engine.dispose();
        
        // Start Pong game
        new Pong(this.canvas.id);
    }
} 