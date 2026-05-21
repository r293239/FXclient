// integrate.js - Hook into FX Client
import MapUploadUI from './map-upload-ui.js';

class FXClientMapIntegration {
    constructor() {
        this.mapUI = null;
        this.originalLoadMap = null;
    }

    init() {
        // Wait for FX Client to be ready
        const checkInterval = setInterval(() => {
            // Look for game container or menu
            const gameContainer = document.querySelector('#game-container') || 
                                 document.querySelector('.main-menu') ||
                                 document.body;
            
            if (gameContainer) {
                clearInterval(checkInterval);
                this.injectMapUploader(gameContainer);
            }
        }, 500);
    }

    injectMapUploader(container) {
        // Create map upload UI
        this.mapUI = new MapUploadUI();
        
        // Add to game menu or create a modal
        const mapButton = document.createElement('button');
        mapButton.textContent = '🎨 Custom Map';
        mapButton.className = 'fx-client-menu-btn';
        mapButton.onclick = () => this.toggleMapUI();
        
        // Try to add to existing menu
        const menuBar = document.querySelector('.menu-bar') || 
                       document.querySelector('.game-menu');
        
        if (menuBar) {
            menuBar.appendChild(mapButton);
        } else {
            // Create floating button
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
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(mapButton);
        }

        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.id = 'map-upload-modal';
        modalContainer.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            overflow-y: auto;
            padding: 40px;
        `;
        document.body.appendChild(modalContainer);
        
        this.mapUI.mount(modalContainer);
        this.modalContainer = modalContainer;

        // Intercept map loading if possible
        this.interceptMapLoading();
    }

    toggleMapUI() {
        const modal = document.getElementById('map-upload-modal');
        if (modal) {
            modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
        }
    }

    interceptMapLoading() {
        // Try to intercept Territorial.io's map loading
        // This will need adjustment based on actual FX Client code
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            // Check if this is a map request
            const url = args[0];
            if (typeof url === 'string' && url.includes('map')) {
                console.log('Intercepted map request:', url);
                
                // If user has a custom map loaded, inject it
                if (this.mapUI?.mapResult?.mapData) {
                    console.log('Injecting custom map');
                    return new Response(this.mapUI.mapResult.mapData, {
                        status: 200,
                        headers: { 'Content-Type': 'text/plain' }
                    });
                }
            }
            
            return originalFetch.apply(this, args);
        };
    }
}

// Auto-initialize
const integration = new FXClientMapIntegration();
integration.init();
