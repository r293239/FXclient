// FX Client Map Converter - All-in-one (Fixed)
(function() {
    'use strict';

    // ==================== MAP CONVERTER ====================
    class TerritorialMapConverter {
        constructor() {
            this.TERRAIN_TYPES = { WATER: 0, PLAINS_LOW: 1, PLAINS_MID: 2, HIGHLAND: 3, MOUNTAIN: 4 };
            this.config = { minIslandSize: 30, minLakeSize: 200, normalize: true, generatePreview: true };
        }

        async loadImage(file) {
            return new Promise(function(resolve) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    var img = new Image();
                    img.onload = function() { resolve(img); };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        imageToTerrainGrid(img) {
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            var grid = [];
            for (var y = 0; y < canvas.height; y++) {
                grid[y] = [];
                for (var x = 0; x < canvas.width; x++) {
                    var i = (y * canvas.width + x) * 4;
                    var b = data[i+2];
                    var a = data[i+3];
                    if (a < 20 || b === 106) grid[y][x] = 0;
                    else if (b <= 139) grid[y][x] = 1;
                    else if (b <= 158) grid[y][x] = 2;
                    else if (b <= 178) grid[y][x] = 3;
                    else grid[y][x] = 4;
                }
            }
            return grid;
        }

        generatePreview(grid) {
            var canvas = document.createElement('canvas');
            canvas.width = grid[0].length;
            canvas.height = grid.length;
            var ctx = canvas.getContext('2d');
            var id = ctx.createImageData(canvas.width, canvas.height);
            var colors = {
                0: [65,105,225,255],
                1: [144,238,144,255],
                2: [34,139,34,255],
                3: [139,137,137,255],
                4: [105,105,105,255]
            };
            for (var y = 0; y < grid.length; y++) {
                for (var x = 0; x < grid[0].length; x++) {
                    var idx = (y * canvas.width + x) * 4;
                    var c = colors[grid[y][x]];
                    id.data[idx] = c[0];
                    id.data[idx+1] = c[1];
                    id.data[idx+2] = c[2];
                    id.data[idx+3] = c[3];
                }
            }
            ctx.putImageData(id, 0, 0);
            return canvas;
        }

        async convert(file) {
            var img = await this.loadImage(file);
            var grid = this.imageToTerrainGrid(img);
            var preview = this.generatePreview(grid);
            return {
                grid: grid,
                preview: preview,
                dimensions: { width: grid[0].length, height: grid.length }
            };
        }
    }

    // ==================== CREATE BUTTON ====================
    function createButton() {
        var btn = document.createElement('div');
        btn.textContent = '🗺️ Map';
        btn.id = 'fxMapBtn';
        btn.style.cssText = 'position:fixed!important;bottom:20px!important;right:20px!important;z-index:99999!important;padding:14px 22px!important;background:#4CAF50!important;color:#fff!important;border:none!important;border-radius:10px!important;font-size:18px!important;cursor:pointer!important;font-weight:bold!important;box-shadow:0 6px 20px rgba(0,0,0,0.5)!important;display:block!important;visibility:visible!important;opacity:1!important;font-family:sans-serif!important';
        btn.onclick = showModal;
        document.body.appendChild(btn);
    }

    // ==================== SHOW MODAL ====================
    function showModal() {
        var existing = document.getElementById('fxMapModal');
        if (existing) { existing.remove(); return; }

        var modal = document.createElement('div');
        modal.id = 'fxMapModal';
        modal.innerHTML = 
            '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:99999;background:#1a1a2e;border-radius:16px;padding:24px;color:#fff;border:2px solid #4CAF50;min-width:320px;max-width:90vw;box-shadow:0 0 40px rgba(76,175,80,0.3);font-family:sans-serif">' +
                '<h2 style="margin:0 0 16px;text-align:center">🗺️ Custom Map</h2>' +
                '<div id="fxDropZone" style="border:2px dashed #4CAF50;border-radius:8px;padding:30px;text-align:center;cursor:pointer;background:rgba(76,175,80,0.05)">' +
                    '<p style="margin:0;font-size:16px">Drop PNG here or tap to select</p>' +
                    '<input type="file" id="fxMapFile" accept=".png" hidden>' +
                '</div>' +
                '<button id="fxConvertBtn" style="display:none;width:100%;margin-top:12px;padding:12px;background:#4CAF50;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;font-weight:bold">Convert Map</button>' +
                '<canvas id="fxPreview" style="display:none;width:100%;margin-top:12px;border-radius:4px;image-rendering:pixelated;border:1px solid #444"></canvas>' +
                '<div id="fxUseMapBtns" style="display:none;margin-top:12px">' +
                    '<p style="margin:0 0 8px;color:#aaa;font-size:14px">To use this map: Start a singleplayer game, then click below</p>' +
                    '<button id="fxInjectMap" style="width:100%;padding:12px;background:#FF9800;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;font-weight:bold">🎮 Inject Map Into Game</button>' +
                '</div>' +
                '<button id="fxCloseBtn" style="width:100%;margin-top:12px;padding:10px;background:#444;color:#fff;border:none;border-radius:8px;cursor:pointer">Close</button>' +
            '</div>';
        document.body.appendChild(modal);

        var converter = new TerritorialMapConverter();
        var selectedFile = null;
        var convertedGrid = null;

        document.getElementById('fxDropZone').onclick = function() { document.getElementById('fxMapFile').click(); };
        document.getElementById('fxDropZone').ondragover = function(e) { e.preventDefault(); };
        document.getElementById('fxDropZone').ondrop = function(e) {
            e.preventDefault();
            selectedFile = e.dataTransfer.files[0];
            if (selectedFile) {
                document.getElementById('fxDropZone').querySelector('p').textContent = '📁 ' + selectedFile.name;
                document.getElementById('fxConvertBtn').style.display = 'block';
            }
        };
        document.getElementById('fxMapFile').onchange = function(e) {
            selectedFile = e.target.files[0];
            if (selectedFile) {
                document.getElementById('fxDropZone').querySelector('p').textContent = '📁 ' + selectedFile.name;
                document.getElementById('fxConvertBtn').style.display = 'block';
            }
        };
        document.getElementById('fxConvertBtn').onclick = async function() {
            if (!selectedFile) return;
            document.getElementById('fxConvertBtn').textContent = 'Converting...';
            document.getElementById('fxConvertBtn').disabled = true;
            try {
                var result = await converter.convert(selectedFile);
                convertedGrid = result.grid;
                var preview = document.getElementById('fxPreview');
                preview.width = result.preview.width;
                preview.height = result.preview.height;
                preview.getContext('2d').drawImage(result.preview, 0, 0);
                preview.style.display = 'block';
                document.getElementById('fxConvertBtn').textContent = '✅ Done!';
                document.getElementById('fxUseMapBtns').style.display = 'block';
            } catch(err) {
                document.getElementById('fxConvertBtn').textContent = '❌ Error - Try Again';
                document.getElementById('fxConvertBtn').disabled = false;
                console.error(err);
            }
        };
        document.getElementById('fxInjectMap').onclick = function() {
            if (convertedGrid) {
                injectMapIntoGame(convertedGrid);
                modal.remove();
            }
        };
        document.getElementById('fxCloseBtn').onclick = function() { modal.remove(); };
    }

    // ==================== INJECT INTO GAME ====================
    function injectMapIntoGame(grid) {
        // Try to find the game's map data
        // This is experimental - Territorial.io stores map data in various places
        console.log('Attempting to inject map...');
        console.log('Grid size:', grid.length, 'x', grid[0].length);
        
        // Store in global scope so game patches can access it
        window.__fxCustomMap = grid;
        
        // Try to find and override the game's map generation
        if (window.game && window.game.map) {
            console.log('Found game.map, attempting override...');
            // This is a placeholder - actual implementation depends on game internals
        }
        
        alert('Custom map stored! To use it:\n\n1. The map data is saved in window.__fxCustomMap\n2. FX Client developers can add a patch to use this data\n3. Current workaround: Start a game and the map is available for the patch system');
    }

    // ==================== INIT ====================
    // Wait for body to be ready
    if (document.body) {
        createButton();
    } else {
        document.addEventListener('DOMContentLoaded', createButton);
    }

    console.log('✅ Map Converter ready! Click the 🗺️ Map button.');
})();
