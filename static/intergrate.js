// integrate.js - Hook into FX Client

(function() {
    // Wait for game to be ready, then show the map button
    function init() {
        // Create floating button
        const mapButton = document.createElement('button');
        mapButton.textContent = '🎨 Custom Map';
        mapButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            padding: 12px 24px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        `;

        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'map-upload-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.85);
            z-index: 10000;
            overflow-y: auto;
            padding: 40px 20px;
        `;
        document.body.appendChild(modal);

        let mapUI = null;

        mapButton.addEventListener('click', () => {
            if (modal.style.display === 'none') {
                // Create UI if first time
                if (!mapUI) {
                    mapUI = new MapUploadUI();
                    mapUI.mount(modal);
                }
                modal.style.display = 'block';
                mapButton.textContent = '❌ Close Map';
            } else {
                modal.style.display = 'none';
                mapButton.textContent = '🎨 Custom Map';
            }
        });

        // Close modal when clicking outside the panel
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                mapButton.textContent = '🎨 Custom Map';
            }
        });

        document.body.appendChild(mapButton);
        console.log('✅ FX Client Map Converter ready! Click the 🎨 button.');
    }

    // Wait for page to fully load
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})();
