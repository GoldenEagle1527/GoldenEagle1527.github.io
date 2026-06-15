import * as UI from './ui.js';
import * as Config from './config.js';
import * as Sim from './simulation.js';
import * as Exp from './experiment.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化 Canvas 引擎
    const canvas = document.getElementById('simCanvas');
    const container = document.getElementById('simulation-area');
    if (canvas && container) {
        Sim.initCanvas(canvas, container);
    }

    // 2. 初始化 Tab 切换事件
    UI.initTabs();

    // 3. 应用 URL 参数并绑定分享按钮
    Config.applyUrlSettings();

    const shareBtn = document.querySelector('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', Config.generateShareLink);
    }

    // 4. 绑定实验流程核心按钮事件 (替换行内 onclick)
    const btnStart1 = document.getElementById('btn-start-1');
    if (btnStart1) btnStart1.addEventListener('click', Exp.startCapture1);

    const btnMark = document.getElementById('btn-mark');
    if (btnMark) btnMark.addEventListener('click', Exp.markAndRelease);

    const btnStart2 = document.getElementById('btn-start-2');
    if (btnStart2) btnStart2.addEventListener('click', Exp.startCapture2);

    const btnCalculate = document.getElementById('btn-calculate');
    if (btnCalculate) btnCalculate.addEventListener('click', Exp.calculateResult);

    // 重置按钮绑定
    const resetBtns = document.querySelectorAll('button.secondary');
    resetBtns.forEach(btn => {
        // 重置按钮中除了“生成分享链接”外的那个“重置/生成动物”按钮
        if (!btn.classList.contains('share-btn')) {
            btn.addEventListener('click', Exp.resetExperiment);
        }
    });

    // 5. 绑定 Canvas 点击/触碰交互
    if (canvas) {
        canvas.addEventListener('mousedown', (e) => {
            Exp.handleCanvasClick(e.clientX, e.clientY);
        });

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 防止双击缩放和滚动
            const touch = e.touches[0];
            Exp.handleCanvasClick(touch.clientX, touch.clientY);
        }, { passive: false });
    }

    // 6. 异步加载图片并开始实验
    Sim.loadImages()
        .then(() => {
            Exp.resetExperiment();
        })
        .catch((err) => {
            console.error("加载动物图标出错，使用兜底圆圈渲染：", err);
            Exp.resetExperiment();
        });
});
