// map-upload-ui.js - Safe from duplicate loading
if (typeof MapUploadUI === 'undefined') {

class MapUploadUI {
    constructor() {
        this.converter = new TerritorialMapConverter();
        this.container = null;
        this.selectedFile = null;
        this.mapResult = null;
        this.createUI();
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.className = 'map-upload-container';
        this.container.innerHTML = `
            <div class="map-upload-panel">
                <h3>🗺️ Custom Map Upload</h3>
                <div class="upload-zone" id="mapDropZone">
                    <p>Drop PNG here or click to upload</p>
                    <input type="file" id="mapFileInput" accept=".png" hidden>
                </div>
                <div class="settings-panel" id="settingsPanel" style="display:none;">
                    <label>Min Island: <input type="number" id="minIslandSize" value="30"></label>
                    <label>Min Lake: <input type="number" id="minLakeSize" value="200"></label>
                    <label><input type="checkbox" id="normalizeMap" checked> Normalize</label>
                    <button id="convertMapBtn" class="primary-btn">Convert Map</button>
                </div>
                <div class="preview-panel" id="previewPanel" style="display:none;">
                    <canvas id="mapPreview"></canvas>
                    <div class="map-info" id="mapInfo"></div>
                    <button id="downloadMapBtn">Download</button>
                    <button id="copyMapBtn">Copy</button>
                    <button id="clearMapBtn">Clear</button>
                </div>
            </div>
        `;
        this.setupEvents();
        this.addStyles();
    }

    setupEvents() {
        const dz = this.container.querySelector('#mapDropZone');
        const fi = this.container.querySelector('#mapFileInput');
        dz.onclick = () => fi.click();
        dz.ondragover = e => e.preventDefault();
        dz.ondrop = e => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) this.selectFile(f);
        };
        fi.onchange = e => { if (e.target.files[0]) this.selectFile(e.target.files[0]); };
        this.container.querySelector('#convertMapBtn').onclick = () => this.convert();
        this.container.querySelector('#downloadMapBtn').onclick = () => this.download();
        this.container.querySelector('#copyMapBtn').onclick = () => this.copy();
        this.container.querySelector('#clearMapBtn').onclick = () => this.clear();
    }

    selectFile(file) {
        this.selectedFile = file;
        this.container.querySelector('#settingsPanel').style.display = 'block';
        this.container.querySelector('#mapDropZone p').textContent = file.name;
    }

    async convert() {
        if (!this.selectedFile) return alert('Select a PNG first');
        this.converter.config.minIslandSize = +this.container.querySelector('#minIslandSize').value;
        this.converter.config.minLakeSize = +this.container.querySelector('#minLakeSize').value;
        this.converter.config.normalize = this.container.querySelector('#normalizeMap').checked;
        const result = await this.converter.convert(this.selectedFile);
        this.mapResult = result;
        const c = this.container.querySelector('#mapPreview');
        c.width = result.preview.width;
        c.height = result.preview.height;
        c.getContext('2d').drawImage(result.preview, 0, 0);
        this.container.querySelector('#mapInfo').textContent = `${result.dimensions.width}x${result.dimensions.height}`;
        this.container.querySelector('#previewPanel').style.display = 'block';
    }

    download() {
        if (!this.mapResult) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([this.mapResult.mapData]));
        a.download = 'map.txt';
        a.click();
    }

    copy() {
        if (!this.mapResult) return;
        navigator.clipboard.writeText(this.mapResult.mapData);
    }

    clear() {
        this.selectedFile = null;
        this.mapResult = null;
        this.container.querySelector('#previewPanel').style.display = 'none';
        this.container.querySelector('#settingsPanel').style.display = 'none';
        this.container.querySelector('#mapDropZone p').textContent = 'Drop PNG here';
    }

    addStyles() {
        const s = document.createElement('style');
        s.textContent = `
            .map-upload-container{font-family:sans-serif;max-width:500px;margin:20px auto;z-index:99999;position:relative}
            .map-upload-panel{background:#1e1e1e;border-radius:12px;padding:20px;color:#eee;border:1px solid #444}
            .upload-zone{border:2px dashed #555;border-radius:8px;padding:30px;text-align:center;cursor:pointer}
            .upload-zone:hover{border-color:#4CAF50}
            .settings-panel,.preview-panel{margin-top:16px;padding:12px;background:rgba(255,255,255,0.05);border-radius:8px}
            .settings-panel label{display:block;margin:6px 0}
            .settings-panel input[type=number]{width:60px;margin-left:8px}
            button{padding:8px 14px;border:none;border-radius:6px;cursor:pointer;margin:4px}
            .primary-btn{background:#4CAF50;color:#fff;width:100%}
            #mapPreview{width:100%;image-rendering:pixelated;border:1px solid #555}
        `;
        document.head.appendChild(s);
    }

    mount(parent) { parent.appendChild(this.container); }
}

} // end if undefined
