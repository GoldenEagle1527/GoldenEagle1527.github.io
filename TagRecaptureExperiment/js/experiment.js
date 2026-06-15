import * as UI from './ui.js';
import * as Config from './config.js';
import * as Sim from './simulation.js';

export let N_real = 200;
export let M = 0;
export let n = 0;
export let m = 0;
export let N_est = 0;
export let currentState = 'IDLE';

let captureLimit1 = 30;
let captureLimit2 = 40;

export function resetExperiment() {
    const settings = Config.getSettings();
    N_real = settings.count;
    captureLimit1 = settings.limit1;
    captureLimit2 = settings.limit2;

    Sim.generateAnimals(N_real, settings.size);
    
    M = 0; 
    n = 0; 
    m = 0; 
    N_est = 0;

    UI.clearLog();
    UI.log(`实验重置。总数: ${N_real}`, 'info');
    UI.updateStatus("点击'1. 第一次捕获'开始");
    UI.updateTooltip("准备就绪");

    UI.disableAllButtons();
    currentState = 'READY_1';
    UI.enableButton('btn-start-1');

    UI.updateButtonCount('count-1', 0, captureLimit1);
    UI.updateButtonCount('count-2', 0, captureLimit2);

    Sim.startLoop(settings.speed);
}

export function startCapture1() {
    currentState = 'CAPTURING_1';
    UI.disableAllButtons();
    UI.log(">>> 第一次捕获开始", 'info');
    UI.updateStatus(`捕获中 (目标: ${captureLimit1})`);
    UI.updateTooltip("点击动物捕获");
}

export function endCapture1() {
    M = Sim.getTrappedCount();
    currentState = 'MARKED';
    UI.log(`第一次捕获结束。M = ${M}`, 'success');
    UI.updateStatus(`完成 (${M}只)，请标记`);
    UI.updateTooltip("点击'2. 标记并释放'");
    UI.enableButton('btn-mark');
}

export function markAndRelease() {
    const count = Sim.markTrappedAnimals();
    Sim.resetAnimalPositions();
    currentState = 'READY_2';
    UI.log(`已标记 ${count} 只并释放。`, 'info');
    UI.updateStatus("已释放。开始第二次捕获");
    UI.updateTooltip("点击'3. 第二次捕获'");
    UI.disableAllButtons();
    UI.enableButton('btn-start-2');
}

export function startCapture2() {
    currentState = 'CAPTURING_2';
    UI.disableAllButtons();
    UI.log(">>> 第二次捕获开始", 'info');
    UI.updateStatus(`捕获中 (目标: ${captureLimit2})`);
    UI.updateTooltip("点击动物捕获");
}

export function endCapture2() {
    n = Sim.getTrappedCount();
    m = Sim.getTrappedAndMarkedCount();
    currentState = 'FINISHED';
    UI.log(`第二次结束。n=${n}, m=${m}`, 'success');
    UI.updateStatus("完成，请计算");
    UI.updateTooltip("点击'4. 计算结果'");
    UI.enableButton('btn-calculate');
}

export function calculateResult() {
    if (m === 0) {
        UI.log("失败：未重捕到标记个体 (m=0)。", 'warn');
    } else {
        N_est = Math.round((M * n) / m);
        const err = ((Math.abs(N_est - N_real) / N_real) * 100).toFixed(2);
        
        const div = document.getElementById('log-content');
        if (div) {
            div.innerHTML += `
                <div class="log-result">
                    <div>N = (${M} × ${n}) / ${m} ≈ ${N_est}</div>
                    <div style="font-weight:normal; opacity:0.8; font-size:0.9em">真实值: ${N_real} (误差: ${err}%)</div>
                </div>
            `;
            div.scrollTop = div.scrollHeight;
        }
        UI.updateStatus("实验完成");
        UI.updateTooltip("实验完成");
    }
}

export function handleCanvasClick(clientX, clientY) {
    if (currentState !== 'CAPTURING_1' && currentState !== 'CAPTURING_2') return;

    Sim.handleInput(clientX, clientY, () => {
        if (currentState === 'CAPTURING_1') {
            const currentM = Sim.getTrappedCount();
            UI.updateButtonCount('count-1', currentM, captureLimit1);
            if (currentM >= captureLimit1) endCapture1();
        } else if (currentState === 'CAPTURING_2') {
            const currentN = Sim.getTrappedCount();
            UI.updateButtonCount('count-2', currentN, captureLimit2);
            if (currentN >= captureLimit2) endCapture2();
        }
    });
}
