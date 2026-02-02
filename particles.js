// 3D Particle Globe with Hybrid Magnetic Interaction
// Particles pull towards cursor, repel subtler, and glow when interacting

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let globeParticles = [];
let globeCenter = { x: 0, y: 0 };
let globeRadius = 180;
let rotationAngle = 0;
let isHovering = false;
let hoverProgress = 0;
let time = 0;
let activeShots = []; // Track clicks for "shot" effect

// Electrifying Interaction State
window.isCtaHovered = false;
let ctaHoverProgress = 0;
let mouse = { x: null, y: null };

// Keyword State
const KEYWORDS = ['DSGVO KONFORM*', 'LEAD-TURBO', 'NO-SHOW-STOPP', 'ADMIN-FREI', 'AUTOMATISIERT', '24/7', 'VERNETZT', 'SKALIERBAR'];
let keywordIndex = 0;
let emittedKeywords = [];

class EmittedKeyword {
    constructor(parentParticle) {
        this.text = KEYWORDS[keywordIndex];
        keywordIndex = (keywordIndex + 1) % KEYWORDS.length;
        this.parent = parentParticle;

        // Local offset for floating/pop-up
        this.targetDist = 40 + Math.random() * 30;
        this.currentDist = 0;

        this.life = 1.0;
        this.decay = 0.002 + Math.random() * 0.002;
        this.popSpeed = 0.1;
    }

    update() {
        if (this.currentDist < this.targetDist) {
            this.currentDist += (this.targetDist - this.currentDist) * this.popSpeed;
        }
        this.life -= this.decay;
    }

