import * as BABYLON from 'babylonjs';

export class Pong {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    
    // Game objects
    private leftPaddle!: BABYLON.Mesh;
    private rightPaddle!: BABYLON.Mesh;
    private ball!: BABYLON.Mesh;
    
    // Game state
    private ballSpeed = 0.1;
    private paddleSpeed = 0.15;
    private ballVelocity = new BABYLON.Vector3(0, 0, 0);
    
    // Score
    private leftScore = 0;
    private rightScore = 0;

    constructor(canvasElement: string) {
        // Create canvas and engine
        this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true);
        
        // Create the scene
        this.scene = new BABYLON.Scene(this.engine);
        
        // Set background color to dark blue
        this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.2, 1);
        
        // Setup the game
        this.createCamera();
        this.createLights();
        this.createGameObjects();
        this.setupControls();
        
        // Start the game loop
        this.engine.runRenderLoop(() => {
            this.update();
            this.scene.render();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    private createCamera(): void {
        const camera = new BABYLON.ArcRotateCamera(
            "camera",
            0,
            Math.PI / 2,
            15,
            BABYLON.Vector3.Zero(),
            this.scene
        );
        camera.setPosition(new BABYLON.Vector3(0, 0, -20));
        // Disable camera controls since this is a 2D game
        camera.inputs.clear();
    }

    private createLights(): void {
        new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
    }

    private createGameObjects(): void {
        // Create paddles with white material
        const paddleMaterial = new BABYLON.StandardMaterial("paddleMat", this.scene);
        paddleMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);

        // Create paddles
        this.leftPaddle = BABYLON.MeshBuilder.CreateBox("leftPaddle", {
            height: 2,
            width: 0.3,
            depth: 0.5
        }, this.scene);
        this.leftPaddle.position.x = -8;
        this.leftPaddle.material = paddleMaterial;

        this.rightPaddle = BABYLON.MeshBuilder.CreateBox("rightPaddle", {
            height: 2,
            width: 0.3,
            depth: 0.5
        }, this.scene);
        this.rightPaddle.position.x = 8;
        this.rightPaddle.material = paddleMaterial;

        // Create ball with white material
        const ballMaterial = new BABYLON.StandardMaterial("ballMat", this.scene);
        ballMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        
        this.ball = BABYLON.MeshBuilder.CreateSphere("ball", {
            diameter: 0.5
        }, this.scene);
        this.ball.material = ballMaterial;
        
        // Initial ball velocity
        this.resetBall();
    }

    private setupControls(): void {
        // Left paddle controls: W and S keys
        // Right paddle controls: Up and Down arrow keys
        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        case 'w':
                        case 'W':
                            this.leftPaddle.position.y += this.paddleSpeed;
                            break;
                        case 's':
                        case 'S':
                            this.leftPaddle.position.y -= this.paddleSpeed;
                            break;
                        case 'ArrowUp':
                            this.rightPaddle.position.y += this.paddleSpeed;
                            break;
                        case 'ArrowDown':
                            this.rightPaddle.position.y -= this.paddleSpeed;
                            break;
                    }
                    break;
            }
        });
    }

    private resetBall(): void {
        this.ball.position = BABYLON.Vector3.Zero();
        const angle = Math.random() * Math.PI / 2 - Math.PI / 4;
        this.ballVelocity = new BABYLON.Vector3(
            Math.cos(angle) * this.ballSpeed * (Math.random() < 0.5 ? 1 : -1),
            Math.sin(angle) * this.ballSpeed,
            0
        );
    }

    private update(): void {
        // Update ball position
        this.ball.position.addInPlace(this.ballVelocity);

        // Check for collisions with paddles
        if (this.ball.intersectsMesh(this.leftPaddle, false) || 
            this.ball.intersectsMesh(this.rightPaddle, false)) {
            this.ballVelocity.x *= -1.1; // Increase speed slightly on paddle hit
        }

        // Check for collisions with top and bottom
        if (Math.abs(this.ball.position.y) > 4) {
            this.ballVelocity.y *= -1;
        }

        // Check for scoring
        if (this.ball.position.x > 9) {
            this.leftScore++;
            console.log(`Score: ${this.leftScore} - ${this.rightScore}`);
            this.resetBall();
        } else if (this.ball.position.x < -9) {
            this.rightScore++;
            console.log(`Score: ${this.leftScore} - ${this.rightScore}`);
            this.resetBall();
        }

        // Limit paddle movement
        this.leftPaddle.position.y = BABYLON.Scalar.Clamp(this.leftPaddle.position.y, -4, 4);
        this.rightPaddle.position.y = BABYLON.Scalar.Clamp(this.rightPaddle.position.y, -4, 4);
    }
}
