import * as BABYLON from 'babylonjs';

export class PongAI {
    private lastUpdateTime: number = 0;
    private readonly UPDATE_INTERVAL = 1000;
    private readonly ERROR_MARGIN = 0.2;
    private readonly REACTION_DELAY = 100;
    private readonly PLAY_AREA_WIDTH = 10;
    private readonly keys: { [key: string]: boolean } = { 'j': false, 'l': false };
    private moveTimeout: NodeJS.Timeout | null = null;
    private currentTarget: number = 0;

    constructor() {
        this.lastUpdateTime = Date.now();
        this.currentTarget = 0;
    }

    public update(ballPosition: BABYLON.Vector3, ballVelocity: BABYLON.Vector3, paddlePosition: BABYLON.Vector3): { [key: string]: boolean } {
        const currentTime = Date.now();
        
        if (currentTime - this.lastUpdateTime >= this.UPDATE_INTERVAL) {
            this.lastUpdateTime = currentTime;
            
            const predictedX = this.predictBallPosition(ballPosition, ballVelocity, paddlePosition);
            
            this.currentTarget = predictedX + (Math.random() * 2 - 1) * this.ERROR_MARGIN;
            
            if (this.moveTimeout) {
                clearTimeout(this.moveTimeout);
            }
            
            this.moveTimeout = setTimeout(() => {
                this.movePaddle(this.currentTarget, paddlePosition.x);
            }, this.REACTION_DELAY);
        } else {
            this.movePaddle(this.currentTarget, paddlePosition.x);
        }
        
        return this.keys;
    }

    private predictBallPosition(ballPosition: BABYLON.Vector3, ballVelocity: BABYLON.Vector3, paddlePosition: BABYLON.Vector3): number {
        if (ballVelocity.z <= 0) {
            return paddlePosition.x;
        }

        const distanceToTravel = paddlePosition.z - ballPosition.z;
        const timeToReach = distanceToTravel / ballVelocity.z;

        let finalX = ballPosition.x;
        let timeLeft = timeToReach;
        let velocityX = ballVelocity.x;
        
        while (timeLeft > 0) {
            const nextCollisionTime = this.getTimeToWallCollision(finalX, velocityX);
            
            if (nextCollisionTime && nextCollisionTime < timeLeft) {
                finalX = velocityX > 0 ? this.PLAY_AREA_WIDTH/2 : -this.PLAY_AREA_WIDTH/2;
                velocityX *= -1;
                timeLeft -= nextCollisionTime;
                finalX += velocityX * Math.min(timeLeft, nextCollisionTime);
            } else {
                finalX += velocityX * timeLeft;
                break;
            }
        }

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
        this.keys['j'] = false;
        this.keys['l'] = false;

        const DEADZONE = 0.05;
        
        if (targetX < currentX - DEADZONE) {
            this.keys['j'] = true;
        }
        else if (targetX > currentX + DEADZONE) {
            this.keys['l'] = true;
        }
    }

    public dispose(): void {
        if (this.moveTimeout) {
            clearTimeout(this.moveTimeout);
        }
    }
} 