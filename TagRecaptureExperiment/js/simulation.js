import { Animal } from './animal.js';

export let animals = [];
export let imagesLoaded = 0;
export const imgUnmarked = new Image();
export const imgMarked = new Image();

let canvas = null;
let ctx = null;
let container = null;
let animationId = null;

export function initCanvas(canvasEl, containerEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    container = containerEl;
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    if (!canvas || !container) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

export function loadImages() {
    return new Promise((resolve) => {
        function checkAllLoaded() {
            imagesLoaded++;
            if (imagesLoaded === 2) resolve();
        }
        imgUnmarked.onload = checkAllLoaded;
        imgMarked.onload = checkAllLoaded;
        imgUnmarked.src = 'unmarked.svg';
        imgMarked.src = 'marked.svg';
    });
}

export function generateAnimals(count, size) {
    if (!canvas) return;
    animals = [];
    for (let i = 0; i < count; i++) {
        animals.push(new Animal(canvas.width, canvas.height, size));
    }
}

export function startLoop(speedMultiplier) {
    if (animationId) cancelAnimationFrame(animationId);
    
    function loop() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 确保被捕获的动物渲染在最上层
        animals.filter(a => !a.isTrapped).forEach(a => a.draw(ctx, imgUnmarked, imgMarked, imagesLoaded));
        animals.filter(a => a.isTrapped).forEach(a => a.draw(ctx, imgUnmarked, imgMarked, imagesLoaded));
        
        animals.forEach(a => a.update(canvas.width, canvas.height, speedMultiplier));
        animationId = requestAnimationFrame(loop);
    }
    
    loop();
}

export function stopLoop() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

export function getTrappedCount() {
    return animals.filter(a => a.isTrapped).length;
}

export function getTrappedAndMarkedCount() {
    return animals.filter(a => a.isTrapped && a.isMarked).length;
}

export function markTrappedAnimals() {
    let count = 0;
    animals.forEach(a => {
        if (a.isTrapped) {
            a.isMarked = true;
            a.isTrapped = false;
            count++;
        }
    });
    return count;
}

export function resetAnimalPositions() {
    if (!canvas) return;
    animals.forEach(a => a.resetPosition(canvas.width, canvas.height));
}

export function handleInput(clientX, clientY, onHitCallback) {
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;

    for (let animal of animals) {
        if (animal.isTrapped) continue;
        
        // 适当增加移动端的点击判定范围
        const hitBox = Math.max(animal.size * 1.5, 20); 
        const dx = animal.x - clickX;
        const dy = animal.y - clickY;
        
        if (Math.sqrt(dx * dx + dy * dy) <= hitBox) {
            animal.isTrapped = true;
            onHitCallback(animal);
            break;
        }
    }
}
