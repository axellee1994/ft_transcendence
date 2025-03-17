import { createScene } from './createScene';
import * as BABYLON from 'babylonjs';

export class MultiViewPong {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = createScene(this.engine, this.canvas);

        // Create cameras
        const camera1 = this.scene.activeCamera as BABYLON.ArcRotateCamera;
        const camera2 = new BABYLON.ArcRotateCamera("camera2", Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), this.scene);

        // Set up viewports for split screen
        camera1.viewport = new BABYLON.Viewport(0, 0, 0.5, 1.0);
        camera2.viewport = new BABYLON.Viewport(0.5, 0, 0.5, 1.0);

        camera1.attachControl(this.canvas, true);
        camera2.attachControl(this.canvas, true);

        this.scene.activeCameras = [camera1, camera2];

        this.setupCameraPositions(camera1, camera2);
        this.setupKeyboardControls();

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener('resize', () => {
            this.engine.resize();
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

    private setupKeyboardControls(): void {
        // Copy the keyboard controls from your current index.ts
        // Lines 48-85 from your current index.ts
    }

    public dispose(): void {
        this.scene.dispose();
        this.engine.dispose();
    }
} 