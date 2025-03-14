// Create a simple 3D scene without using Babylon.js
export class BabylonScene {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null;
    private cube: Cube;
    private animationId: number | null = null;

    constructor(canvasId: string) {
        // Get the canvas element
        const canvas = document.getElementById(canvasId);
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
            throw new Error(`Canvas element with id '${canvasId}' not found or is not a canvas element`);
        }
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        
        if (!this.ctx) {
            throw new Error('Could not get 2D context from canvas');
        }
        
        // Create a simple cube
        this.cube = new Cube(100, '#0000FF');
        
        // Start the render loop
        this.startAnimation();
        
        console.log("Scene created successfully");
    }

    private startAnimation(): void {
        let rotation = 0;
        
        const animate = () => {
            if (!this.ctx) return;
            
            // Clear canvas
            this.ctx.fillStyle = '#f0f0f0';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Update rotation
            rotation += 0.01;
            
            // Draw cube
            this.cube.draw(this.ctx, this.canvas.width / 2, this.canvas.height / 2, rotation);
            
            // Continue animation
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }
}

// Simple cube class
class Cube {
    private size: number;
    private color: string;
    
    constructor(size: number, color: string) {
        this.size = size;
        this.color = color;
    }
    
    draw(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, rotation: number): void {
        const halfSize = this.size / 2;
        
        // Save context
        ctx.save();
        
        // Translate to center
        ctx.translate(centerX, centerY);
        
        // Rotate
        ctx.rotate(rotation);
        
        // Draw a simple square (front face of cube)
        ctx.fillStyle = this.color;
        ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
        
        // Add some 3D effect with a darker side
        ctx.fillStyle = '#0000AA'; // Darker blue
        ctx.beginPath();
        ctx.moveTo(halfSize, -halfSize);
        ctx.lineTo(halfSize + 20, -halfSize + 20);
        ctx.lineTo(halfSize + 20, halfSize + 20);
        ctx.lineTo(halfSize, halfSize);
        ctx.closePath();
        ctx.fill();
        
        // Add top side
        ctx.fillStyle = '#0000CC'; // Medium blue
        ctx.beginPath();
        ctx.moveTo(-halfSize, -halfSize);
        ctx.lineTo(-halfSize + 20, -halfSize - 20);
        ctx.lineTo(halfSize + 20, -halfSize - 20);
        ctx.lineTo(halfSize, -halfSize);
        ctx.closePath();
        ctx.fill();
        
        // Restore context
        ctx.restore();
    }
}