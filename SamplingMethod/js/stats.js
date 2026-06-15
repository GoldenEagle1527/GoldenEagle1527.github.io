import { state } from './config.js';
import { createPlantElement } from './plant.js';

export function startStatistics() {
    if (state.quadrats.length === 0) {
        alert("请先放置样方");
        return false;
    }

    const targetSelect = document.getElementById('main-target-species');
    if (!targetSelect) return false;
    
    state.targetSpeciesId = targetSelect.value;
    const targetSp = state.settings.species.find(s => s.id === state.targetSpeciesId);
    if (!targetSp) { 
        alert("请选择有效的统计物种"); 
        return false; 
    }

    state.mode = 'counting';
    
    // 禁用操作按钮
    const placeBtn = document.getElementById('btn-place');
    const moveBtn = document.getElementById('btn-move');
    const deleteBtn = document.getElementById('btn-delete');
    
    if (placeBtn) { placeBtn.disabled = true; placeBtn.classList.remove('highlight'); }
    if (moveBtn) { moveBtn.disabled = true; moveBtn.classList.remove('highlight'); }
    if (deleteBtn) { deleteBtn.disabled = true; deleteBtn.classList.remove('highlight'); }

    const statsPanel = document.getElementById('stats-panel');
    if (statsPanel) statsPanel.style.display = 'block';
    
    const targetNameSpan = document.getElementById('stats-target-name');
    if (targetNameSpan) {
        targetNameSpan.innerText = targetSp.name;
        targetNameSpan.style.color = targetSp.color;
        targetNameSpan.style.fontWeight = "bold";
    }
    
    const modeInfo = document.getElementById('mode-info');
    if (modeInfo) modeInfo.innerText = "统计模式进行中...";

    const wrapper = document.getElementById('target-select-wrapper');
    if (wrapper) {
        wrapper.style.pointerEvents = 'none';
        wrapper.style.opacity = '0.7';
    }
    
    return true;
}

export function openCountModal(q) {
    const targetSp = state.settings.species.find(s => s.id === state.targetSpeciesId);
    if (!targetSp) return;
    
    const modalTargetName = document.getElementById('modal-target-name');
    if (modalTargetName) {
        modalTargetName.innerText = targetSp.name;
        modalTargetName.style.color = targetSp.color;
    }

    const modal = document.getElementById('count-modal');
    if (modal) {
        modal.style.display = 'flex';
        const input = modal.querySelector('input');
        if (input) {
            input.value = q.userCount !== null ? q.userCount : '';
            setTimeout(() => input.focus(), 100);
        }
    }

    const container = document.getElementById('modal-view');
    if (!container) return;
    container.innerHTML = '';
    const containerRect = container.getBoundingClientRect();
    const VIEW_SIZE_PX = containerRect.width || 480;

    const viewScale = 1.2;
    const viewMeters = q.wM * viewScale;
    const boxSizePx = (q.wM / viewMeters) * VIEW_SIZE_PX;

    const box = document.createElement('div');
    box.style.cssText = `
        width:${boxSizePx}px; height:${boxSizePx}px; 
        border:3px dashed #ff4757; 
        position:absolute; top:50%; left:50%; 
        transform:translate(-50%,-50%);
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
    `;
    container.appendChild(box);

    const widthM = state.settings.areaSize;
    let heightM = widthM;
    if (state.settings.shape === 'rect169') heightM = widthM * 9 / 16;

    const cxPct = q.x;
    const cyPct = q.y;

    state.plants.forEach(p => {
        const dxPct = p.x - cxPct;
        const dyPct = p.y - cyPct;

        const dxM = (dxPct / 100) * widthM;
        const dyM = (dyPct / 100) * heightM;

        if (Math.abs(dxM) <= viewMeters / 2 && Math.abs(dyM) <= viewMeters / 2) {
            const px = (dxM / viewMeters) * VIEW_SIZE_PX + VIEW_SIZE_PX / 2;
            const py = (dyM / viewMeters) * VIEW_SIZE_PX + VIEW_SIZE_PX / 2;

            const el = createPlantElement(p.size, p.color, p.shape, p.style);
            el.style.position = 'absolute';
            el.style.left = px + 'px';
            el.style.top = py + 'px';

            if (p.speciesId === state.targetSpeciesId) {
                el.classList.add('plant-highlight');
            } else {
                el.classList.add('plant-dimmed');
            }
            container.appendChild(el);
        }
    });

    state.currentQuadrat = q;
}