    draw() {
        if (this.life <= 0 || !this.parent) return;

        const px = this.parent.screenX;
        const py = this.parent.screenY;

        const dx = px - globeCenter.x;
        const dy = py - globeCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;

        const wordX = px + ux * this.currentDist;
        const wordY = py + uy * this.currentDist;

        const opacity = Math.min(this.life * 2, 1);

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(wordX, wordY);
        ctx.strokeStyle = `rgba(124, 58, 237, ${opacity * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.save();
        ctx.translate(wordX, wordY);
        const scale = 0.5 + (this.currentDist / this.targetDist) * 0.5;
        ctx.scale(scale, scale);
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(124, 58, 237, 0.5)';
        ctx.fillStyle = `rgba(124, 58, 237, ${opacity})`;

        const textWidth = ctx.measureText(this.text).width;
        const pPadding = 8;
        const pillW = textWidth + pPadding * 2;
        const pillH = 20;
        const pillX = -pillW / 2;
        const pillY = -10;
        const r = 10;

        ctx.beginPath();
        ctx.moveTo(pillX + r, pillY);
        ctx.lineTo(pillX + pillW - r, pillY);
        ctx.arcTo(pillX + pillW, pillY, pillX + pillW, pillY + r, r);
        ctx.lineTo(pillX + pillW, pillY + pillH - r);
        ctx.arcTo(pillX + pillW, pillY + pillH, pillX + pillW - r, pillY + pillH, r);
        ctx.lineTo(pillX + r, pillY + pillH);
        ctx.arcTo(pillX, pillY + pillH, pillX, pillY + pillH - r, r);
        ctx.lineTo(pillX, pillY + r);
        ctx.arcTo(pillX, pillY, pillX + r, pillY, r);
        ctx.closePath();

        ctx.fillStyle = `rgba(10, 10, 10, ${opacity * 0.85})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(124, 58, 237, ${opacity * 0.6})`;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.95})`;
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
}

function spawnKeyword() {
    const rimParticles = globeParticles.filter(p => p.currentZ > 0.4);
    if (rimParticles.length > 0) {
        const p = rimParticles[Math.floor(Math.random() * rimParticles.length)];
        emittedKeywords.push(new EmittedKeyword(p));
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateGlobeCenter();
    initGlobeParticles();
}

function updateGlobeCenter() {
    const zone = document.getElementById('particle-sphere-zone');
    if (zone) {
        const rect = zone.getBoundingClientRect();
        globeCenter.x = rect.left + rect.width / 2;
        globeCenter.y = rect.top + rect.height / 2;
        const isMobile = window.innerWidth <= 768;
        globeRadius = Math.min(rect.width, rect.height) * (isMobile ? 0.45 : 0.38);
    } else {
        globeCenter.x = canvas.width * 0.72;
        globeCenter.y = canvas.height * 0.45;
        globeRadius = 180;
    }
}

class GlobeParticle {
    constructor(index, total) {
        this.id = index;
        this.stableRandom = Math.random();
        const phi = Math.acos(1 - 2 * (index + 0.5) / total);
        const theta = Math.PI * (1 + Math.sqrt(5)) * index;

        this.baseX = Math.sin(phi) * Math.cos(theta);
        this.baseY = Math.sin(phi) * Math.sin(theta);
        this.baseZ = Math.cos(phi);

        this.size = Math.random() * 4.5 + 0.8;
        this.baseOpacity = Math.random() * 0.5 + 0.4;
        this.driftOffset = Math.random() * Math.PI * 2;
        this.driftSpeed = Math.random() * 0.0002 + 0.0001;

        this.offsetX = 0;
        this.offsetY = 0;
        this.interactionLevel = 0;

        this.screenX = 0;
        this.screenY = 0;
        this.currentZ = 0;
        this.currentOpacity = 0;
        this.currentSize = this.size;
    }

    update(rotation, hover, globalTime, mouseX, mouseY) {
        const cosR = Math.cos(rotation);
        const sinR = Math.sin(rotation);

        let x = this.baseX * cosR - this.baseZ * sinR;
        let y = this.baseY;
        let z = this.baseX * sinR + this.baseZ * cosR;
        this.currentZ = z;

        const drift = Math.sin(globalTime * this.driftSpeed + this.driftOffset) * 0.02;
        x += drift;
        y += drift * 0.5;

        const scale = globeRadius;
        let screenX = globeCenter.x + x * scale;
        let screenY = globeCenter.y + y * scale;

        if (ctaHoverProgress > 0.01) {
            screenX += (Math.random() - 0.5) * ctaHoverProgress * 4;
            screenY += (Math.random() - 0.5) * ctaHoverProgress * 4;
        }

        let currentPull = 0;

        if (mouseX !== null && mouseY !== null) {
            const dx = screenX - mouseX;
            const dy = screenY - mouseY;
            const distSq = dx * dx + dy * dy;

            const attractRadius = globeRadius * 1.8;
            const attractRadiusSq = attractRadius * attractRadius;
            if (distSq < attractRadiusSq) {
                const dist = Math.sqrt(distSq);
                const attractForce = (1 - dist / attractRadius);
                const pullStrength = attractForce * attractForce * 26.67;

                this.offsetX -= (dx / dist) * pullStrength * 0.066;
                this.offsetY -= (dy / dist) * pullStrength * 0.066;

                const glowRadius = globeRadius * 1.0;
                if (dist < glowRadius) {
                    currentPull = Math.pow(1 - dist / glowRadius, 1.5);
                }
            }
        }

        activeShots.forEach(shot => {
            const dx = screenX - shot.x;
            const dy = screenY - shot.y;
            const distSq = dx * dx + dy * dy;
            const sRadSq = shot.radius * shot.radius;

            if (distSq < sRadSq) {
                const dist = Math.sqrt(distSq) || 1;
                const force = (1 - dist / shot.radius) * shot.life * 60;
                this.offsetX += (dx / dist) * force;
                this.offsetY += (dy / dist) * force;
            }
        });

        this.interactionLevel += (currentPull - this.interactionLevel) * 0.15;
        this.offsetX *= 0.94;
        this.offsetY *= 0.94;

        this.screenX = screenX + this.offsetX;
        this.screenY = screenY + this.offsetY;

        const zOffset = z * 0.5 + 1;
        const sizeScale = globeRadius / 180;
        this.currentSize = this.size * sizeScale * (0.5 + zOffset * 0.35);

        if (this.interactionLevel > 0.05) {
            this.currentSize *= (1 + this.interactionLevel * 0.5);
        }

        this.currentOpacity = this.baseOpacity * (0.4 + zOffset * 0.6);
        if (z < -0.2) this.currentOpacity *= 0.4;
    }

    draw() {
        if (this.currentOpacity < 0.05) return;

        const i = this.interactionLevel;
        const factor = i > 0.1 ? Math.min(1, i * 1.5) : 0;

        if (factor > 0.2) {
            ctx.beginPath();
            ctx.arc(this.screenX, this.screenY, this.currentSize * (1 + factor * 0.5), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(124, 58, 237, ${factor * 0.85})`;
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(this.screenX, this.screenY, this.currentSize, 0, Math.PI * 2);

        const r = Math.round(255 - 131 * factor);
        const g = Math.round(255 - 197 * factor);
        const b = Math.round(255 - 18 * factor);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, this.currentOpacity * (0.95 + factor * 0.5))})`;
        ctx.fill();
    }
}

function initGlobeParticles() {
    globeParticles = [];
    const isMobile = window.innerWidth <= 768;
    const particleCount = isMobile ? 180 : 300;
    for (let i = 0; i < particleCount; i++) {
        globeParticles.push(new GlobeParticle(i, particleCount));
    }
}

function setupHoverDetection() {
    const zone = document.getElementById('particle-sphere-zone');
    if (!zone) return;

    zone.addEventListener('mouseenter', () => isHovering = true);
    zone.addEventListener('mouseleave', () => {
        isHovering = false;
        mouse.x = null;
        mouse.y = null;
    });

    zone.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    zone.addEventListener('touchstart', (e) => {
        isHovering = true;
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    }, { passive: true });

    zone.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    }, { passive: true });

    zone.addEventListener('touchend', () => {
        isHovering = false;
        mouse.x = null;
        mouse.y = null;
    });

    zone.addEventListener('mousedown', (e) => {
        if (isHovering) {
            activeShots.push({
                x: e.clientX,
                y: e.clientY,
                radius: globeRadius * 0.3,
                life: 1.0,
                decay: 0.05
            });
        }
    });
}

function animateGlobe() {
    requestAnimationFrame(animateGlobe);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    time += 16;

    const targetCtaProgress = window.isCtaHovered ? 1 : 0;
    ctaHoverProgress += (targetCtaProgress - ctaHoverProgress) * 0.05;

    const baseRotationSpeed = 0.0015;
    const electrifyingRotationSpeed = 0.003;
    rotationAngle += baseRotationSpeed + (electrifyingRotationSpeed - baseRotationSpeed) * ctaHoverProgress;

    if (Math.random() < 0.004) {
        spawnKeyword();
    }

    const targetHover = isHovering ? 1 : 0;
    hoverProgress += (targetHover - hoverProgress) * 0.035;

    activeShots.forEach(s => s.life -= s.decay);
    activeShots = activeShots.filter(s => s.life > 0);

    globeParticles.forEach(p => p.update(rotationAngle, hoverProgress, time, mouse.x, mouse.y));
    globeParticles.sort((a, b) => a.currentZ - b.currentZ);

    const connDist = globeRadius * 0.75;
    const connectionRadiusSq = connDist * connDist;

    ctx.lineWidth = 0.8;
    for (let i = 0; i < globeParticles.length; i++) {
        const p1 = globeParticles[i];
        if (p1.currentOpacity < 0.15) continue;

        if (p1.stableRandom > 0.65) continue;

        for (let j = i + 1; j < globeParticles.length; j++) {
            const p2 = globeParticles[j];
            if (p2.currentOpacity < 0.15) continue;
            if (p2.stableRandom > 0.65) continue;

            const dx = p1.screenX - p2.screenX;
            const dy = p1.screenY - p2.screenY;
            const distSq = dx * dx + dy * dy;

            if (distSq < connectionRadiusSq) {
                const dist = Math.sqrt(distSq);
                const connectionSeed = (p1.id * 7 + p2.id * 13);
                const individualPulse = 0.4 + Math.pow(Math.max(0, Math.sin(time * 0.002 + connectionSeed)), 3) * 0.6;
                const alpha = (1 - dist / connDist) * 0.5 * Math.min(p1.currentOpacity, p2.currentOpacity) * individualPulse;

                ctx.beginPath();
                ctx.moveTo(p1.screenX, p1.screenY);
                ctx.lineTo(p2.screenX, p2.screenY);
                ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`;
                ctx.stroke();
            }
        }
    }

    for (let particle of globeParticles) {
        particle.draw();
    }

    emittedKeywords.forEach(k => k.update());
    emittedKeywords = emittedKeywords.filter(k => k.life > 0);
    emittedKeywords.forEach(k => k.draw());
}

resizeCanvas();
setupHoverDetection();
animateGlobe();

window.addEventListener('resize', resizeCanvas);
let scrollTimeout;
window.addEventListener('scroll', () => {
    if (!scrollTimeout) {
        scrollTimeout = requestAnimationFrame(() => {
            updateGlobeCenter();
            scrollTimeout = null;
        });
    }
}, { passive: true });

setInterval(updateGlobeCenter, 5000); 
