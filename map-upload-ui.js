// map-upload-ui.js - UI Component for map upload
import TerritorialMapConverter from './map-converter.js';

class MapUploadUI {
    constructor() {
        this.converter = new TerritorialMapConverter();
        this.container = null;
        this.createUI();
    }

    createUI() {
        // Create the upload interface
        this.container = document.createElement('div');
        this.container.className = 'map-upload-container';
        this.container.innerHTML = `
            <div class="map-upload-panel">
                <h3>Custom Map Upload</h3>
                <div class="upload-zone" id="mapDropZone">
                    <div class="upload-icon">🗺️</div>
                    <p>Drop PNG here or click to upload</p>
                    <input type="file" id="mapFileInput" accept=".png" hidden>
                    <p class="upload-hint">Use blue channel values for terrain height</p>
                </div>
                
                <div class="settings-panel" id="settingsPanel" style="display: none;">
                    <h4>Map Settings</h4>
                    <label>
                        Min Island Size (px):
                        <input type="number" id="minIslandSize" value="30" min="1" max="1000">
                    </label>
                    <label>
                        Min Lake Size (px):
                        <input type="number" id="minLakeSize" value="200" min="1" max="10000">
                    </label>
                    <label>
                        <input type="checkbox" id="normalizeMap" checked>
                        Normalize to multiples of 4
                    </label>
                    <button id="convertMapBtn" class="primary-btn">Convert Map</button>
                </div>

                <div class="preview-panel" id="previewPanel" style="display: none;">
                    <h4>Preview</h4>
                    <canvas id="mapPreview"></canvas>
                    <div class="map-info" id="mapInfo"></div>
                    <div class="action-buttons">
                        <button id="downloadMapBtn">Download Map Data</button>
                        <button id="copyMapBtn">Copy to Clipboard</button>
                        <button id="clearMapBtn">Clear</button>
                    </div>
                </div>

                <div class="progress-bar" id="progressBar" style="display: none;">
                    <div class="progress-fill"></div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.injectStyles();
    }

    setupEventListeners() {
        const dropZone = this.container.querySelector('#mapDropZone');
        const fileInput = this.container.querySelector('#mapFileInput');

        // Drag and drop handlers
        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) this.handleFileSelect(file);
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFileSelect(file);
        });

        // Button handlers
        this.container.querySelector('#convertMapBtn').addEventListener('click', () => {
            this.convertMap();
        });

        this.container.querySelector('#downloadMapBtn').addEventListener('click', () => {
            this.downloadMapData();
        });

        this.container.querySelector('#copyMapBtn').addEventListener('click', () => {
            this.copyToClipboard();
        });

        this.container.querySelector('#clearMapBtn').addEventListener('click', () => {
            this.clearMap();
        });
    }

    async handleFileSelect(file) {
        try {
            // Show settings panel
            this.container.querySelector('#settingsPanel').style.display = 'block';
            
            // Store file for later conversion
            this.selectedFile = file;
            
            // Update drop zone text
            const dropZone = this.container.querySelector('#mapDropZone');
            dropZone.querySelector('p').textContent = `Selected: ${file.name}`;
            
        } catch (error) {
            console.error('Error handling file:', error);
            alert('Error loading file. Please make sure it is a valid PNG.');
        }
    }

    async convertMap() {
        if (!this.selectedFile) {
            alert('Please select a PNG file first.');
            return;
        }

        const progressBar = this.container.querySelector('#progressBar');
        progressBar.style.display = 'block';

        try {
            // Update settings from UI
            this.converter.config.minIslandSize = parseInt(
                this.container.querySelector('#minIslandSize').value
            );
            this.converter.config.minLakeSize = parseInt(
                this.container.querySelector('#minLakeSize').value
            );
            this.converter.config.normalize = 
                this.container.querySelector('#normalizeMap').checked;

            // Convert
            const result = await this.converter.convert(this.selectedFile);
            
            // Store result
            this.mapResult = result;

            // Show preview
            const previewPanel = this.container.querySelector('#previewPanel');
            const previewCanvas = this.container.querySelector('#mapPreview');
            const mapInfo = this.container.querySelector('#mapInfo');
            
            previewCanvas.width = result.preview.width;
            previewCanvas.height = result.preview.height;
            const ctx = previewCanvas.getContext('2d');
            ctx.drawImage(result.preview, 0, 0);
            
            mapInfo.innerHTML = `
                Dimensions: ${result.dimensions.width}x${result.dimensions.height}<br>
                Data size: ${result.mapData.length} bytes
            `;
            
            previewPanel.style.display = 'block';
            
        } catch (error) {
            console.error('Conversion error:', error);
            alert('Error converting map: ' + error.message);
        } finally {
            progressBar.style.display = 'none';
        }
    }

    downloadMapData() {
        if (!this.mapResult) return;
        
        const blob = new Blob([this.mapResult.mapData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'custom-map.txt';
        a.click();
        URL.revokeObjectURL(url);
    }

    copyToClipboard() {
        if (!this.mapResult) return;
        
        navigator.clipboard.writeText(this.mapResult.mapData).then(() => {
            alert('Map data copied to clipboard!');
        });
    }

    clearMap() {
        this.selectedFile = null;
        this.mapResult = null;
        this.container.querySelector('#previewPanel').style.display = 'none';
        this.container.querySelector('#settingsPanel').style.display = 'none';
        this.container.querySelector('#mapDropZone').querySelector('p').textContent = 
            'Drop PNG here or click to upload';
    }

    injectStyles() {
        const styles = `
            .map-upload-container {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 600px;
                margin: 20px auto;
            }
            .map-upload-panel {
                background: rgba(30, 30, 30, 0.9);
                border-radius: 12px;
                padding: 24px;
                color: #e0e0e0;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            }
            .upload-zone {
                border: 2px dashed #555;
                border-radius: 8px;
                padding: 40px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
                margin: 16px 0;
            }
            .upload-zone:hover, .upload-zone.dragover {
                border-color: #4CAF50;
                background: rgba(76, 175, 80, 0.1);
            }
            .upload-icon {
                font-size: 48px;
                margin-bottom: 12px;
            }
            .upload-hint {
                font-size: 12px;
                color: #888;
                margin-top: 8px;
            }
            .settings-panel, .preview-panel {
                margin-top: 20px;
                padding: 16px;
                background: rgba(255,255,255,0.05);
                border-radius: 8px;
            }
            .settings-panel label {
                display: block;
                margin: 8px 0;
            }
            .settings-panel input[type="number"] {
                width: 80px;
                padding: 4px 8px;
                background: rgba(255,255,255,0.1);
                border: 1px solid #555;
                border-radius: 4px;
                color: #fff;
                margin-left: 8px;
            }
            .primary-btn, .action-buttons button {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.3s;
                margin: 4px;
            }
            .primary-btn {
                background: #4CAF50;
                color: white;
                width: 100%;
                margin-top: 12px;
            }
            .primary-btn:hover {
                background: #45a049;
            }
            .action-buttons button {
                background: #2196F3;
                color: white;
            }
            .action-buttons button:hover {
                background: #1976D2;
            }
            #mapPreview {
                width: 100%;
                border-radius: 4px;
                image-rendering: pixelated;
            }
            .map-info {
                font-size: 14px;
                color: #aaa;
                margin: 8px 0;
            }
            .progress-bar {
                width: 100%;
                height: 4px;
                background: #333;
                border-radius: 2px;
                overflow: hidden;
                margin-top: 12px;
            }
            .progress-fill {
                width: 100%;
                height: 100%;
                background: #4CAF50;
                animation: progress 2s ease-in-out infinite;
            }
            @keyframes progress {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(400%); }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    mount(parentElement) {
        parentElement.appendChild(this.container);
    }
}

export default MapUploadUI;
