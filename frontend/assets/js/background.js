// Universal Matrix-style Background for all pages
function initThreeJS() {
    const container = document.getElementById('three-bg');
    if (!container) {
        console.warn('three-bg container not found');
        return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = [];
    
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * canvas.height / fontSize;
    }
    
    const blueShades = [
        'rgba(30, 58, 138, 0.6)',
        'rgba(37, 99, 235, 0.6)',
        'rgba(59, 130, 246, 0.6)',
        'rgba(96, 165, 250, 0.6)',
        'rgba(147, 197, 253, 0.6)'
    ];
    
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?';
    
    function draw() {
        ctx.fillStyle = 'rgba(17, 24, 39, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const char = characters[Math.floor(Math.random() * characters.length)];
            
            const color = blueShades[Math.floor(Math.random() * blueShades.length)];
            ctx.fillStyle = color;
            
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            ctx.fillText(char, x, y);
            
            if (y > canvas.height && Math.random() > 0.95) {
                drops[i] = 0;
            }
            
            drops[i] += 0.3;
        }
    }
    
    setInterval(draw, 80);
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const newColumns = Math.floor(canvas.width / fontSize);
        drops.length = newColumns;
        for (let i = 0; i < newColumns; i++) {
            if (drops[i] === undefined) {
                drops[i] = Math.random() * canvas.height / fontSize;
            }
        }
    });
}

// Auto-initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThreeJS);
} else {
    initThreeJS();
}
