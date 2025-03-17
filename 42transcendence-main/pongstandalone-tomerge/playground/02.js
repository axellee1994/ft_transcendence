const createScene = () => {
    const scene = new BABYLON.Scene(engine);

    /**** Set camera and light *****/
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, new BABYLON.Vector3(0, 0, 0));
    // Disable camera controls
    camera.attachControl(canvas, false);  // Set to false to disable controls
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

    // Add keyboard controls with debug output
    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                debugText.text = `Key pressed: ${kbInfo.event.key}`;
                switch(kbInfo.event.key) {
                    // Controls for first box
                    case 'a':
                        box1.position = new BABYLON.Vector3(
                            box1.position.x - 0.01,
                            box1.position.y,
                            box1.position.z
                        );
                        debugText.text += `\nBox1 position: X=${box1.position.x.toFixed(2)}, Y=${box1.position.y.toFixed(2)}, Z=${box1.position.z.toFixed(2)}`;
                        break;
                    case 'd':
                        box1.position = new BABYLON.Vector3(
                            box1.position.x + 0.01,
                            box1.position.y,
                            box1.position.z
                        );
                        debugText.text += `\nBox1 position: X=${box1.position.x.toFixed(2)}, Y=${box1.position.y.toFixed(2)}, Z=${box1.position.z.toFixed(2)}`;
                        break;
                    
                    // Controls for second box (using j and l instead of arrow keys)
                    case 'j':
                        box2.position = new BABYLON.Vector3(
                            box2.position.x - 0.01,
                            box2.position.y,
                            box2.position.z
                        );
                        debugText.text += `\nBox2 position: X=${box2.position.x.toFixed(2)}, Y=${box2.position.y.toFixed(2)}, Z=${box2.position.z.toFixed(2)}`;
                        break;
                    case 'l':
                        box2.position = new BABYLON.Vector3(
                            box2.position.x + 0.01,
                            box2.position.y,
                            box2.position.z
                        );
                        debugText.text += `\nBox2 position: X=${box2.position.x.toFixed(2)}, Y=${box2.position.y.toFixed(2)}, Z=${box2.position.z.toFixed(2)}`;
                        break;
                }
                break;
        }
    });

    return scene;
}