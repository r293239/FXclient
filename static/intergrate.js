// integrate.js - Adds map button to FX Client
(function() {
    if (document.getElementById('fx-map-btn')) return; // already added

    const btn = document.createElement('button');
    btn.id = 'fx-map-btn';
    btn.textContent = '🎨 Map';
    btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;padding:12px 20px;background:#4CAF50;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.4)';
    
    const modal = document.createElement('div');
    modal.id = 'fx-map-modal';
    modal.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:10000;overflow-y:auto;padding:40px 20px';
    document.body.appendChild(modal);

    let ui = null;
    btn.onclick = () => {
        if (modal.style.display === 'none') {
            if (!ui) { ui = new MapUploadUI(); ui.mount(modal); }
            modal.style.display = 'block';
            btn.textContent = '❌ Close';
        } else {
            modal.style.display = 'none';
            btn.textContent = '🎨 Map';
        }
    };
    modal.onclick = e => { if (e.target === modal) { modal.style.display = 'none'; btn.textContent = '🎨 Map'; } };
    
    document.body.appendChild(btn);
    console.log('🎨 Map button ready');
})();
