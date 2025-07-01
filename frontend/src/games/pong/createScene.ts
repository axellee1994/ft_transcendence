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
        baseSpeed: 0.2,
        minSpeed: 0.15,
        maxSpeed: 0.25,
        speedIncrement: 0.05
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
            box1: { min: -4, max: 4 },
            box2: { min: -4, max: 4 }
        },
        movementSpeed: 0.1
    },
    scoreZones: {
        north: 9.75,
        south: -9.75
    },
    maxScore: 3
};

export const createScene = function (
    engine: BABYLON.Engine,
    canvas: HTMLCanvasElement,
    onScoreUpdate?: ScoreUpdateCallback,
    isMultiplayer: boolean = false,
    initialPlayer1Score: number = 0,
    initialPlayer2Score: number = 0
) {
    const scene = new BABYLON.Scene(engine);
    
    const PAUSE_STORAGE_KEY = 'pongGamePaused';
    const persistedPause = sessionStorage.getItem(PAUSE_STORAGE_KEY);
    let isPaused = false;
    console.log('[Pong] Checking for persisted pause state:', persistedPause);
    if (persistedPause === 'true') {
        isPaused = true;
        console.log('[Pong] Resuming in paused state from sessionStorage.');
        sessionStorage.removeItem(PAUSE_STORAGE_KEY);
    }

    let player1Score = initialPlayer1Score;
    let player2Score = initialPlayer2Score;
    let isGameOver = false;
    console.log(`[Pong] Initializing scene with scores: P1=${player1Score}, P2=${player2Score}`);

    const ai = !isMultiplayer ? new PongAI() : null;

    canvas.tabIndex = 1;
    
    canvas.addEventListener('click', () => {
        canvas.focus();
    });
    
    canvas.addEventListener('pointerdown', () => {
        canvas.focus();
    });

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, false);
    
    scene.activeCamera = camera;
    scene.activeCamera.update();
    
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

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

    const ball = BABYLON.MeshBuilder.CreateSphere("ball", {diameter: SETTINGS.ball.diameter}, scene);
    ball.position = new BABYLON.Vector3(0, SETTINGS.ball.diameter/2, 0);
    ball.material = new BABYLON.StandardMaterial("ballMaterial", scene);
    (ball.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(1, 0, 0);

    const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
    wallMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    
    const wallsConfig = [
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

    const ground = BABYLON.MeshBuilder.CreateGround("ground", {
        width: SETTINGS.playArea.width, 
        height: SETTINGS.playArea.height
    }, scene);

    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
    
    const gameStatusText = new GUI.TextBlock();
    gameStatusText.text = "";
    gameStatusText.color = "white";
    gameStatusText.fontSize = 24;
    gameStatusText.top = "0px";
    gameStatusText.isVisible = false;
    advancedTexture.addControl(gameStatusText);

    const debugText = new GUI.TextBlock();
    debugText.text = "Debug Info:";
    debugText.color = "white";
    debugText.fontSize = 18;
    debugText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    debugText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    debugText.top = "10px";
    debugText.left = "10px";
    advancedTexture.addControl(debugText);

    const pauseContainer = new GUI.Rectangle("pauseContainer");
    pauseContainer.width = "250px";
    pauseContainer.height = "100px";
    pauseContainer.cornerRadius = 10;
    pauseContainer.background = "rgba(0, 0, 0, 0.7)";
    pauseContainer.thickness = 0;
    pauseContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    pauseContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    pauseContainer.isVisible = isPaused;
    pauseContainer.isHitTestVisible = false;
    advancedTexture.addControl(pauseContainer);

    const pauseText = new GUI.TextBlock("pauseText", "Paused");
    pauseText.color = "white";
    pauseText.fontSize = 48;
    pauseText.fontWeight = "bold"; 
    pauseText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    pauseText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    pauseContainer.addControl(pauseText);

    const ballVelocity = new BABYLON.Vector3(
        (Math.random() * 2 - 1) * SETTINGS.ball.baseSpeed,
        0,
        (Math.random() * 2 - 1) * SETTINGS.ball.baseSpeed
    );

    const resetBall = () => {
        ball.position = new BABYLON.Vector3(0, SETTINGS.ball.diameter/2, 0);
        
        let angle;
        if (Math.random() < 0.5) {
            angle = (Math.random() * 120 + 30) * Math.PI / 180;
        } else {
            angle = (Math.random() * 120 + 210) * Math.PI / 180;
        }
        
        const speed = SETTINGS.ball.baseSpeed;
        ballVelocity.x = Math.cos(angle) * speed;
        ballVelocity.z = Math.sin(angle) * speed;
        
        console.log(`Ball reset with velocity: x=${ballVelocity.x.toFixed(3)}, z=${ballVelocity.z.toFixed(3)}`);
    };
    
    const updateScore = (isPlayer1Scored: boolean) => {
        if (isGameOver) return;
        
        if (isPlayer1Scored) {
            player1Score++;
        } else {
            player2Score++;
        }
        
        if (player1Score >= SETTINGS.maxScore || player2Score >= SETTINGS.maxScore) {
            isGameOver = true;
            gameStatusText.text = player1Score > player2Score ? "Player 1 Wins!" : "Player 2 Wins!";
            
            if (onScoreUpdate) {
                onScoreUpdate(player1Score, player2Score, isGameOver);
            }
            
            return;
        }
        
        if (onScoreUpdate) {
            onScoreUpdate(player1Score, player2Score, isGameOver);
        }
        
        resetBall();
    };

    resetBall();

    const keys: { [key: string]: boolean } = {};
    
    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                keys[kbInfo.event.key] = true;
                if (kbInfo.event.key === 'p' || kbInfo.event.key === 'P') {
                    isPaused = !isPaused;
                    pauseContainer.isVisible = isPaused;
                    if (isPaused) {
                        sessionStorage.setItem(PAUSE_STORAGE_KEY, 'true');
                    } else {
                        sessionStorage.removeItem(PAUSE_STORAGE_KEY);
                    }
                    kbInfo.event.preventDefault();
                }

                switch (kbInfo.event.key) {
                    case '1':
                        camera.alpha = -Math.PI / 2;
                        camera.beta = Math.PI / 2.5;
                        camera.radius = 15;
                        break;
                    case '2':
                        camera.alpha = Math.PI / 2;
                        camera.beta = Math.PI / 2.5;
                        camera.radius = 15;
                        break;
                    case '3':
                        camera.alpha = -Math.PI / 2;
                        camera.beta = 0;
                        camera.radius = 20;
                        break;
                    case '4':
                        camera.alpha = Math.PI / 2;
                        camera.beta = 0;
                        camera.radius = 20;
                        break;
                }
                break;
            case BABYLON.KeyboardEventTypes.KEYUP:
                keys[kbInfo.event.key] = false;
                break;
        }
    });

    scene.onBeforeRenderObservable.add(() => {
        if (isPaused)
            return; 
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

        let nextBox1X = box1.position.x;
        let nextBox2X = box2.position.x;
        
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
        
        if (isMultiplayer) {
            if (keys["j"]) {
                nextBox2X = Math.min(
                    SETTINGS.boxes.movementLimits.box2.max,
                    box2.position.x + SETTINGS.boxes.movementSpeed
                );
            }
            if (keys["l"]) {
                nextBox2X = Math.max(
                    SETTINGS.boxes.movementLimits.box2.min,
                    box2.position.x - SETTINGS.boxes.movementSpeed
                );
            }
        } else if (ai) {
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

        box1.position.x = nextBox1X;
        box2.position.x = nextBox2X;
        
        const nextBallPosition = ball.position.add(ballVelocity);
        
        if (Math.abs(nextBallPosition.x) >= SETTINGS.playArea.width/2 - SETTINGS.ball.diameter/2) {
            ballVelocity.x *= -1;
            
            const wallX = Math.sign(nextBallPosition.x) * (SETTINGS.playArea.width/2 - SETTINGS.ball.diameter/2);
            ball.position.x = wallX;
            return;
        } else {
            ball.position = nextBallPosition;
        }
        
        const ballRadius = SETTINGS.ball.diameter/2;
        const boxHalfWidth = SETTINGS.boxes.width/2;
        const boxHalfDepth = SETTINGS.boxes.depth/2;
        let boxCollision = false;
        
        if (ball.position.z <= SETTINGS.boxes.initialPositions.box1.z + boxHalfDepth + ballRadius && 
            ball.position.z >= SETTINGS.boxes.initialPositions.box1.z - boxHalfDepth && 
            Math.abs(ball.position.x - box1.position.x) <= boxHalfWidth) {
            
            ball.position.z = SETTINGS.boxes.initialPositions.box1.z + boxHalfDepth + ballRadius;
            
            const currentSpeed = Math.sqrt(ballVelocity.x * ballVelocity.x + ballVelocity.z * ballVelocity.z);
            
            ballVelocity.z *= -1;
            
            const hitPosition = (ball.position.x - box1.position.x) / boxHalfWidth;
            
            const newVelocityX = hitPosition * Math.abs(ballVelocity.z);
            const newVelocityZ = Math.sign(ballVelocity.z) * Math.sqrt(currentSpeed * currentSpeed - newVelocityX * newVelocityX);
            
            ballVelocity.x = newVelocityX;
            ballVelocity.z = newVelocityZ;
            
            const maxAllowedSpeed = SETTINGS.ball.maxSpeed * 5;
            const newSpeed = Math.min(currentSpeed * (1 + SETTINGS.ball.speedIncrement), maxAllowedSpeed);
            
            const scaleFactor = newSpeed / currentSpeed;
            ballVelocity.x *= scaleFactor;
            ballVelocity.z *= scaleFactor;
            
            boxCollision = true;
        }
        
        if (ball.position.z >= SETTINGS.boxes.initialPositions.box2.z - boxHalfDepth - ballRadius && 
            ball.position.z <= SETTINGS.boxes.initialPositions.box2.z + boxHalfDepth && 
            Math.abs(ball.position.x - box2.position.x) <= boxHalfWidth) {
            
            ball.position.z = SETTINGS.boxes.initialPositions.box2.z - boxHalfDepth - ballRadius;
            
            const currentSpeed = Math.sqrt(ballVelocity.x * ballVelocity.x + ballVelocity.z * ballVelocity.z);
            
            ballVelocity.z *= -1;
            
            const hitPosition = (ball.position.x - box2.position.x) / boxHalfWidth;
            
            const newVelocityX = hitPosition * Math.abs(ballVelocity.z);
            const newVelocityZ = Math.sign(ballVelocity.z) * Math.sqrt(currentSpeed * currentSpeed - newVelocityX * newVelocityX);
            
            ballVelocity.x = newVelocityX;
            ballVelocity.z = newVelocityZ;
            
            const maxAllowedSpeed = SETTINGS.ball.maxSpeed * 5;
            const newSpeed = Math.min(currentSpeed * (1 + SETTINGS.ball.speedIncrement), maxAllowedSpeed);
            
            const scaleFactor = newSpeed / currentSpeed;
            ballVelocity.x *= scaleFactor;
            ballVelocity.z *= scaleFactor;
            
            boxCollision = true;
        }

        if (!boxCollision) { 
            if (ball.position.z >= SETTINGS.scoreZones.north) {
                updateScore(true);
            } else if (ball.position.z <= SETTINGS.scoreZones.south) {
                updateScore(false);
            }
        }

        debugText.text += `\nBall: X=${ball.position.x.toFixed(2)}, Z=${ball.position.z.toFixed(2)}`;
        debugText.text += `\nScore: ${player1Score} - ${player2Score}`;
    });

    const handleBeforeUnload = () => {
        console.log('[Pong] beforeunload event triggered. Current isPaused:', isPaused);
        if (!isPaused) {
            console.log('[Pong] Game was running, saving pause state to sessionStorage.');
            sessionStorage.setItem(PAUSE_STORAGE_KEY, 'true');
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return {
        scene,
        camera,
        getScores: () => {
            return { player1Score, player2Score, isGameOver };
        },
        resetGame: () => {
            player1Score = 0;
            player2Score = 0;
            isGameOver = false;
            isPaused = false;
            pauseContainer.isVisible = false;
            sessionStorage.removeItem(PAUSE_STORAGE_KEY);
            gameStatusText.text = "";
            resetBall();
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
            
            if (onScoreUpdate) {
                onScoreUpdate(player1Score, player2Score, isGameOver);
            }
            
            setTimeout(() => {
                canvas.focus();
            }, 0);
        },
        dispose: () => {
            console.log('[Pong] Removing beforeunload listener.');
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (ai) {
                ai.dispose();
            }
            scene.dispose();
        },
        isPaused: () => isPaused
    };
}; 