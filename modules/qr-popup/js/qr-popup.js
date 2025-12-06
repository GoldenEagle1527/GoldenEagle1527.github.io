(function (window, document)
{
    'use strict';

    const HTML_TEMPLATE = `
    <div class="qrp-overlay" id="qrp-overlay">
        <div class="qrp-modal">
            <span class="qrp-close" id="qrp-close">&times;</span>
            <h3 style="margin:0; text-align:center;">分享链接</h3>
            
            <div class="qrp-input-group">
                <input type="text" class="qrp-input" id="qrp-url-input" readonly>
                <button class="qrp-btn" id="qrp-copy-link">复制</button>
            </div>

            <div class="qrp-qr-box" id="qrp-qr-target"></div>

            <div class="qrp-footer">
                <button class="qrp-btn-sec" id="qrp-copy-img">复制图片</button>
                <button class="qrp-btn-sec" id="qrp-dl-img">下载原图</button>
            </div>
            
            <!-- 气泡提示容器 -->
            <div class="qrp-toast" id="qrp-toast">操作成功</div>
        </div>
    </div>`;

    class QrPopup
    {
        constructor()
        {
            this.initialized = false;
            this.toastTimer = null;
        }

        init()
        {
            if (this.initialized) return;
            document.body.insertAdjacentHTML('beforeend', HTML_TEMPLATE);

            this.overlay = document.getElementById('qrp-overlay');
            this.qrContainer = document.getElementById('qrp-qr-target');
            this.urlInput = document.getElementById('qrp-url-input');
            this.toastEl = document.getElementById('qrp-toast');

            this._bindEvents();
            this.initialized = true;
        }

        _bindEvents()
        {
            document.getElementById('qrp-close').onclick = () => this.hide();
            this.overlay.onclick = (e) =>
            {
                if (e.target === this.overlay) this.hide();
            };

            // 复制链接
            document.getElementById('qrp-copy-link').onclick = () =>
            {
                this.urlInput.select();
                navigator.clipboard.writeText(this.urlInput.value)
                    .then(() => this._showToast('链接已复制'))
                    .catch(() => this._showToast('复制失败'));
            };

            // 下载图片
            document.getElementById('qrp-dl-img').onclick = () => this._handleDownload();
            // 复制图片
            document.getElementById('qrp-copy-img').onclick = () => this._handleCopyImg();
        }

        /**
         * 显示气泡提示
         */
        _showToast(msg)
        {
            if (!this.toastEl) return;

            this.toastEl.textContent = msg;
            this.toastEl.classList.add('show');

            if (this.toastTimer) clearTimeout(this.toastTimer);
            this.toastTimer = setTimeout(() =>
            {
                this.toastEl.classList.remove('show');
            }, 2000); // 2秒后消失
        }

        show(url)
        {
            if (!this.initialized) this.init();

            this.urlInput.value = url;
            this.qrContainer.innerHTML = '';

            if (typeof QRCode === 'undefined')
            {
                console.error('QRCode库未加载');
                return;
            }

            // === 生成超大二维码 ===
            new QRCode(this.qrContainer, {
                text: url,
                width: 640,  // 生成 640px 宽
                height: 640, // 生成 640px 高
                colorDark: "#000000",
                colorLight: "#ffffff",

                // === 关键：针对长URL，降低容错率 ===
                // L (Low, 7%) 使得方块密度最低，
                // 结合 640px 的大尺寸，能最大程度保证长链接可扫描
                correctLevel: QRCode.CorrectLevel.L
            });

            this.overlay.style.display = 'flex';
        }

        hide()
        {
            if (this.overlay) this.overlay.style.display = 'none';
        }

        _getQrDataUrl()
        {
            const canvas = this.qrContainer.querySelector('canvas');
            if (canvas) return canvas.toDataURL('image/png');
            const img = this.qrContainer.querySelector('img');
            return img ? img.src : null;
        }

        _handleDownload()
        {
            const dataUrl = this._getQrDataUrl();
            if (!dataUrl) return;
            const link = document.createElement('a');
            link.download = 'qrcode_large.png';
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // 触发下载不提示Toast，因为浏览器本身有下载动效，或者也可以加上
            // this._showToast('开始下载'); 
        }

        async _handleCopyImg()
        {
            const dataUrl = this._getQrDataUrl();
            if (!dataUrl) return;
            try
            {
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
                this._showToast('图片已复制'); // 使用气泡替代 alert
            } catch (err)
            {
                console.error(err);
                this._showToast('复制图片失败 (需HTTPS)');
            }
        }
    }

    window.QrPopupModule = new QrPopup();

})(window, document);