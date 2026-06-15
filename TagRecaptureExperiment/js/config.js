export function getSettings() {
    return {
        count: parseInt(document.getElementById('setting-count').value) || 200,
        speed: parseFloat(document.getElementById('setting-speed').value) || 3,
        size: parseInt(document.getElementById('setting-size').value) || 4,
        limit1: parseInt(document.getElementById('setting-limit1').value) || 30,
        limit2: parseInt(document.getElementById('setting-limit2').value) || 40
    };
}

export function applyUrlSettings() {
    const params = new URLSearchParams(window.location.search);
    const mappings = {
        'N': 'setting-count', 
        'sp': 'setting-speed',
        'sz': 'setting-size', 
        'l1': 'setting-limit1', 
        'l2': 'setting-limit2'
    };
    for (const [key, id] of Object.entries(mappings)) {
        if (params.has(key) && !isNaN(params.get(key))) {
            const input = document.getElementById(id);
            if (input) {
                input.value = params.get(key);
            }
        }
    }
}

export function generateShareLink() {
    const baseUrl = window.location.href.split('?')[0];
    const params = new URLSearchParams();
    params.set('N', document.getElementById('setting-count').value);
    params.set('sp', document.getElementById('setting-speed').value);
    params.set('sz', document.getElementById('setting-size').value);
    params.set('l1', document.getElementById('setting-limit1').value);
    params.set('l2', document.getElementById('setting-limit2').value);

    const shareUrl = `${baseUrl}?${params.toString()}`;
    if (window.QrPopupModule && typeof window.QrPopupModule.show === 'function') {
        window.QrPopupModule.show(shareUrl);
    } else {
        prompt("复制链接：", shareUrl);
    }
}
