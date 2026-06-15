import { state } from './config.js';

export function switchTab(t) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(e => e.classList.remove('active'));
    
    const targetTab = document.getElementById('tab-' + t);
    if (targetTab) targetTab.classList.add('active');
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length >= 2) {
        tabBtns[t === 'main' ? 0 : 1].classList.add('active');
    }
}

export function showToast(x, y, text) {
    const toast = document.getElementById('toast-bubble');
    if (!toast) return;
    toast.innerText = text;
    toast.style.left = x + 'px';
    toast.style.top = y + 'px';
    toast.classList.add('show');
    
    // 自动清除之前的定时器，防止重叠
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => toast.classList.remove('show'), 2000);
}

export function toggleShapeControls() {
    const shapeInput = document.getElementById('setting-shape');
    const shapeControls = document.getElementById('setting-shape-advanced');
    const innerSizeWrapper = document.getElementById('setting-inner-wrapper');
    if (!shapeInput || !shapeControls) return;

    const shape = shapeInput.value;
    if (shape === 'circle' || shape === 'ring') {
        shapeControls.style.display = 'block';
        if (shape === 'ring') {
            if (innerSizeWrapper) innerSizeWrapper.style.display = 'block';
        } else {
            if (innerSizeWrapper) innerSizeWrapper.style.display = 'none';
        }
    } else {
        shapeControls.style.display = 'none';
    }
}

export function updateAngleLabels() {
    const startInput = document.getElementById('setting-angle-start');
    const endInput = document.getElementById('setting-angle-end');
    const startLabel = document.getElementById('label-angle-start');
    const endLabel = document.getElementById('label-angle-end');
    
    if (startInput && startLabel) startLabel.innerText = startInput.value + '°';
    if (endInput && endLabel) endLabel.innerText = endInput.value + '°';
}

export function updateMainTargetSelect() {
    const targetSelect = document.getElementById('main-target-species');
    if (!targetSelect) return;
    targetSelect.innerHTML = '';
    state.settings.species.forEach(sp => {
        const opt = document.createElement('option');
        opt.value = sp.id;
        opt.innerText = sp.name;
        opt.style.color = sp.color;
        targetSelect.appendChild(opt);
    });
}

export function renderSpeciesSettings(onRemove, onChange) {
    const speciesContainer = document.getElementById('species-list-container');
    if (!speciesContainer) return;
    speciesContainer.innerHTML = '';

    state.settings.species.forEach((sp, index) => {
        const card = document.createElement('div');
        card.className = 'species-card';
        card.style.borderLeftColor = sp.color;

        card.innerHTML = `
            <div class="species-header">
                <input type="text" class="sp-name-input" value="${sp.name}" style="width:60%; font-weight:bold;">
                <button class="btn btn-sm btn-danger highlight sp-remove-btn" style="width:auto;">删除</button>
            </div>
            <div class="species-grid">
                <div>
                    <label>数量:</label>
                    <input type="number" class="sp-count-input" value="${sp.count}" min="1" max="2000">
                </div>
                <div>
                    <label>大小(px):</label>
                    <input type="number" class="sp-size-input" value="${sp.size}" min="2" max="50">
                </div>
                <div>
                    <label>形状:</label>
                    <select class="sp-shape-select">
                        <option value="circle" ${sp.shape == 'circle' ? 'selected' : ''}>圆形</option>
                        <option value="square" ${sp.shape == 'square' ? 'selected' : ''}>正方形</option>
                        <option value="triangle" ${sp.shape == 'triangle' ? 'selected' : ''}>三角形</option>
                        <option value="rhombus" ${sp.shape == 'rhombus' ? 'selected' : ''}>菱形</option>
                        <option value="star" ${sp.shape == 'star' ? 'selected' : ''}>星形</option>
                    </select>
                </div>
                <div>
                    <label>风格:</label>
                    <select class="sp-style-select">
                        <option value="solid" ${sp.style == 'solid' ? 'selected' : ''}>实心</option>
                        <option value="hollow" ${sp.style == 'hollow' ? 'selected' : ''}>空心</option>
                    </select>
                </div>
                <div style="grid-column: span 2; display:flex; gap:10px; align-items:center;">
                    <label style="margin:0;">颜色:</label>
                    <input type="color" class="sp-color-input" value="${sp.color}" style="flex:1; height:30px;">
                </div>
                <div style="grid-column: span 2;">
                    <label class="sp-dispersion-label">分布离散度 (0聚-1散): ${sp.dispersion}</label>
                    <input type="range" class="sp-dispersion-input" min="0" max="1" step="0.1" value="${sp.dispersion}" style="width:100%">
                </div>
            </div>
        `;

        // 绑定事件
        const nameInput = card.querySelector('.sp-name-input');
        nameInput.addEventListener('change', (e) => onChange(sp.id, 'name', e.target.value));

        const removeBtn = card.querySelector('.sp-remove-btn');
        removeBtn.addEventListener('click', () => onRemove(sp.id));

        const countInput = card.querySelector('.sp-count-input');
        countInput.addEventListener('change', (e) => onChange(sp.id, 'count', parseInt(e.target.value) || 1));

        const sizeInput = card.querySelector('.sp-size-input');
        sizeInput.addEventListener('change', (e) => onChange(sp.id, 'size', parseInt(e.target.value) || 2));

        const shapeSelect = card.querySelector('.sp-shape-select');
        shapeSelect.addEventListener('change', (e) => onChange(sp.id, 'shape', e.target.value));

        const styleSelect = card.querySelector('.sp-style-select');
        styleSelect.addEventListener('change', (e) => onChange(sp.id, 'style', e.target.value));

        const colorInput = card.querySelector('.sp-color-input');
        colorInput.addEventListener('change', (e) => {
            onChange(sp.id, 'color', e.target.value);
            card.style.borderLeftColor = e.target.value;
        });

        const dispersionInput = card.querySelector('.sp-dispersion-input');
        const dispersionLabel = card.querySelector('.sp-dispersion-label');
        dispersionInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            dispersionLabel.innerText = `分布离散度 (0聚-1散): ${val}`;
            onChange(sp.id, 'dispersion', val);
        });

        speciesContainer.appendChild(card);
    });

    updateMainTargetSelect();
}
