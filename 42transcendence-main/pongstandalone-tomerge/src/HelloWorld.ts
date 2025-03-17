import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

export class HelloWorld {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        
        // Set background color
        this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.2, 1);
        
        // Add camera
        const camera = new BABYLON.ArcRotateCamera(
            "camera",
            0,
            Math.PI / 2,
            10,
            BABYLON.Vector3.Zero(),
            this.scene
        );
        camera.setPosition(new BABYLON.Vector3(0, 0, -10));
        
        // Create fullscreen UI
        const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        // Add text
        const text = new GUI.TextBlock();
        text.text = "Hello World!";
        text.color = "white";
        text.fontSize = 48;
        advancedTexture.addControl(text);

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    public dispose(): void {
        this.scene.dispose();
        this.engine.dispose();
    }
} 