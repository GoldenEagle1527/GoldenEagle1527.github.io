import { state } from './config.js';
import * as UI from './ui.js';
import { isPointInSector } from './plant.js';

// 检查样方是否合法（所有四个角都在扇形/环形内部）
export function isQuadratValid(cx, cy, halfW, halfH) {
    const corners = [
        { x: cx - halfW, y: cy - halfH },
        { x: cx + halfW, y: cy - halfH },
        { x: cx + halfW, y: cy + halfH },
        { x: cx - halfW, y: cy + halfH }
    ];

    for (let p of corners) {
        if (!isPointInSector(p.x, p.y)) return false;
    }
    return true;
}

export function addQuadrat(initialX, initialY, cx, cy, onQuadratClick) {
    let sizeM = state.currentPreset === 'custom' ? state.customSize : state.currentPreset;

    const widthM = state.settings.areaSize;
    let heightM = widthM;
    if (state.settings.shape === 'rect169') heightM = widthM * 9 / 16;

    const wPct = (sizeM / widthM) * 100;
    const hPct = (sizeM / heightM) * 100;

    let x = Math.max(wPct / 2, Math.min(100 - wPct / 2, initialX));
    let y = Math.max(hPct / 2, Math.min(100 - hPct / 2, initialY));

    // 特殊地形边界检查
    if (state.settings.shape === 'circle' || state.settings.shape === 'ring') {
        if (!isQuadratValid(x, y, wPct / 2, hPct / 2)) {
            UI.showToast(cx, cy, "⚠️ 样方需完全位于有效区域内");
            return;
        }
    }

    // 重叠检查
    for (let q of state.quadrats) {
        const xDist = Math.abs(x - q.x);
        const yDist = Math.abs(y - q.y);
        const minX = (wPct + q.wPct) / 2 - 0.1;
        const minY = (hPct + q.hPct) / 2 - 0.1;

        if (xDist < minX && yDist < minY) {
            UI.showToast(cx, cy, "⚠️ 位置重叠");
            return;
        }
    }

    const id = state.nextId++;
    const el = document.createElement('div');
    el.className = 'quadrat';
    el.style.width = wPct + '%';
    el.style.height = hPct + '%';
    el.style.left = x + '%';
    el.style.top = y + '%';
    el.innerText = state.quadrats.length + 1;
    
    const clickHandler = (ev) => {
        ev.stopPropagation();
        onQuadratClick(ev, id);
    };

    el.addEventListener('mousedown', clickHandler);
    el.addEventListener('touchstart', clickHandler);

    const simArea = document.getElementById('simulation-area');
    if (simArea) simArea.appendChild(el);
    
    state.quadrats.push({
        id, x, y,
        wPct, hPct,
        wM: sizeM, hM: sizeM,
        userCount: null, element: el
    });
}

export function handleQuadratClick(e, id, onDelete, onCounting) {
    const qIndex = state.quadrats.findIndex(q => q.id === id);
    if (qIndex === -1) return;
    const q = state.quadrats[qIndex];

    if (state.mode === 'counting') {
        onCounting(q);
    } else if (state.mode === 'delete') {
        q.element.remove();
        state.quadrats.splice(qIndex, 1);
        state.quadrats.forEach((item, idx) => item.element.innerText = idx + 1);
        onDelete();
    } else if (state.mode === 'move') {
        startDrag(e, q);
    }
}

export function startDrag(e, q) {
    const startX = e.clientX || e.touches[0].clientX;
    const startY = e.clientY || e.touches[0].clientY;
    const startL = parseFloat(q.element.style.left);
    const startT = parseFloat(q.element.style.top);
    
    const simArea = document.getElementById('simulation-area');
    if (!simArea) return;
    const rect = simArea.getBoundingClientRect();

    const onMove = (evt) => {
        const cx = evt.clientX || (evt.touches && evt.touches[0].clientX);
        const cy = evt.clientY || (evt.touches && evt.touches[0].clientY);
        const dx = ((cx - startX) / rect.width) * 100;
        const dy = ((cy - startY) / rect.height) * 100;
        let nx = Math.max(q.wPct / 2, Math.min(100 - q.wPct / 2, startL + dx));
        let ny = Math.max(q.hPct / 2, Math.min(100 - q.hPct / 2, startT + dy));

        // 移动时的边界限制
        if (state.settings.shape === 'circle' || state.settings.shape === 'ring') {
            if (!isQuadratValid(nx, ny, q.wPct / 2, q.hPct / 2)) return;
        }

        q.element.style.left = nx + '%';
        q.element.style.top = ny + '%';
        q.tempX = nx; 
        q.tempY = ny;
    };
    
    const onUp = () => {
        if (q.tempX !== undefined) { 
            q.x = q.tempX; 
            q.y = q.tempY; 
        }
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
}
