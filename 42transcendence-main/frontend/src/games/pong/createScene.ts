import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { PongAI } from './PongAI';
import { AuthService } from '../../services/auth';

// Define a type for the score update callback
export type ScoreUpdateCallback = (player1Score: number, player2Score: number, isGameOver: boolean) => void;

// Game Settings
const SETTINGS = {
    playArea: {
        width: 10,
        height: 20
    },
    ball: {
        diameter: 0.5,
        baseSpeed: 0.2,  // Base speed
        minSpeed: 0.15,  // Minimum speed component
        maxSpeed: 0.25,  // Maximum speed component
        speedIncrement: 0.05  // Changed from 0.1 to 0.05 for 5% increase per hit
    },
    boxes: {
        width: 2,
        height: 0.5,
        depth: 0.5,
        initialPositions: {
            box1: { x: 0, y: 0, z: -8 },
            box2: { x: 0, y: 0, z: 8 }
        },
        movementLimits: {
            box1: { min: -4, max: 4 }, // Adjusted to account for paddle width
            box2: { min: -4, max: 4 }  // Adjusted to account for paddle width
        },
        movementSpeed: 0.1
    },
    scoreZones: {
        north: 9.75,  // Distance from center where scoring occurs
        south: -9.75  // Distance from center where scoring occurs
    },
    maxScore: 3 // Game ends when a player reaches this score
};

