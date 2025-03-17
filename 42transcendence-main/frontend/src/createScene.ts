import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

// Game Settings
const SETTINGS = {
    playArea: {
        width: 10,
        height: 20
    },
    ball: {
        diameter: 0.5,
        speed: 0.1
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
            box1: { min: -5, max: 5 },
            box2: { min: -5, max: 5 }
        },
        movementSpeed: 0.05
    },
    scoreZones: {
        north: 9.75,  // Distance from center where scoring occurs
        south: -9.75  // Distance from center where scoring occurs
    }
};

export const createScene = function (engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
    const scene = new BABYLON.Scene(engine);

    // Camera and light
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, false);
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
    const ball = BABYLON.MeshBuilder.CreateSphere("ball", {diameter: 0.5}, scene);
    ball.position = new BABYLON.Vector3(0, 0.5, 0);  // y=0.5 to place it just above the ground
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

    // Add debug text
    const debugText = new GUI.TextBlock();
    debugText.text = "Waiting for key press...\nControls:\nBox1: A/D (limits: 0 to 5)\nBox2: J/L (limits: -5 to 5)\nCamera: 1 (initial view), 2 (opposite view), 3 (top view), 4 (box2 view)";
    debugText.color = "white";
    debugText.fontSize = 14;  // Smaller font size
    debugText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    debugText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    debugText.paddingTop = "10px";
    debugText.paddingLeft = "10px";

    // Create Advanced Dynamic Texture
    const adt = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
    adt.addControl(debugText);

    // Object to track pressed keys
    const keysPressed: { [key: string]: boolean } = {};

    // Add keyboard controls
    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                keysPressed[kbInfo.event.key] = true;
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
                debugText.text = `Keys pressed: ${Object.keys(keysPressed).join(', ')}\nControls:\nBox1: A/D (limits: 0 to 5)\nBox2: J/L (limits: -5 to 5)\nCamera: 1 (initial view), 2 (opposite view), 3 (top view), 4 (box2 view)`;
                break;
            case BABYLON.KeyboardEventTypes.KEYUP:
                delete keysPressed[kbInfo.event.key];
                debugText.text = `Keys pressed: ${Object.keys(keysPressed).join(', ')}`;
                break;
        }
    });

    // Ball physics properties
    const ballSpeed = SETTINGS.ball.speed;
    const randomAngle = Math.random() * Math.PI * 2;
    let ballVelocity = new BABYLON.Vector3(
        Math.cos(randomAngle) * ballSpeed,
        0,
        Math.sin(randomAngle) * ballSpeed
    );

    // Function to reset ball to center with random direction
    const resetBall = () => {
        ball.position = new BABYLON.Vector3(0, 0.5, 0);
        
        // Generate angle within two arcs (towards boxes)
        // Random number between 0 and 1
        const rand = Math.random();
        let randomAngle;
        
        if (rand < 0.5) {
            // Towards box1: angle between 225° and 315° (or -135° to -45°)
            randomAngle = (-135 + rand * 90) * Math.PI / 180;
        } else {
            // Towards box2: angle between 45° and 135°
            randomAngle = (45 + (rand - 0.5) * 90) * Math.PI / 180;
        }
        
        ballVelocity = new BABYLON.Vector3(
            Math.cos(randomAngle) * ballSpeed,
            0,
            Math.sin(randomAngle) * ballSpeed
        );
    };

    // Register before render loop
    scene.registerBeforeRender(() => {
        let newPosition;
        const paddlemvtspeed = SETTINGS.boxes.movementSpeed;

        // Move box1
        if (keysPressed['a']) {
            newPosition = box1.position.x - paddlemvtspeed;
            if (newPosition >= SETTINGS.boxes.movementLimits.box1.min) {
                box1.position.x = newPosition;
            }
        }
        if (keysPressed['d']) {
            newPosition = box1.position.x + paddlemvtspeed;
            if (newPosition <= SETTINGS.boxes.movementLimits.box1.max) {
                box1.position.x = newPosition;
            }
        }

        // Move box2
        if (keysPressed['l']) {
            newPosition = box2.position.x - paddlemvtspeed;
            if (newPosition >= SETTINGS.boxes.movementLimits.box2.min) {
                box2.position.x = newPosition;
            }
        }
        if (keysPressed['j']) {
            newPosition = box2.position.x + paddlemvtspeed;
            if (newPosition <= SETTINGS.boxes.movementLimits.box2.max) {
                box2.position.x = newPosition;
            }
        }

        // Update debug text with positions
        if (keysPressed['a'] || keysPressed['d'] || keysPressed['j'] || keysPressed['l']) {
            debugText.text += `\nBox1: X=${box1.position.x.toFixed(2)}, Y=${box1.position.y.toFixed(2)}, Z=${box1.position.z.toFixed(2)}`;
            debugText.text += `\nBox2: X=${box2.position.x.toFixed(2)}, Y=${box2.position.y.toFixed(2)}, Z=${box2.position.z.toFixed(2)}`;
        }

        // Ball movement and collision
        ball.position.addInPlace(ballVelocity);

        // Check side wall collisions (east and west)
        if (Math.abs(ball.position.x) >= 4.75) { // Accounting for ball radius
            ballVelocity.x *= -1; // Reverse x direction
        }

        // Check box collisions
        const ballRadius = 0.25; // Half of ball's diameter
        const boxHalfWidth = 1;  // Half of box's width
        const boxHalfDepth = 0.25; // Half of box's depth

        let boxCollision = false;

        // Box1 collision (south box)
        if (ball.position.z <= box1.position.z + boxHalfDepth && 
            ball.position.z >= box1.position.z - boxHalfDepth &&
            Math.abs(ball.position.x - box1.position.x) <= boxHalfWidth + ballRadius) {
            ballVelocity.z *= -1; // Reverse z direction
            boxCollision = true;
        }

        // Box2 collision (north box)
        if (ball.position.z >= box2.position.z - boxHalfDepth && 
            ball.position.z <= box2.position.z + boxHalfDepth &&
            Math.abs(ball.position.x - box2.position.x) <= boxHalfWidth + ballRadius) {
            ballVelocity.z *= -1; // Reverse z direction
            boxCollision = true;
        }

        // Check score zone collisions (north and south) only if no box collision occurred
        if (!boxCollision && 
            (ball.position.z >= SETTINGS.scoreZones.north || 
             ball.position.z <= SETTINGS.scoreZones.south)) { 
            resetBall(); // Reset ball to center with new random direction
        }

        // Update debug text with ball position
        debugText.text += `\nBall: X=${ball.position.x.toFixed(2)}, Z=${ball.position.z.toFixed(2)}`;
    });

    return scene;
}; 