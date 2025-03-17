const createScene = () => {
    const scene = new BABYLON.Scene(engine);

    /**** Set camera and light *****/
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, new BABYLON.Vector3(0, 0, 0));
    camera.attachControl(canvas, false);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));

    // First box (original)
    const box1 = BABYLON.MeshBuilder.CreateBox("box1", {width: 2, height: 0.5, depth: 0.5})
    box1.position.y = 0.5;
    box1.position = new BABYLON.Vector3(0, 0, -5);

    // Second box
    const box2 = BABYLON.MeshBuilder.CreateBox("box2", {width: 2, height: 0.5, depth: 0.5})
    box2.position.y = 0.5;
    box2.position = new BABYLON.Vector3(0, 0, 5);

    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:10, height:10});

    // Add debug text
    const debugText = new BABYLON.GUI.TextBlock();
    debugText.text = "Waiting for key press...\nControls:\nBox1: A/D\nBox2: J/L";
    debugText.color = "white";
    debugText.fontSize = 24;

    // Create Advanced Dynamic Texture
    const adt = new BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    adt.addControl(debugText);

    // Object to track pressed keys
    const keysPressed = {};

    // Add keyboard controls
    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                keysPressed[kbInfo.event.key] = true;
                debugText.text = `Keys pressed: ${Object.keys(keysPressed).join(', ')}`;
                break;
            case BABYLON.KeyboardEventTypes.KEYUP:
                delete keysPressed[kbInfo.event.key];
                debugText.text = `Keys pressed: ${Object.keys(keysPressed).join(', ')}`;
                break;
        }
    });

    // Register before render loop to move boxes based on pressed keys
    scene.registerBeforeRender(() => {
        // Move box1
        if (keysPressed['a']) {
            box1.position.x -= 0.01;
        }
        if (keysPressed['d']) {
            box1.position.x += 0.01;
        }

        // Move box2
        if (keysPressed['j']) {
            box2.position.x -= 0.01;
        }
        if (keysPressed['l']) {
            box2.position.x += 0.01;
        }

        // Update debug text with positions
        if (keysPressed['a'] || keysPressed['d'] || keysPressed['j'] || keysPressed['l']) {
            debugText.text += `\nBox1: X=${box1.position.x.toFixed(2)}, Y=${box1.position.y.toFixed(2)}, Z=${box1.position.z.toFixed(2)}`;
            debugText.text += `\nBox2: X=${box2.position.x.toFixed(2)}, Y=${box2.position.y.toFixed(2)}, Z=${box2.position.z.toFixed(2)}`;
        }
    });

    return scene;
}