export const createScene = function (engine: BABYLON.Engine, canvas: HTMLCanvasElement, onScoreUpdate?: ScoreUpdateCallback, isMultiplayer: boolean = false) {
    const scene = new BABYLON.Scene(engine);
    
    // Score tracking
    let player1Score = 0;
    let player2Score = 0;
    let isGameOver = false;

    // Initialize AI for single player mode
    const ai = !isMultiplayer ? new PongAI() : null;

    // Ensure canvas can receive focus
    canvas.tabIndex = 1;
    
    // Set up event listener to focus canvas when clicked
    canvas.addEventListener('click', () => {
        canvas.focus();
    });
    
    // Also focus when pointer is locked
    canvas.addEventListener('pointerdown', () => {
        canvas.focus();
    });

    // Camera and light
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, false);
    
    // Explicitly set as active camera and update
    scene.activeCamera = camera;
    scene.activeCamera.update();
    
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

    // First box
    const box1 = BABYLON.MeshBuilder.CreateBox("box1", {
        width: SETTINGS.boxes.width, 
        height: SETTINGS.boxes.height, 
        depth: SETTINGS.boxes.depth
    }, scene);
    box1.position.y = SETTINGS.boxes.height/2;
    box1.position = new BABYLON.Vector3(
        SETTINGS.boxes.initialPositions.box1.x,
        SETTINGS.boxes.initialPositions.box1.y,
        SETTINGS.boxes.initialPositions.box1.z
    );
    box1.material = new BABYLON.StandardMaterial("box1Material", scene);
    (box1.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(0, 0, 1);

    // Second box
    const box2 = BABYLON.MeshBuilder.CreateBox("box2", {
        width: SETTINGS.boxes.width, 
        height: SETTINGS.boxes.height, 
        depth: SETTINGS.boxes.depth
    }, scene);
    box2.position.y = SETTINGS.boxes.height/2;
    box2.position = new BABYLON.Vector3(
        SETTINGS.boxes.initialPositions.box2.x,
        SETTINGS.boxes.initialPositions.box2.y,
        SETTINGS.boxes.initialPositions.box2.z
    );
    box2.material = new BABYLON.StandardMaterial("box2Material", scene);
    (box2.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(0, 1, 0);

    // Add sphere in the center
    const ball = BABYLON.MeshBuilder.CreateSphere("ball", {diameter: SETTINGS.ball.diameter}, scene);
    ball.position = new BABYLON.Vector3(0, SETTINGS.ball.diameter/2, 0);  // y=0.5 to place it just above the ground
    ball.material = new BABYLON.StandardMaterial("ballMaterial", scene);
    (ball.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(1, 0, 0); // Red

    // Create boundaries (walls)
    const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
    wallMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    
    const wallsConfig = [
        // Remove north and south walls since they'll be score zones
        { name: "eastWall", position: new BABYLON.Vector3(5, 0.5, 0), scaling: new BABYLON.Vector3(0.2, 1, 20), visible: 1 },
        { name: "westWall", position: new BABYLON.Vector3(-5, 0.5, 0), scaling: new BABYLON.Vector3(0.2, 1, 20), visible: 1 }
    ];

    const walls = wallsConfig.map(config => {
        const wall = BABYLON.MeshBuilder.CreateBox(config.name, { height: 1, width: 1, depth: 1 }, scene);
        wall.position = config.position;
        wall.scaling = config.scaling;
        wall.material = wallMaterial;
        wall.visibility = config.visible;
        return wall;
    });

    // Add ground within the boundaries
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {
        width: SETTINGS.playArea.width, 
        height: SETTINGS.playArea.height
    }, scene);

    // Create UI for scores (only debug info, no score display)
    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
    
    // Hidden game state elements that aren't displayed
    const gameStatusText = new GUI.TextBlock();
    gameStatusText.text = "";
    gameStatusText.color = "white";
    gameStatusText.fontSize = 24;
    gameStatusText.top = "0px";
    gameStatusText.isVisible = false; // Hidden from view
    advancedTexture.addControl(gameStatusText);

    // For debug info
    const debugText = new GUI.TextBlock();
    debugText.text = "Debug Info:";
    debugText.color = "white";
    debugText.fontSize = 18;
    debugText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    debugText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    debugText.top = "10px";
    debugText.left = "10px";
    advancedTexture.addControl(debugText);

    // Initial ball velocity
    const ballVelocity = new BABYLON.Vector3(
        (Math.random() * 2 - 1) * SETTINGS.ball.baseSpeed,
        0,
        (Math.random() * 2 - 1) * SETTINGS.ball.baseSpeed
    );

    // Function to reset ball position and velocity
    const resetBall = () => {
        ball.position = new BABYLON.Vector3(0, SETTINGS.ball.diameter/2, 0);
        
        // Generate random angle but ensure it's not too horizontal or vertical
        // Random angle between 30 and 150 degrees or 210 and 330 degrees
        let angle;
        if (Math.random() < 0.5) {
            // Angle towards player 1 (top)
            angle = (Math.random() * 120 + 30) * Math.PI / 180;
        } else {
            // Angle towards player 2 (bottom)
            angle = (Math.random() * 120 + 210) * Math.PI / 180;
        }
        
        // Calculate velocity components based on the angle
        const speed = SETTINGS.ball.baseSpeed;
        ballVelocity.x = Math.cos(angle) * speed;
        ballVelocity.z = Math.sin(angle) * speed;
        
        // Log the new ball velocity for debugging
        console.log(`Ball reset with velocity: x=${ballVelocity.x.toFixed(3)}, z=${ballVelocity.z.toFixed(3)}`);
    };
    
    // Helper function to update scores
    const updateScore = (isPlayer1Scored: boolean) => {
        if (isGameOver) return;
        
        if (isPlayer1Scored) {
            player1Score++;
        } else {
            player2Score++;
        }
        
        // Check for game over
        if (player1Score >= SETTINGS.maxScore || player2Score >= SETTINGS.maxScore) {
            isGameOver = true;
            gameStatusText.text = player1Score > player2Score ? "Player 1 Wins!" : "Player 2 Wins!";
            
            // Call the callback if provided
            if (onScoreUpdate) {
                onScoreUpdate(player1Score, player2Score, isGameOver);
            }
            
            return;
        }
        
        // Call the callback if provided
        if (onScoreUpdate) {
            onScoreUpdate(player1Score, player2Score, isGameOver);
        }
        
        resetBall();
    };

    // Initial ball position
    resetBall();

    // Input handling for player controls
    const keys: { [key: string]: boolean } = {};
    
    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                keys[kbInfo.event.key] = true;
                
                // Camera position controls
                switch (kbInfo.event.key) {
                    case '1':  // Initial position
                        camera.alpha = -Math.PI / 2;
                        camera.beta = Math.PI / 2.5;
                        camera.radius = 15;
                        break;
                    case '2':  // Opposite view
                        camera.alpha = Math.PI / 2;
                        camera.beta = Math.PI / 2.5;
                        camera.radius = 15;
                        break;
                    case '3':  // Perfect top view
                        camera.alpha = -Math.PI / 2;  // -90 degrees
                        camera.beta = 0;              // 0 degrees (directly above)
                        camera.radius = 20;
                        break;
                    case '4':  // Top view rotated 180°
                        camera.alpha = Math.PI / 2;   // 90 degrees (rotated 180° from position 3)
                        camera.beta = 0;              // 0 degrees (directly above)
                        camera.radius = 20;
                        break;
                }
                break;
            case BABYLON.KeyboardEventTypes.KEYUP:
                keys[kbInfo.event.key] = false;
                break;
        }
    });

    // Game loop
    scene.onBeforeRenderObservable.add(() => {
        // Reset debug text
        debugText.text = "Debug Info:";
        debugText.text += "\nControls:";
        debugText.text += "\nBox1: A/D (limits: -5 to 5)";
        if (isMultiplayer) {
            debugText.text += "\nBox2: J/L (limits: -5 to 5)";
        } else {
            debugText.text += "\nBox2: AI Controlled";
        }
        debugText.text += "\nCamera: 1 (initial view), 2 (opposite view), 3 (top view), 4 (box2 view)";
        
        if (isGameOver) return;

        // Calculate next positions first
        let nextBox1X = box1.position.x;
        let nextBox2X = box2.position.x;
        
        // Player 1 controls (A/D)
        if (keys["a"]) {
            nextBox1X = Math.max(
                SETTINGS.boxes.movementLimits.box1.min,
                box1.position.x - SETTINGS.boxes.movementSpeed
            );
        }
        if (keys["d"]) {
            nextBox1X = Math.min(
                SETTINGS.boxes.movementLimits.box1.max,
                box1.position.x + SETTINGS.boxes.movementSpeed
            );
        }
        
        // Player 2 controls (J/L) or AI
        if (isMultiplayer) {
            if (keys["j"]) {
                nextBox2X = Math.max(
                    SETTINGS.boxes.movementLimits.box2.min,
                    box2.position.x - SETTINGS.boxes.movementSpeed
                );
            }
            if (keys["l"]) {
                nextBox2X = Math.min(
                    SETTINGS.boxes.movementLimits.box2.max,
                    box2.position.x + SETTINGS.boxes.movementSpeed
                );
            }
        } else if (ai) {
            // Update AI and get simulated key presses
            const aiKeys = ai.update(ball.position, ballVelocity, box2.position);
            
            if (aiKeys["j"]) {
                nextBox2X = Math.max(
                    SETTINGS.boxes.movementLimits.box2.min,
                    box2.position.x - SETTINGS.boxes.movementSpeed
                );
            }
            if (aiKeys["l"]) {
                nextBox2X = Math.min(
                    SETTINGS.boxes.movementLimits.box2.max,
                    box2.position.x + SETTINGS.boxes.movementSpeed
                );
            }
        }

        // Apply validated positions
        box1.position.x = nextBox1X;
        box2.position.x = nextBox2X;
        
        // Calculate next ball position
        const nextBallPosition = ball.position.add(ballVelocity);
        
        // Ball collision with east/west walls
        if (Math.abs(nextBallPosition.x) >= SETTINGS.playArea.width/2 - SETTINGS.ball.diameter/2) {
            // Reverse x velocity
            ballVelocity.x *= -1;
            
            // Adjust ball position to prevent sticking to walls
            const wallX = Math.sign(nextBallPosition.x) * (SETTINGS.playArea.width/2 - SETTINGS.ball.diameter/2);
            ball.position.x = wallX;
            return; // Skip this frame's movement to prevent wall penetration
        } else {
            // Move ball if no wall collision
            ball.position = nextBallPosition;
        }
        
        // Detection variables
        const ballRadius = SETTINGS.ball.diameter/2;
        const boxHalfWidth = SETTINGS.boxes.width/2;
        const boxHalfDepth = SETTINGS.boxes.depth/2;
        let boxCollision = false;
        
        // Box 1 collision (south)
        if (ball.position.z <= SETTINGS.boxes.initialPositions.box1.z + boxHalfDepth + ballRadius && 
            ball.position.z >= SETTINGS.boxes.initialPositions.box1.z - boxHalfDepth && 
            Math.abs(ball.position.x - box1.position.x) <= boxHalfWidth) {
            
            // Adjust ball position to prevent sticking
            ball.position.z = SETTINGS.boxes.initialPositions.box1.z + boxHalfDepth + ballRadius;
            
            // Store current speed before changes
            const currentSpeed = Math.sqrt(ballVelocity.x * ballVelocity.x + ballVelocity.z * ballVelocity.z);
            
            // Reverse z direction
            ballVelocity.z *= -1;
            
            // Add angle based on where the ball hits the paddle
            const hitPosition = (ball.position.x - box1.position.x) / boxHalfWidth; // -1 to 1
            
            // Calculate new direction vector
            const newVelocityX = hitPosition * Math.abs(ballVelocity.z); // Scale x component based on hit position
            const newVelocityZ = Math.sign(ballVelocity.z) * Math.sqrt(currentSpeed * currentSpeed - newVelocityX * newVelocityX);
            
            // Apply new direction
            ballVelocity.x = newVelocityX;
            ballVelocity.z = newVelocityZ;
            
            // Increase speed with new cap (5x max speed)
            const maxAllowedSpeed = SETTINGS.ball.maxSpeed * 5;
            const newSpeed = Math.min(currentSpeed * (1 + SETTINGS.ball.speedIncrement), maxAllowedSpeed);
            
            // Scale to new speed while maintaining direction
            const scaleFactor = newSpeed / currentSpeed;
            ballVelocity.x *= scaleFactor;
            ballVelocity.z *= scaleFactor;
            
            boxCollision = true;
        }
        
        // Box 2 collision (north)
        if (ball.position.z >= SETTINGS.boxes.initialPositions.box2.z - boxHalfDepth - ballRadius && 
            ball.position.z <= SETTINGS.boxes.initialPositions.box2.z + boxHalfDepth && 
            Math.abs(ball.position.x - box2.position.x) <= boxHalfWidth) {
            
            // Adjust ball position to prevent sticking
            ball.position.z = SETTINGS.boxes.initialPositions.box2.z - boxHalfDepth - ballRadius;
            
            // Store current speed before changes
            const currentSpeed = Math.sqrt(ballVelocity.x * ballVelocity.x + ballVelocity.z * ballVelocity.z);
            
            // Reverse z direction
            ballVelocity.z *= -1;
            
            // Add angle based on where the ball hits the paddle
            const hitPosition = (ball.position.x - box2.position.x) / boxHalfWidth; // -1 to 1
            
            // Calculate new direction vector
            const newVelocityX = hitPosition * Math.abs(ballVelocity.z); // Scale x component based on hit position
            const newVelocityZ = Math.sign(ballVelocity.z) * Math.sqrt(currentSpeed * currentSpeed - newVelocityX * newVelocityX);
            
            // Apply new direction
            ballVelocity.x = newVelocityX;
            ballVelocity.z = newVelocityZ;
            
            // Increase speed with new cap (5x max speed)
            const maxAllowedSpeed = SETTINGS.ball.maxSpeed * 5;
            const newSpeed = Math.min(currentSpeed * (1 + SETTINGS.ball.speedIncrement), maxAllowedSpeed);
            
            // Scale to new speed while maintaining direction
            const scaleFactor = newSpeed / currentSpeed;
            ballVelocity.x *= scaleFactor;
            ballVelocity.z *= scaleFactor;
            
            boxCollision = true;
        }

        // Check score zone collisions (north and south) only if no box collision occurred
        if (!boxCollision) { 
            if (ball.position.z >= SETTINGS.scoreZones.north) {
                // Player 1 scored
                updateScore(true);
            } else if (ball.position.z <= SETTINGS.scoreZones.south) {
                // Player 2 scored
                updateScore(false);
            }
        }

        // Update debug text with ball position
        debugText.text += `\nBall: X=${ball.position.x.toFixed(2)}, Z=${ball.position.z.toFixed(2)}`;
        // Only show scores in debug, not as UI elements
        debugText.text += `\nScore: ${player1Score} - ${player2Score}`;
    });

    // Return game instance with cleanup
    return {
        scene,
        camera,
        getScores: () => {
            return { player1Score, player2Score, isGameOver };
        },
        resetGame: () => {
            // Reset scores
            player1Score = 0;
            player2Score = 0;
            isGameOver = false;
            gameStatusText.text = "";
            
            // Reset ball position and velocity
            resetBall();
            
            // Reset paddle positions
            box1.position = new BABYLON.Vector3(
                SETTINGS.boxes.initialPositions.box1.x,
                SETTINGS.boxes.initialPositions.box1.y,
                SETTINGS.boxes.initialPositions.box1.z
            );
            box2.position = new BABYLON.Vector3(
                SETTINGS.boxes.initialPositions.box2.x,
                SETTINGS.boxes.initialPositions.box2.y,
                SETTINGS.boxes.initialPositions.box2.z
            );
            
            // Update scores via callback
            if (onScoreUpdate) {
                onScoreUpdate(player1Score, player2Score, isGameOver);
            }
            
            // Make sure the canvas maintains focus
            setTimeout(() => {
                canvas.focus();
            }, 0);
        },
        dispose: () => {
            if (ai) {
                ai.dispose();
            }
            scene.dispose();
        }
    };
}; 