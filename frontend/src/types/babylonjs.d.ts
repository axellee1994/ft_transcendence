declare module '@babylonjs/core' {
    export class Engine {
        constructor(canvas: HTMLCanvasElement, antialias?: boolean, options?: any);
        runRenderLoop(callback: () => void): void;
        resize(): void;
    }

    export class Scene {
        constructor(engine: Engine);
        clearColor: Color4;
        render(): void;
        registerBeforeRender(callback: () => void): void;
    }

    export class Vector3 {
        constructor(x: number, y: number, z: number);
        static Zero(): Vector3;
        x: number;
        y: number;
        z: number;
    }

    export class Color3 {
        constructor(r: number, g: number, b: number);
    }

    export class Color4 {
        constructor(r: number, g: number, b: number, a: number);
    }

    export class ArcRotateCamera {
        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene: Scene);
        attachControl(canvas: HTMLCanvasElement, noPreventDefault?: boolean): void;
        setPosition(position: Vector3): void;
    }

    export class HemisphericLight {
        constructor(name: string, direction: Vector3, scene: Scene);
        intensity: number;
    }

    export class StandardMaterial {
        constructor(name: string, scene: Scene);
        diffuseColor: Color3;
    }

    export namespace MeshBuilder {
        export function CreateBox(name: string, options: { size?: number }, scene: Scene): Mesh;
    }

    export class Mesh {
        position: Vector3;
        rotation: Vector3;
        material: StandardMaterial;
    }
} 