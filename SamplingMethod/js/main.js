import { state, updateSettings, randomizeSeed, shareConfiguration, loadSettingsFromURL } from './config.js';
import { initSeed } from './seed-random.js';
import * as UI from './ui.js';
import { generatePlants } from './plant.js';
import * as Quadrat from './quadrat.js';
import * as Stats from './stats.js';

// 重置模拟系统并重新渲染背景和植物
export function resetSimulation() {
    updateSettings();
    initSeed(state.settings.seed);

    const simArea = document.getElementById('simulation-area');
    if (!simArea) return;
    
    // 清空背景和边角
    simArea.style.borderRadius = "0";
    simArea.style.background = "none";
    simArea.style.backgroundImage = "none";
    simArea.classList.remove('bordered');

    const { shape, areaSize, innerSize, startAngle, endAngle } = state.settings;

    if (shape === 'square') {
        simArea.style.aspectRatio = "1/1";
        simArea.classList.add('bordered');
    } else if (shape === 'rect169') {
        simArea.style.aspectRatio = "16/9";
        simArea.classList.add('bordered');
    } else if (shape === 'circle' || shape === 'ring') {
        simArea.style.aspectRatio = "1/1";
        simArea.style.borderRadius = "50%";

        let holePct = 0;
        if (shape === 'ring') {
            if (innerSize >= areaSize) {
                state.settings.innerSize = areaSize * 0.5;
                const innerInput = document.getElementById('setting-inner-size');
                if (innerInput) innerInput.value = state.settings.innerSize;
            }
            holePct = (state.settings.innerSize / areaSize) * 100 / 2; // 半径百分比
        }

        const bgCol = "var(--md-sys-color-surface-container)";
        const trans = "transparent";

        const holeGradient = shape === 'ring'
            ? `radial-gradient(circle, var(--md-sys-color-background) ${holePct}%, transparent ${holePct}%)`
            : null;

        let conicStr = "";
        const s = startAngle;
        const e = endAngle;

        if (s === e || Math.abs(s - e) === 360) {
            conicStr = `conic-gradient(${bgCol} 0% 100%)`;
        } else if (s < e) {
            conicStr = `conic-gradient(from 270deg, ${trans} 0deg, ${trans} ${s}deg, ${bgCol} ${s}deg, ${bgCol} ${e}deg, ${trans} ${e}deg)`;
        } else {
            conicStr = `conic-gradient(from 270deg, ${bgCol} 0deg, ${bgCol} ${e}deg, ${trans} ${e}deg, ${trans} ${s}deg, ${bgCol} ${s}deg)`;
        }

        simArea.style.backgroundImage = holeGradient ? `${holeGradient}, ${conicStr}` : conicStr;
    }

    // 清除旧的样方框
    state.quadrats.forEach(q => q.element.remove());
    state.quadrats = [];
    state.mode = null;

    resetUIState();
    generatePlants();
    UI.switchTab('main');
    UI.updateMainTargetSelect();
}

function resetUIState() {
    const simArea = document.getElementById('simulation-area');
    if (simArea) {
        // 保留植物节点，样方框之前已经被删除了
        // 这里不要清空整个 HTML，因为重新生成植物是在 generatePlants() 中清空并生成的。
    }
    
    const statsPanel = document.getElementById('stats-panel');
    if (statsPanel) statsPanel.style.display = 'none';

    const resultDisplay = document.getElementById('result-display');
    if (resultDisplay) resultDisplay.style.display = 'none';

    const selectWrapper = document.getElementById('target-select-wrapper');
    if (selectWrapper) {
        selectWrapper.style.pointerEvents = 'auto';
        selectWrapper.style.opacity = '1';
    }

    const placeBtn = document.getElementById('btn-place');
    const moveBtn = document.getElementById('btn-move');
    const deleteBtn = document.getElementById('btn-delete');
    
    if (placeBtn) { placeBtn.disabled = false; placeBtn.classList.remove('highlight'); }
    if (moveBtn) { moveBtn.disabled = false; moveBtn.classList.remove('highlight'); }
    if (deleteBtn) { deleteBtn.disabled = false; deleteBtn.classList.remove('highlight'); }

    const modeInfo = document.getElementById('mode-info');
    if (modeInfo) modeInfo.innerText = "请选择操作模式";
}

