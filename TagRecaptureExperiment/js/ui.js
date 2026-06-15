export function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const targetContent = document.getElementById(`${tab.dataset.tab}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

export function log(msg, type = 'normal') {
    const div = document.getElementById('log-content');
    if (!div) return;
    const d = document.createElement('div');
    d.className = 'log-entry ' + (type === 'info' ? 'log-info' : type === 'success' ? 'log-success' : type === 'warn' ? 'log-warn' : '');
    d.innerText = `[${new Date().toLocaleTimeString().slice(3)}] ${msg}`;
    div.appendChild(d);
    div.scrollTop = div.scrollHeight;
}

export function clearLog() {
    const div = document.getElementById('log-content');
    if (div) div.innerHTML = '';
}

export function updateStatus(txt) {
    const el = document.getElementById('status-text');
    if (el) el.innerText = txt;
}

export function updateTooltip(txt) {
    const el = document.getElementById('canvas-tooltip');
    if (el) el.innerText = txt;
}

export function enableButton(id) {
    const el = document.getElementById(id);
    if (el) el.disabled = false;
}

export function disableAllButtons() {
    ['btn-start-1', 'btn-mark', 'btn-start-2', 'btn-calculate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = true;
    });
}

export function updateButtonCount(id, current, limit) {
    const el = document.getElementById(id);
    if (el) el.innerText = `${current}/${limit}`;
}
