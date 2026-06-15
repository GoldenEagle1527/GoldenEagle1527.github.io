export class Animal {
    constructor(canvasWidth, canvasHeight, size) {
        this.size = size;
        this.isMarked = false;
        this.isTrapped = false;
        this.resetPosition(canvasWidth, canvasHeight);
    }

    update(canvasWidth, canvasHeight, speedMultiplier) {
        if (this.isTrapped) return;
        this.x += this.vx * speedMultiplier;
        this.y += this.vy * speedMultiplier;

        if (this.x <= 0 || this.x >= canvasWidth) this.vx *= -1;
        if (this.y <= 0 || this.y >= canvasHeight) this.vy *= -1;
        
        this.x = Math.max(0, Math.min(canvasWidth, this.x));
        this.y = Math.max(0, Math.min(canvasHeight, this.y));
    }

    draw(ctx, imgUnmarked, imgMarked, imagesLoaded) {
        const size = this.size * 2;
        
        if (imagesLoaded === 2) {
            const img = this.isMarked ? imgMarked : imgUnmarked;
            ctx.drawImage(img, this.x - size / 2, this.y - size / 2, size, size);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.isMarked ? '#d32f2f' : '#424242';
            ctx.fill();
        }
        
        if (this.isTrapped) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 3, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    resetPosition(canvasWidth, canvasHeight) {
        this.x = Math.random() * (canvasWidth - 10);
        this.y = Math.random() * (canvasHeight - 10);
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);
    }
}
