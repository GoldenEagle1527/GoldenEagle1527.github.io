import { state } from './config.js';
import { seededRandom } from './seed-random.js';

// 将笛卡尔坐标转换为用户定义的角度 (0=9点钟, 顺时针)
// dx, dy 是相对于中心点的偏移
export function getAngle(dx, dy) {
    let rad = Math.atan2(dy, dx);
    let deg = rad * 180 / Math.PI; // -180 to 180, 0 is East

    let userDeg = deg + 180; // 变换至以 West (9点钟) 为 0 的坐标系

    if (userDeg >= 360) userDeg -= 360;
    if (userDeg < 0) userDeg += 360;

    return userDeg;
}

export function isPointInSector(xPct, yPct) {
    const { shape, areaSize, innerSize, startAngle, endAngle } = state.settings;
    if (shape === 'square' || shape === 'rect169') return true;

    const dx = xPct - 50;
    const dy = yPct - 50;
    const dist = Math.sqrt(dx * dx + dy * dy); // 半径百分比 (0-50)

    // 1. 距离检查
    if (dist > 50) return false; // 超出外径

    if (shape === 'ring') {
        const innerRadPct = (innerSize / areaSize) * 50;
        if (dist < innerRadPct) return false; // 在内径里
    }

    // 2. 角度检查
    if (startAngle === 0 && endAngle === 360) return true; // 全圆

    const angle = getAngle(dx, dy);

    if (startAngle <= endAngle) {
        return angle >= startAngle && angle <= endAngle;
    } else {
        // 跨越 0 度 (例如 Start 270, End 90)
        return angle >= startAngle || angle <= endAngle;
    }
}

export function createPlantElement(size, color, shape, style) {
    const div = document.createElement('div');
    div.className = 'plant-anchor';
    div.style.width = size + 'px';
    div.style.height = size + 'px';

    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("class", "plant-svg");
    svg.style.width = "100%";
    svg.style.height = "100%";

    const fill = style === 'hollow' ? 'none' : color;
    const stroke = style === 'hollow' ? color : 'none';
    const strokeWidth = style === 'hollow' ? 15 : 0;

    let el;
    const paths = {
        square: `M 10 10 H 90 V 90 H 10 Z`,
        triangle: `M 50 10 L 90 90 L 10 90 Z`,
        rhombus: `M 50 5 L 95 50 L 50 95 L 5 50 Z`,
        star: `M 50 5 L 61 38 L 95 38 L 68 59 L 79 95 L 50 75 L 21 95 L 32 59 L 5 38 L 39 38 Z`
    };

    if (shape === 'circle') {
        el = document.createElementNS(ns, "circle");
        el.setAttribute("cx", "50");
        el.setAttribute("cy", "50");
        el.setAttribute("r", "40");
    } else {
        el = document.createElementNS(ns, "path");
        el.setAttribute("d", paths[shape] || paths.square);
    }

    el.setAttribute("fill", fill);
    el.setAttribute("stroke", stroke);
    el.setAttribute("stroke-width", strokeWidth);
    el.setAttribute("stroke-linejoin", "round");

    svg.appendChild(el);
    div.appendChild(svg);
    return div;
}

export function generatePlants() {
    const simArea = document.getElementById('simulation-area');
    if (!simArea) return;
    simArea.innerHTML = '';
    state.plants = [];
    const fragment = document.createDocumentFragment();
    const rand = seededRandom;

    state.settings.species.forEach(sp => {
        const clusters = Math.max(1, Math.floor(sp.count / 20));
        const clusterCenters = [];
        // 尝试生成合法的聚类中心
        for (let k = 0; k < clusters; k++) {
            let cx, cy, valid = false;
            let tries = 0;
            while (!valid && tries < 50) {
                cx = rand() * 100;
                cy = rand() * 100;
                if (isPointInSector(cx, cy)) {
                    valid = true;
                }
                tries++;
            }
            if (valid) clusterCenters.push({ x: cx, y: cy });
        }

        let generatedCount = 0;
        let attempts = 0;

        while (generatedCount < sp.count && attempts < sp.count * 20) {
            attempts++;
            let x, y;

            if (clusterCenters.length > 0 && rand() >= sp.dispersion) {
                const center = clusterCenters[Math.floor(rand() * clusterCenters.length)];
                const offset = () => (rand() - 0.5) * 15;
                x = center.x + offset();
                y = center.y + offset();
            } else {
                x = rand() * 100;
                y = rand() * 100;
            }

            // 边界检查
            if (x < 0 || x > 100 || y < 0 || y > 100) continue;

            if (!isPointInSector(x, y)) continue;

            generatedCount++;
            state.plants.push({
                x, y,
                speciesId: sp.id,
                size: sp.size, color: sp.color, shape: sp.shape, style: sp.style
            });

            const el = createPlantElement(sp.size, sp.color, sp.shape, sp.style);
            el.style.left = x + '%';
            el.style.top = y + '%';
            fragment.appendChild(el);
        }
    });

    simArea.appendChild(fragment);
}