export function closeModal() { 
    const modal = document.getElementById('count-modal');
    if (modal) modal.style.display = 'none'; 
}

export function calculateTrueCount(q) {
    const halfW = q.wPct / 2;
    const halfH = q.hPct / 2;
    const l = q.x - halfW, r = q.x + halfW;
    const t = q.y - halfH, b = q.y + halfH;
    const eps = 0.0001;

    let count = 0;
    state.plants.forEach(p => {
        if (p.speciesId !== state.targetSpeciesId) return;

        let inX = (p.x > l + eps && p.x < r - eps) || Math.abs(p.x - l) <= eps;
        let inY = (p.y > t + eps && p.y < b - eps) || Math.abs(p.y - t) <= eps;
        if (inX && inY) count++;
    });
    q.trueCount = count;
}

export function submitCount() {
    const modal = document.getElementById('count-modal');
    if (!modal) return;
    const input = modal.querySelector('input');
    if (!input) return;
    const val = parseInt(input.value);
    if (isNaN(val) || val < 0) return;

    state.currentQuadrat.userCount = val;
    state.currentQuadrat.element.classList.add('completed');

    calculateTrueCount(state.currentQuadrat);
    closeModal();
    checkAllCompleted();
}

export function checkAllCompleted() {
    if (state.quadrats.every(q => q.userCount !== null)) {
        let uSum = 0;
        state.quadrats.forEach(q => {
            const area = q.wM * q.hM;
            uSum += q.userCount / area;
        });
        const uAvg = uSum / state.quadrats.length;

        const targetTotal = state.plants.filter(p => p.speciesId === state.targetSpeciesId).length;

        let totalArea = 0;
        const w = state.settings.areaSize;
        const { shape, innerSize, startAngle, endAngle } = state.settings;

        if (shape === 'square') {
            totalArea = w * w;
        } else if (shape === 'rect169') {
            totalArea = w * (w * 9 / 16);
        } else if (shape === 'circle' || shape === 'ring') {
            // 计算角度比例
            let angleSpan = 0;
            if (startAngle === endAngle) angleSpan = 360;
            else if (startAngle < endAngle) angleSpan = endAngle - startAngle;
            else angleSpan = (360 - startAngle) + endAngle;

            const ratio = angleSpan / 360;

            const rOut = w / 2;
            const rIn = shape === 'ring' ? innerSize / 2 : 0;

            totalArea = Math.PI * (Math.pow(rOut, 2) - Math.pow(rIn, 2)) * ratio;
        }

        const trueDensity = targetTotal / totalArea;
        const err = trueDensity === 0 ? (uAvg === 0 ? 0 : 100) : Math.abs(uAvg - trueDensity) / trueDensity * 100;
        const spName = state.settings.species.find(s => s.id === state.targetSpeciesId).name;

        const resultDisplay = document.getElementById('result-display');
        if (resultDisplay) resultDisplay.style.display = 'block';
        
        const resName = document.getElementById('res-name');
        if (resName) resName.innerText = spName;
        
        const userDensity = document.getElementById('user-density');
        if (userDensity) userDensity.innerText = uAvg.toFixed(4);
        
        const trueDensityEl = document.getElementById('true-density');
        if (trueDensityEl) trueDensityEl.innerText = trueDensity.toFixed(4);
        
        const errorRate = document.getElementById('error-rate');
        if (errorRate) errorRate.innerText = err.toFixed(2);
    }
}
