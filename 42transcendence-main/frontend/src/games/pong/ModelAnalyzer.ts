import * as BABYLON from 'babylonjs';

export class ModelAnalyzer {
    static analyzeModelDimensions(scene: BABYLON.Scene) {
        const meshes = scene.meshes;
        
        meshes.forEach(mesh => {
            const boundingBox = mesh.getBoundingInfo();
            const min = boundingBox.boundingBox.minimumWorld;
            const max = boundingBox.boundingBox.maximumWorld;
            
            const dimensions = {
                width: Math.abs(max.x - min.x),
                height: Math.abs(max.y - min.y),
                depth: Math.abs(max.z - min.z)
            };
            
            const volume = dimensions.width * dimensions.height * dimensions.depth;
            const center = boundingBox.boundingBox.centerWorld;
            
            console.log(`\nModel Analysis for: ${mesh.name}`);
            console.log('Dimensions:', dimensions);
            console.log('Volume:', volume);
            console.log('Center:', center);
            console.log('Current Scale:', mesh.scaling.toString());
            
            // Get absolute size
            const size = boundingBox.boundingBox.extendSize;
            const absoluteSize = size.scale(2);
            console.log('Absolute size in world units:', absoluteSize);
        });
    }

    static compareModelScales(meshA: BABYLON.AbstractMesh, meshB: BABYLON.AbstractMesh) {
        const sizeA = meshA.getBoundingInfo().boundingBox.extendSize;
        const sizeB = meshB.getBoundingInfo().boundingBox.extendSize;
        
        const volumeA = sizeA.x * sizeA.y * sizeA.z;
        const volumeB = sizeB.x * sizeB.y * sizeB.z;
        
        const scaleRatio = volumeA / volumeB;
        
        console.log(`\nScale Comparison: ${meshA.name} vs ${meshB.name}`);
        console.log('Size Ratio:', {
            x: sizeA.x / sizeB.x,
            y: sizeA.y / sizeB.y,
            z: sizeA.z / sizeB.z
        });
        console.log('Volume Ratio:', scaleRatio);
        
        return {
            sizeRatio: {
                x: sizeA.x / sizeB.x,
                y: sizeA.y / sizeB.y,
                z: sizeA.z / sizeB.z
            },
            volumeRatio: scaleRatio
        };
    }
} 