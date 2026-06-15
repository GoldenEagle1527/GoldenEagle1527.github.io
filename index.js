document.addEventListener('DOMContentLoaded', () => {
    renderExperiments();
});

function renderExperiments() {
    const list = document.getElementById('experiment-list');
    if (!list) return;

    const experiments = [
        { 
            name: "标记重捕法", 
            url: "./TagRecaptureExperiment/index.html",
            iconSvg: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`
        },
        { 
            name: "样方法", 
            url: "./SamplingMethod/index.html",
            iconSvg: `<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h4v4H7zm6 0h4v4h-4zm-6 6h4v4H7zm6 0h4v4h-4z"/></svg>`
        }
    ];
    
    list.innerHTML = experiments.map(exp => `
        <a href="${exp.url}" class="exp-card">
            <div class="exp-card-icon">
                ${exp.iconSvg}
            </div>
            <span>${exp.name}</span>
            <div class="exp-card-arrow">
                进入实验 <span>&rarr;</span>
            </div>
        </a>
    `).join('');
}
