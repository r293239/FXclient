// FX Client Map Converter - All-in-one
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

    // ==================== UI MODAL ====================
    function showMapUploader() {
        // Remove existing if any
        var existing = document.getElementById('fxMapModal');
        if (existing) existing.remove();

        var modal = document.createElement('div');
        modal.id = 'fxMapModal';
        modal.innerHTML = 
            '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:99999;background:#1a1a2e;border-radius:16px;padding:24px;color:#fff;border:2px solid #4CAF50;min-width:320px;max-width:90vw;box-shadow:0 0 40px rgba(76,175,80,0.3)">' +
                '<h2 style="margin:0 0 16px;text-align:center">🗺️ Custom Map Upload</h2>' +
                '<div id="fxDropZone" style="border:2px dashed #4CAF50;border-radius:8px;padding:30px;text-align:center;cursor:pointer;background:rgba(76,175,80,0.05)">' +
                    '<p style="margin:0;font-size:16px">Drop PNG here or tap to select</p>' +
                    '<input type="file" id="fxMapFile" accept=".png" hidden>' +
                '</div>' +
                '<button id="fxConvertBtn" style="display:none;width:100%;margin-top:12px;padding:12px;background:#4CAF50;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;font-weight:bold">Convert Map</button>' +
                '<canvas id="fxPreview" style="display:none;width:100%;margin-top:12px;border-radius:4px;image-rendering:pixelated;border:1px solid #444"></canvas>' +
                '<button id="fxCloseBtn" style="width:100%;margin-top:12px;padding:10px;background:#444;color:#fff;border:none;border-radius:8px;cursor:pointer">Close</button>' +
            '</div>';
        document.body.appendChild(modal);

        var converter = new TerritorialMapConverter();
        var selectedFile = null;

        document.getElementById('fxDropZone').onclick = function() {
            document.getElementById('fxMapFile').click();
        };
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
                var preview = document.getElementById('fxPreview');
                preview.width = result.preview.width;
                preview.height = result.preview.height;
                preview.getContext('2d').drawImage(result.preview, 0, 0);
                preview.style.display = 'block';
                document.getElementById('fxConvertBtn').textContent = '✅ Done!';
                console.log('Map converted:', result.dimensions.width + 'x' + result.dimensions.height);
            } catch(err) {
                document.getElementById('fxConvertBtn').textContent = '❌ Error - Try Again';
                document.getElementById('fxConvertBtn').disabled = false;
                console.error(err);
            }
        };
        document.getElementById('fxCloseBtn').onclick = function() {
            modal.remove();
        };
    }

    // ==================== ADD BUTTON ====================
    var btn = document.createElement('button');
    btn.textContent = '🗺️ Map';
    btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9998;padding:12px 20px;background:#4CAF50;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.4)';
    btn.onclick = showMapUploader;
    document.body.appendChild(btn);

    console.log('✅ Map Converter ready! Click the 🗺️ Map button.');
})();
