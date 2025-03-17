import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

export const createScene = function (engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
    const scene = new BABYLON.Scene(engine);

    // Camera and light
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, false);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

    // First box
    const box1 = BABYLON.MeshBuilder.CreateBox("box1", {width: 2, height: 0.5, depth: 0.5}, scene);
    box1.position.y = 0.5;
    box1.position = new BABYLON.Vector3(0, 0, -5);
    box1.material = new BABYLON.StandardMaterial("box1Material", scene);
    (box1.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(0, 0, 1); // Blue

    // Second box
    const box2 = BABYLON.MeshBuilder.CreateBox("box2", {width: 2, height: 0.5, depth: 0.5}, scene);
    box2.position.y = 0.5;
    box2.position = new BABYLON.Vector3(0, 0, 5);
    box2.material = new BABYLON.StandardMaterial("box2Material", scene);
    (box2.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(0, 1, 0); // Green

    // Add sphere in the center
    const ball = BABYLON.MeshBuilder.CreateSphere("ball", {diameter: 0.5}, scene);
    ball.position = new BABYLON.Vector3(0, 0.5, 0);  // y=0.5 to place it just above the ground
    ball.material = new BABYLON.StandardMaterial("ballMaterial", scene);
    (ball.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(1, 0, 0); // Red

    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:10, height:10}, scene);

    // Add debug text
    const debugText = new GUI.TextBlock();
    debugText.text = "Waiting for key press...\nControls:\nBox1: A/D (limits: 0 to 5)\nBox2: J/L (limits: -5 to 5)\nCamera: 1 (initial view), 2 (opposite view), 3 (top view)";
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
                        camera.radius = 10;
                        break;
                    case '2':  // Opposite view
                        camera.alpha = Math.PI / 2;
                        camera.beta = Math.PI / 2.5;
                        camera.radius = 10;
                        break;
                    case '3':  // Top view
                        camera.alpha = -Math.PI / 2;
                        camera.beta = 0.1;
                        camera.radius = 15;
                        break;
                }
                debugText.text = `Keys pressed: ${Object.keys(keysPressed).join(', ')}`;
                break;
            case BABYLON.KeyboardEventTypes.KEYUP:
                delete keysPressed[kbInfo.event.key];
                debugText.text = `Keys pressed: ${Object.keys(keysPressed).join(', ')}`;
                break;
        }
    });

    // Register before render loop
    scene.registerBeforeRender(() => {
        let newPosition;
        const paddlemvtspeed = 0.05;

        // Move box1
        if (keysPressed['a']) {
            newPosition = box1.position.x - paddlemvtspeed;
            if (newPosition >= -5) {
                box1.position.x = newPosition;
            }
        }
        if (keysPressed['d']) {
            newPosition = box1.position.x + paddlemvtspeed;
            if (newPosition <= 5) {
                box1.position.x = newPosition;
            }
        }

        // Move box2
        if (keysPressed['l']) {
            newPosition = box2.position.x - paddlemvtspeed;
            if (newPosition >= -5) {
                box2.position.x = newPosition;
            }
        }
        if (keysPressed['j']) {
            newPosition = box2.position.x + paddlemvtspeed;
            if (newPosition <= 5) {
                box2.position.x = newPosition;
            }
        }

        // Update debug text with positions
        if (keysPressed['a'] || keysPressed['d'] || keysPressed['j'] || keysPressed['l']) {
            debugText.text += `\nBox1: X=${box1.position.x.toFixed(2)}, Y=${box1.position.y.toFixed(2)}, Z=${box1.position.z.toFixed(2)}`;
            debugText.text += `\nBox2: X=${box2.position.x.toFixed(2)}, Y=${box2.position.y.toFixed(2)}, Z=${box2.position.z.toFixed(2)}`;
        }
    });

    return scene;
}; 