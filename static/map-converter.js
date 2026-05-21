// map-converter.js - PNG to Territorial.io Map Converter
// For integration with FX Client

class TerritorialMapConverter {
    constructor() {
        // Terrain type mappings based on OpenFront.io logic
        this.TERRAIN_TYPES = {
            WATER: 0,
            PLAINS_LOW: 1,
            PLAINS_MID: 2,
            HIGHLAND: 3,
            MOUNTAIN: 4
        };

        // Blue channel thresholds (mirrors OpenFront logic)
        this.THRESHOLDS = {
            WATER: { max: 106, exact: 106 },
            PLAINS_LOW: { min: 107, max: 139 },
            PLAINS_MID: { min: 140, max: 158 },
            HIGHLAND: { min: 159, max: 178 },
            MOUNTAIN: { min: 179, max: 255 }
        };

        // Configuration
        this.config = {
            minIslandSize: 30,      // Remove islands smaller than this (pixels)
            minLakeSize: 200,       // Remove lakes smaller than this (pixels)
            targetWidth: null,      // Resize to this width (null = auto)
            targetHeight: null,     // Resize to this height (null = auto)
            normalize: true,        // Ensure dimensions are multiples of 4
            smoothEdges: true,      // Apply edge smoothing
            generatePreview: true   // Generate preview images
        };

        this.originalImage = null;
        this.terrainGrid = null;
        this.processedGrid = null;
    }

    /**
     * Load an image from a file input
     * @param {File} file - The PNG file
     * @returns {Promise<Image>}
     */
    async loadImage(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.includes('png')) {
                reject(new Error('Please upload a PNG file'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Convert image to terrain grid
     * @param {Image} img - The source image
     * @returns {Array<Array<number>>} 2D array of terrain types
     */
    imageToTerrainGrid(img) {
        // Create canvas to read pixel data
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const grid = [];

        for (let y = 0; y < canvas.height; y++) {
            grid[y] = [];
            for (let x = 0; x < canvas.width; x++) {
                const index = (y * canvas.width + x) * 4;
                const red = imageData.data[index];
                const green = imageData.data[index + 1];
                const blue = imageData.data[index + 2];
                const alpha = imageData.data[index + 3];

                // Alpha < 20 or Blue = 106 means water
                if (alpha < 20 || blue === 106) {
                    grid[y][x] = this.TERRAIN_TYPES.WATER;
                }
                // Terrain based on blue channel
                else if (blue <= this.THRESHOLDS.PLAINS_LOW.max) {
                    grid[y][x] = this.TERRAIN_TYPES.PLAINS_LOW;
                }
                else if (blue <= this.THRESHOLDS.PLAINS_MID.max) {
                    grid[y][x] = this.TERRAIN_TYPES.PLAINS_MID;
                }
                else if (blue <= this.THRESHOLDS.HIGHLAND.max) {
                    grid[y][x] = this.TERRAIN_TYPES.HIGHLAND;
                }
                else {
                    grid[y][x] = this.TERRAIN_TYPES.MOUNTAIN;
                }
            }
        }

        return grid;
    }

    /**
     * Remove small islands (connected land pixels)
     * @param {Array<Array<number>>} grid 
     * @returns {Array<Array<number>>}
     */
    removeSmallIslands(grid) {
        const height = grid.length;
        const width = grid[0].length;
        const visited = Array(height).fill(null).map(() => Array(width).fill(false));
        const islands = [];

        // Flood fill to find islands
        const floodFill = (startY, startX) => {
            const island = [];
            const queue = [[startY, startX]];
            const isLand = grid[startY][startX] !== this.TERRAIN_TYPES.WATER;
            
            while (queue.length > 0) {
                const [y, x] = queue.shift();
                
                if (y < 0 || y >= height || x < 0 || x >= width || visited[y][x]) {
                    continue;
                }
                
                const currentIsLand = grid[y][x] !== this.TERRAIN_TYPES.WATER;
                if (currentIsLand !== isLand) continue;
                
                visited[y][x] = true;
                island.push([y, x]);
                
                // Check 4-directional neighbors
                queue.push([y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]);
            }
            
            return { pixels: island, isLand };
        };

        // Find all islands and lakes
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (!visited[y][x]) {
                    const region = floodFill(y, x);
                    if (region.pixels.length > 0) {
                        islands.push(region);
                    }
                }
            }
        }

        // Create new grid with small features removed
        const cleaned = grid.map(row => [...row]);
        
        for (const region of islands) {
            const shouldRemove = region.isLand 
                ? region.pixels.length < this.config.minIslandSize
                : region.pixels.length < this.config.minLakeSize;
            
            if (shouldRemove) {
                const fillValue = region.isLand 
                    ? this.TERRAIN_TYPES.WATER 
                    : this.TERRAIN_TYPES.PLAINS_LOW;
                
                for (const [y, x] of region.pixels) {
                    cleaned[y][x] = fillValue;
                }
            }
        }

        return cleaned;
    }

    /**
     * Normalize grid dimensions to multiples of 4
     * @param {Array<Array<number>>} grid
     * @returns {Array<Array<number>>}
     */
    normalizeGrid(grid) {
        const height = grid.length;
        const width = grid[0].length;
        
        const newHeight = Math.ceil(height / 4) * 4;
        const newWidth = Math.ceil(width / 4) * 4;
        
        if (newHeight === height && newWidth === width) {
            return grid;
        }

        // Pad with water
        const normalized = Array(newHeight).fill(null).map(() => 
            Array(newWidth).fill(this.TERRAIN_TYPES.WATER)
        );

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                normalized[y][x] = grid[y][x];
            }
        }

