import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { ModelAnalyzer } from './ModelAnalyzer';

export class Game {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private camera!: BABYLON.FreeCamera;
    private ninja: BABYLON.AbstractMesh | null = null; // Store reference to ninja

    constructor(canvasId: string) {
        // Get the canvas element
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        
        // Initialize the Babylon engine
        this.engine = new BABYLON.Engine(this.canvas, true);
        
        // Create the scene
        this.scene = this.createScene();
        
        // Add keyboard controls
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
                if (kbInfo.event.key === 'v' && this.ninja) {
                    // Switch to third person view
                    if (this.camera) {
                        this.camera.position = new BABYLON.Vector3(
                            this.ninja.position.x,
                            this.ninja.position.y + 2, // Above the ninja
                            this.ninja.position.z - 5  // Behind the ninja
                        );
                        this.camera.setTarget(this.ninja.position);
                    }
                }
            }
        });

        // Register the render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    private createScene(): BABYLON.Scene {
        const scene = new BABYLON.Scene(this.engine);

        // This creates and positions a free camera
        this.camera = new BABYLON.FreeCamera("camera1", 
            new BABYLON.Vector3(0, 5, -10), scene);

        // Just slow down movement speed, keep rotation normal
        this.camera.speed = 0.25;  // Default is 1
        this.camera.angularSensibility = 2000;  // Back to default

        // This targets the camera to scene origin
        this.camera.setTarget(BABYLON.Vector3.Zero());

        // This attaches the camera to the canvas
        this.camera.attachControl(this.canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky
        const light = new BABYLON.HemisphericLight("light", 
            new BABYLON.Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Create ground material
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);

        // Our built-in 'ground' shape
        const ground = BABYLON.MeshBuilder.CreateGround("ground", 
            {width: 6, height: 6}, scene);
        ground.material = groundMaterial;

        // Load the cyberpunk building
        BABYLON.SceneLoader.ImportMesh(
            "",
            "assets/buildings/",
            "g1_cyberpunk_building.glb",
            scene,
            (meshes) => {
                const building = meshes[0];
                if (building) {
                    building.position = new BABYLON.Vector3(0, 0, 0);
                    building.rotation = new BABYLON.Vector3(-Math.PI/2, 0, 0);
                    building.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);  // Back to original
                }
            }
        );

        // Load the ninja character
        BABYLON.SceneLoader.ImportMesh(
            "",
            "assets/characters/",
            "a_neon_cyberpunk_ninja.glb",
            scene,
            (meshes) => {
                this.ninja = meshes[0];
                if (this.ninja) {
                    this.ninja.position = new BABYLON.Vector3(2, 0, 0);  // Back to ground level
                    this.ninja.rotation = new BABYLON.Vector3(0, 0, 0);
                    this.ninja.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);  // Double the building's scale
                    
                    // Analyze ninja dimensions and compare with building
                    console.log("\nAnalyzing Ninja:");
                    ModelAnalyzer.analyzeModelDimensions(scene);
                    
                    // Find building mesh and compare
                    const building = scene.meshes.find(m => m.name.includes("building"));
                    if (building) {
                        ModelAnalyzer.compareModelScales(this.ninja, building);
                    }
                }
            }
        );

        return scene;
    }

    // Add method to properly clean up resources
    public dispose(): void {
        window.removeEventListener('resize', () => this.engine.resize());
        this.engine.stopRenderLoop();
        this.scene.dispose();
        this.engine.dispose();
    }
}
