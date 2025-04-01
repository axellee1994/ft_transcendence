import * as BABYLON from 'babylonjs';

export class PongAI {
    private lastUpdateTime: number = 0;
    private readonly UPDATE_INTERVAL = 1000; // Update AI every 1 second as per requirements
    private readonly ERROR_MARGIN = 0.2; // Higher difficulty: 0.2 units error margin
    private readonly REACTION_DELAY = 100; // 100ms reaction delay for faster responses while still being human-like
    private readonly PLAY_AREA_WIDTH = 10; // Match the play area width from createScene.ts
    private readonly keys: { [key: string]: boolean } = { 'j': false, 'l': false };
    private moveTimeout: NodeJS.Timeout | null = null;
    private currentTarget: number = 0;

    constructor() {
        this.lastUpdateTime = Date.now();
        this.currentTarget = 0; // Start at center
    }

    // Main update method to be called in the game loop
    public update(ballPosition: BABYLON.Vector3, ballVelocity: BABYLON.Vector3, paddlePosition: BABYLON.Vector3): { [key: string]: boolean } {
        const currentTime = Date.now();
        
        // Only update prediction every second
        if (currentTime - this.lastUpdateTime >= this.UPDATE_INTERVAL) {
            this.lastUpdateTime = currentTime;
            
            // Predict where the ball will be
            const predictedX = this.predictBallPosition(ballPosition, ballVelocity, paddlePosition);
            
            // Add some randomness to the prediction (medium difficulty)
            this.currentTarget = predictedX + (Math.random() * 2 - 1) * this.ERROR_MARGIN;
            
            // Clear any existing movement timeout
            if (this.moveTimeout) {
                clearTimeout(this.moveTimeout);
            }
            
            // Simulate human reaction delay
            this.moveTimeout = setTimeout(() => {
                this.movePaddle(this.currentTarget, paddlePosition.x);
            }, this.REACTION_DELAY);
        } else {
            // Continue moving towards the current target
            this.movePaddle(this.currentTarget, paddlePosition.x);
        }
        
        return this.keys;
    }

    private predictBallPosition(ballPosition: BABYLON.Vector3, ballVelocity: BABYLON.Vector3, paddlePosition: BABYLON.Vector3): number {
        // Only predict if ball is moving towards the AI paddle
        if (ballVelocity.z <= 0) {
            return paddlePosition.x; // Stay in current position if ball moving away
        }

        // Calculate time for ball to reach paddle
        const distanceToTravel = paddlePosition.z - ballPosition.z;
        const timeToReach = distanceToTravel / ballVelocity.z;

        // Calculate final X position considering wall bounces
        let finalX = ballPosition.x;
        let timeLeft = timeToReach;
        let velocityX = ballVelocity.x;
        
        while (timeLeft > 0) {
            // Calculate next wall collision
            const nextCollisionTime = this.getTimeToWallCollision(finalX, velocityX);
            
            if (nextCollisionTime && nextCollisionTime < timeLeft) {
                // Ball will hit wall before reaching paddle
                finalX = velocityX > 0 ? this.PLAY_AREA_WIDTH/2 : -this.PLAY_AREA_WIDTH/2;
                velocityX *= -1; // Reverse X velocity
                timeLeft -= nextCollisionTime;
                finalX += velocityX * Math.min(timeLeft, nextCollisionTime);
            } else {
                // Ball will reach paddle before next wall collision
                finalX += velocityX * timeLeft;
                break;
            }
        }

        // Clamp predicted position to play area
        return Math.max(-this.PLAY_AREA_WIDTH/2, Math.min(this.PLAY_AREA_WIDTH/2, finalX));
    }

    private getTimeToWallCollision(positionX: number, velocityX: number): number | null {
        if (velocityX === 0) return null;
        
        const distanceToWall = velocityX > 0 
            ? this.PLAY_AREA_WIDTH/2 - positionX 
            : -this.PLAY_AREA_WIDTH/2 - positionX;
            
        return distanceToWall / velocityX;
    }

    private movePaddle(targetX: number, currentX: number): void {
        // Reset both keys
        this.keys['j'] = false;
        this.keys['l'] = false;

        // Add small deadzone to prevent jitter
        const DEADZONE = 0.05;
        
        // Move left if target is to the left
        if (targetX < currentX - DEADZONE) {
            this.keys['j'] = true;
        }
        // Move right if target is to the right
        else if (targetX > currentX + DEADZONE) {
            this.keys['l'] = true;
        }
    }

    // Clean up method
    public dispose(): void {
        if (this.moveTimeout) {
            clearTimeout(this.moveTimeout);
        }
    }
} 