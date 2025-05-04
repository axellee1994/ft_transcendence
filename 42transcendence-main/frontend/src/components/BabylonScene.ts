
export class BabylonScene {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;

    constructor(canvasId: string) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
            throw new Error(`Canvas element with id '${canvasId}' not found or is not a canvas element`);
        }
        this.canvas = canvas;

        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
        this.scene = new BABYLON.Scene(this.engine);
        
        this.scene.clearColor = new BABYLON.Color4(0.9, 0.9, 0.9, 1);
        
        this.createScene();
        
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    private createScene(): void {
        try {
            const camera = new BABYLON.ArcRotateCamera("camera", 0, Math.PI / 3, 10, BABYLON.Vector3.Zero(), this.scene);
            camera.attachControl(this.canvas, true);
            camera.setPosition(new BABYLON.Vector3(0, 5, -10));

            const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
            light.intensity = 0.7;

            const cube = BABYLON.MeshBuilder.CreateBox("cube", { size: 2 }, this.scene);
            const material = new BABYLON.StandardMaterial("cubeMaterial", this.scene);
            material.diffuseColor = new BABYLON.Color3(0, 0, 1); // Blue
            cube.material = material;
            cube.position = BABYLON.Vector3.Zero();

            this.scene.registerBeforeRender(() => {
                cube.rotation.y += 0.01;
                cube.rotation.x += 0.005;
            });

            console.log("Scene created successfully");
        } catch (error) {
            console.error("Error creating scene:", error);
        }
    }
}