function setMode(mode) {
    const placeBtn = document.getElementById('btn-place');
    const moveBtn = document.getElementById('btn-move');
    const deleteBtn = document.getElementById('btn-delete');
    const btns = { place: placeBtn, move: moveBtn, delete: deleteBtn };

    Object.values(btns).forEach(b => { if (b) b.classList.remove('highlight'); });
    
    if (state.mode === mode) {
        state.mode = null;
        const modeInfo = document.getElementById('mode-info');
        if (modeInfo) modeInfo.innerText = "操作已取消";
        return;
    }
    
    state.mode = mode;
    if (btns[mode]) btns[mode].classList.add('highlight');
    
    const map = {
        'place': '点击区域放置样方',
        'move': '拖拽移动样方',
        'delete': '点击样方删除'
    };
    const modeInfo = document.getElementById('mode-info');
    if (modeInfo) modeInfo.innerText = map[mode] || '';
}

function selectPreset(size, el) {
    if (state.quadrats.length > 0 && state.mode === 'place') return;
    state.currentPreset = size;
    document.querySelectorAll('.preset-item').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');

    const display = document.getElementById('preset-info');
    const customDiv = document.getElementById('custom-input-div');
    if (!display) return;

    if (size === 'custom') {
        if (customDiv) customDiv.style.display = 'flex';
        const val = document.getElementById('custom-size-input').value;
        display.innerText = `当前选择: 自定义 ${val}m`;
    } else {
        if (customDiv) customDiv.style.display = 'none';
        display.innerText = `当前选择: 边长 ${size}m`;
    }
}

function addNewSpecies() {
    const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
    const shapes = ['circle', 'square', 'triangle', 'star'];
    const id = 's' + Date.now();
    const randColor = colors[state.settings.species.length % colors.length];
    const randShape = shapes[state.settings.species.length % shapes.length];

    state.settings.species.push({
        id: id,
        name: `新物种 ${state.settings.species.length + 1}`,
        count: 50,
        size: 8,
        shape: randShape,
        style: 'solid',
        color: randColor,
        dispersion: 0.8
    });
    
    UI.renderSpeciesSettings(removeSpecies, updateSpeciesParam);
}

function removeSpecies(id) {
    if (state.settings.species.length <= 1) {
        alert("至少保留一种植物！");
        return;
    }
    state.settings.species = state.settings.species.filter(s => s.id !== id);
    UI.renderSpeciesSettings(removeSpecies, updateSpeciesParam);
}

function updateSpeciesParam(id, key, val) {
    const sp = state.settings.species.find(s => s.id === id);
    if (sp) sp[key] = val;
}

// 样方点击路由到 quadrat 的处理
function onQuadratClick(e, id) {
    Quadrat.handleQuadratClick(e, id, () => {
        // 当有样方被删除时的回调，更新样方编号文本
        // handleQuadratClick 内部已经完成了重排，这里无需多余处理
    }, (q) => {
        // 当处于统计计数模式下被点击
        Stats.openCountModal(q);
    });
}