        return normalized;
    }

    /**
     * Generate preview canvas of the terrain
     * @param {Array<Array<number>>} grid
     * @returns {HTMLCanvasElement}
     */
    generatePreview(grid) {
        const canvas = document.createElement('canvas');
        canvas.width = grid[0].length;
        canvas.height = grid.length;
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        
        // Color mapping for visualization
        const terrainColors = {
            [this.TERRAIN_TYPES.WATER]: [65, 105, 225, 255],      // Blue
            [this.TERRAIN_TYPES.PLAINS_LOW]: [144, 238, 144, 255], // Light green
            [this.TERRAIN_TYPES.PLAINS_MID]: [34, 139, 34, 255],   // Forest green
            [this.TERRAIN_TYPES.HIGHLAND]: [139, 137, 137, 255],   // Gray
            [this.TERRAIN_TYPES.MOUNTAIN]: [105, 105, 105, 255]    // Dark gray
        };

        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[0].length; x++) {
                const index = (y * canvas.width + x) * 4;
                const color = terrainColors[grid[y][x]] || [0, 0, 0, 255];
                imageData.data[index] = color[0];
                imageData.data[index + 1] = color[1];
                imageData.data[index + 2] = color[2];
                imageData.data[index + 3] = color[3];
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    /**
     * Convert grid to Territorial.io format string
     * Format: terrain codes with positions
     * @param {Array<Array<number>>} grid
     * @returns {string}
     */
    toTerritorialFormat(grid) {
        // Territorial.io uses a custom text format
        // This is a simplified representation - you'll need to match their exact format
        const height = grid.length;
        const width = grid[0].length;
        
        let output = `MAP:${width}x${height}\n`;
        
        // Run-length encoding for efficiency
        for (let y = 0; y < height; y++) {
            let currentTerrain = grid[y][0];
            let runLength = 1;
            
            for (let x = 1; x < width; x++) {
                if (grid[y][x] === currentTerrain) {
                    runLength++;
                } else {
                    output += `${currentTerrain}:${runLength},`;
                    currentTerrain = grid[y][x];
                    runLength = 1;
                }
            }
            output += `${currentTerrain}:${runLength}\n`;
        }
        
        return output;
    }

    /**
     * Main conversion pipeline
     * @param {File} pngFile
     * @returns {Promise<{grid: Array, preview: HTMLCanvasElement, mapData: string}>}
     */
    async convert(pngFile) {
        try {
            // Step 1: Load image
            const img = await this.loadImage(pngFile);
            console.log(`Image loaded: ${img.width}x${img.height}`);

            // Step 2: Convert to terrain grid
            let grid = this.imageToTerrainGrid(img);
            console.log('Terrain grid created');

            // Step 3: Remove small features
            grid = this.removeSmallIslands(grid);
            console.log('Small features removed');

            // Step 4: Normalize dimensions
            if (this.config.normalize) {
                grid = this.normalizeGrid(grid);
                console.log(`Grid normalized to ${grid[0].length}x${grid.length}`);
            }

            // Step 5: Generate outputs
            const preview = this.config.generatePreview ? this.generatePreview(grid) : null;
            const mapData = this.toTerritorialFormat(grid);

            return {
                grid: grid,
                preview: preview,
                mapData: mapData,
                dimensions: { width: grid[0].length, height: grid.length }
            };

        } catch (error) {
            console.error('Conversion failed:', error);
            throw error;
        }
    }
}

// Export for use in FX Client
export default TerritorialMapConverter;
