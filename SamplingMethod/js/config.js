export const DEFAULT_SPECIES = [
    { id: 's1', name: '蒲公英', count: 120, size: 8, shape: 'circle', style: 'solid', color: '#f1c40f', dispersion: 1.0 },
    { id: 's2', name: '车前草', count: 80, size: 12, shape: 'triangle', style: 'hollow', color: '#2ecc71', dispersion: 0.3 }
];

export const state = {
    mode: null,
    settings: {
        areaSize: 15,    // 外径或宽
        innerSize: 5,    // 内径（仅用于环形）
        startAngle: 0,
        endAngle: 360,
        shape: 'square', // square, rect169, circle, ring
        seed: "BioLab",
        species: JSON.parse(JSON.stringify(DEFAULT_SPECIES))
    },
    targetSpeciesId: null, // 统计目标
    currentPreset: 1,
    customSize: 10,
    plants: [],
    quadrats: [],
    nextId: 1,
    currentQuadrat: null // 当前弹窗操作的样方
};

export function updateSettings() {
    let size = parseInt(document.getElementById('setting-area-size').value);
    if (size < 1) size = 1; 
    if (size > 1000) size = 1000;
    state.settings.areaSize = size;

    let inSize = parseFloat(document.getElementById('setting-inner-size').value);
    if (isNaN(inSize)) inSize = 0;
    state.settings.innerSize = inSize;

    state.settings.seed = document.getElementById('setting-seed').value;
    state.settings.shape = document.getElementById('setting-shape').value;
    state.settings.startAngle = parseInt(document.getElementById('setting-angle-start').value);
    state.settings.endAngle = parseInt(document.getElementById('setting-angle-end').value);

    // 更新显示标签
    let h = size;
    if (state.settings.shape === 'rect169') h = (size * 9 / 16).toFixed(1);

    const scaleLabel = document.getElementById('area-scale-label');
    if (scaleLabel) scaleLabel.innerText = size;
    const scaleLabel2 = document.getElementById('area-scale-label-2');
    if (scaleLabel2) scaleLabel2.innerText = (state.settings.shape === 'circle' || state.settings.shape === 'ring') ? size : h;

    const shapeNames = {
        'square': '(正方形)',
        'rect169': '(16:9)',
        'circle': '(圆形/扇形)',
        'ring': `(环形/环扇)`
    };
    const shapeLabel = document.getElementById('area-shape-label');
    if (shapeLabel) shapeLabel.innerText = shapeNames[state.settings.shape] || '';
}

export function randomizeSeed() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let res = '';
    for (let i = 0; i < 6; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    const seedInput = document.getElementById('setting-seed');
    if (seedInput) seedInput.value = res;
    updateSettings();
}

export function shareConfiguration() {
    const config = {
        a: state.settings.areaSize,
        in: state.settings.innerSize,
        sa: state.settings.startAngle,
        ea: state.settings.endAngle,
        s: state.settings.seed,
        sh: state.settings.shape,
        sp: state.settings.species
    };
    const jsonStr = JSON.stringify(config);
    const encoded = encodeURIComponent(jsonStr);
    const url = `${window.location.origin}${window.location.pathname}?cfg=${encoded}`;

    if (window.QrPopupModule && typeof window.QrPopupModule.show === 'function') {
        window.QrPopupModule.show(url);
    } else {
        prompt("复制分享链接：", url);
    }
}

export function loadSettingsFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('cfg')) {
        try {
            const config = JSON.parse(decodeURIComponent(params.get('cfg')));
            if (config.a) state.settings.areaSize = config.a;
            if (config.in !== undefined) state.settings.innerSize = config.in;
            if (config.sa !== undefined) state.settings.startAngle = config.sa;
            if (config.ea !== undefined) state.settings.endAngle = config.ea;
            if (config.s) state.settings.seed = config.s;
            if (config.sh) state.settings.shape = config.sh;
            if (config.sp && Array.isArray(config.sp)) state.settings.species = config.sp;
        } catch (e) {
            console.error("配置解析失败", e);
        }
    }
    
    // 同步到 DOM
    const areaSizeInput = document.getElementById('setting-area-size');
    if (areaSizeInput) areaSizeInput.value = state.settings.areaSize;

    const innerSizeInput = document.getElementById('setting-inner-size');
    if (innerSizeInput) innerSizeInput.value = state.settings.innerSize;

    const seedInput = document.getElementById('setting-seed');
    if (seedInput) seedInput.value = state.settings.seed;

    const shapeInput = document.getElementById('setting-shape');
    if (shapeInput) shapeInput.value = state.settings.shape || 'square';

    const angleStartInput = document.getElementById('setting-angle-start');
    if (angleStartInput) angleStartInput.value = state.settings.startAngle;

    const angleEndInput = document.getElementById('setting-angle-end');
    if (angleEndInput) angleEndInput.value = state.settings.endAngle;
}