function handleAreaInteraction(e) {
    if (state.mode !== 'place') return;
    if (e.cancelable) e.preventDefault();
    
    const simArea = document.getElementById('simulation-area');
    if (!simArea) return;
    
    const rect = simArea.getBoundingClientRect();
    const cx = e.clientX || (e.touches && e.touches[0].clientX);
    const cy = e.clientY || (e.touches && e.touches[0].clientY);
    const xPct = ((cx - rect.left) / rect.width) * 100;
    const yPct = ((cy - rect.top) / rect.height) * 100;
    
    Quadrat.addQuadrat(xPct, yPct, cx, cy, onQuadratClick);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 1. 加载参数
    loadSettingsFromURL();
    UI.renderSpeciesSettings(removeSpecies, updateSpeciesParam);
    UI.toggleShapeControls();
    UI.updateAngleLabels();
    
    // 2. 初始化第一次模拟背景和植物
    resetSimulation();

    // 3. 动态绑定事件
    // Tab 键切换
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length >= 2) {
        tabBtns[0].addEventListener('click', () => UI.switchTab('main'));
        tabBtns[1].addEventListener('click', () => UI.switchTab('settings'));
    }

    // 预设值样方大小
    const presetItems = document.querySelectorAll('.preset-item');
    if (presetItems.length >= 3) {
        presetItems[0].addEventListener('click', (e) => selectPreset(1, e.target));
        presetItems[1].addEventListener('click', (e) => selectPreset(2, e.target));
        presetItems[2].addEventListener('click', (e) => selectPreset(5, e.target));
        presetItems[3].addEventListener('click', (e) => selectPreset('custom', e.target));
    }

    const customSizeInput = document.getElementById('custom-size-input');
    if (customSizeInput) {
        customSizeInput.addEventListener('input', (e) => {
            state.customSize = parseInt(e.target.value) || 1;
            const display = document.getElementById('preset-info');
            if (display) display.innerText = `当前选择: 自定义 ${state.customSize}m`;
        });
    }

    // 操作模式 Segmented 按钮
    const placeBtn = document.getElementById('btn-place');
    if (placeBtn) placeBtn.addEventListener('click', () => setMode('place'));
    
    const moveBtn = document.getElementById('btn-move');
    if (moveBtn) moveBtn.addEventListener('click', () => setMode('move'));

    const deleteBtn = document.getElementById('btn-delete');
    if (deleteBtn) deleteBtn.addEventListener('click', () => setMode('delete'));

    // 开始统计模式
    const startStatsBtn = document.getElementById('btn-start-stats');
    if (startStatsBtn) startStatsBtn.addEventListener('click', Stats.startStatistics);

    // 弹出窗口按钮
    const submitCountBtn = document.querySelector('.modal-actions button.highlight');
    if (submitCountBtn) submitCountBtn.addEventListener('click', Stats.submitCount);

    const cancelCountBtn = document.querySelector('.modal-actions button:not(.highlight)');
    if (cancelCountBtn) cancelCountBtn.addEventListener('click', Stats.closeModal);

    // 设置项变化监听
    const shapeSelect = document.getElementById('setting-shape');
    if (shapeSelect) {
        shapeSelect.addEventListener('change', () => {
            UI.toggleShapeControls();
            resetSimulation();
        });
    }

    const areaSizeInput = document.getElementById('setting-area-size');
    if (areaSizeInput) {
        areaSizeInput.addEventListener('change', resetSimulation);
    }

    const innerSizeInput = document.getElementById('setting-inner-size');
    if (innerSizeInput) {
        innerSizeInput.addEventListener('change', resetSimulation);
    }

    const angleStartInput = document.getElementById('setting-angle-start');
    if (angleStartInput) {
        angleStartInput.addEventListener('input', () => {
            UI.updateAngleLabels();
            resetSimulation();
        });
    }

    const angleEndInput = document.getElementById('setting-angle-end');
    if (angleEndInput) {
        angleEndInput.addEventListener('input', () => {
            UI.updateAngleLabels();
            resetSimulation();
        });
    }

    const seedInput = document.getElementById('setting-seed');
    if (seedInput) {
        seedInput.addEventListener('change', resetSimulation);
    }

    const randomizeSeedBtn = document.querySelector('.setting-item button.btn-sm');
    if (randomizeSeedBtn) {
        randomizeSeedBtn.addEventListener('click', () => {
            randomizeSeed();
            resetSimulation();
        });
    }

    // 添加新物种
    const addSpeciesBtn = document.querySelector('.section-title button.btn-primary');
    if (addSpeciesBtn) {
        addSpeciesBtn.addEventListener('click', addNewSpecies);
    }

    // 重置和分享按钮
    const resetSimulationBtn = document.querySelector('#tab-settings button.btn-primary');
    if (resetSimulationBtn) {
        resetSimulationBtn.addEventListener('click', resetSimulation);
    }

    const shareConfigBtn = document.querySelector('#tab-settings button.btn-success');
    if (shareConfigBtn) {
        shareConfigBtn.addEventListener('click', shareConfiguration);
    }

    // 4. 绑定画布容器交互监听
    const simArea = document.getElementById('simulation-area');
    if (simArea) {
        simArea.addEventListener('mousedown', handleAreaInteraction);
        simArea.addEventListener('touchstart', handleAreaInteraction, { passive: false });
    }
});
