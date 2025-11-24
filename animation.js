const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const modeNameElement = document.getElementById('mode-name');

let width, height;

// Mouse state
const mouse = {
    x: null,
    y: null
};

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});
window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

// Base Scene Class
class Scene {
    constructor() {
        this.particles = [];
    }
    init() { }
    resize() { }
    update() { }
    draw() { }
}

// 1. Antigravity Scene (Original)
class AntigravityScene extends Scene {
    constructor() {
        super();
        this.name = "Antigravity";
        this.particleCount = 100;
        this.connectionDistance = 150;
        this.mouseRadius = 200;
    }

    init() {
        this.particles = [];
        const count = (width * height) / 9000;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                size: 2,
                density: (Math.random() * 30) + 1
            });
        }
    }

    update() {
        for (let p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            if (mouse.x != null) {
                let dx = mouse.x - p.x;
                let dy = mouse.y - p.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.mouseRadius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (this.mouseRadius - distance) / this.mouseRadius;
                    const directionX = forceDirectionX * force * p.density;
                    const directionY = forceDirectionY * force * p.density;
                    p.x -= directionX;
                    p.y -= directionY;
                }
            }
        }
    }

    draw() {
        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            for (let j = i; j < this.particles.length; j++) {
                let p2 = this.particles[j];
                let dx = p.x - p2.x;
                let dy = p.y - p2.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.connectionDistance) {
                    ctx.beginPath();
                    let opacity = 1 - (distance / this.connectionDistance);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
    }
}

// 2. Gravity Scene (Attraction)
class GravityScene extends Scene {
    constructor() {
        super();
        this.name = "Gravity";
    }

    init() {
        this.particles = [];
        const count = (width * height) / 5000; // More particles
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 2 + 1,
                friction: 0.95
            });
        }
    }

    update() {
        for (let p of this.particles) {
            if (mouse.x != null) {
                let dx = mouse.x - p.x;
                let dy = mouse.y - p.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                // Attraction force
                let force = 500 / (distance * distance + 100); // Inverse square law ish
                let angle = Math.atan2(dy, dx);

                p.vx += Math.cos(angle) * force;
                p.vy += Math.sin(angle) * force;
            }

            p.vx *= p.friction;
            p.vy *= p.friction;

            p.x += p.vx;
            p.y += p.vy;

            // Wrap around edges
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;
        }
    }

    draw() {
        ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
        for (let p of this.particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw lines to mouse
        if (mouse.x != null) {
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.1)';
            ctx.beginPath();
            for (let p of this.particles) {
                let dx = mouse.x - p.x;
                let dy = mouse.y - p.y;
                if (dx * dx + dy * dy < 40000) {
                    ctx.moveTo(mouse.x, mouse.y);
                    ctx.lineTo(p.x, p.y);
                }
            }
            ctx.stroke();
        }
    }
}

// 3. Vortex Scene (Black Hole / Suction)
class VortexScene extends Scene {
    constructor() {
        super();
        this.name = "Vortex";
    }

    init() {
        this.particles = [];
        const count = 500;
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        // Spawn randomly
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2 + 0.5,
            color: `hsl(${Math.random() * 60 + 220}, 80%, 60%)`, // Blue-ish
            angle: Math.random() * Math.PI * 2,
            radius: Math.random() * Math.max(width, height) // Distance from center
        };
    }

    update() {
        let centerX = mouse.x || width / 2;
        let centerY = mouse.y || height / 2;

        for (let p of this.particles) {
            // Calculate current position relative to center
            let dx = p.x - centerX;
            let dy = p.y - centerY;
            let distance = Math.sqrt(dx * dx + dy * dy);
            let angle = Math.atan2(dy, dx);

            // Move closer to center (Suction)
            // Reduced speed parameters for smoother effect
            let radialVelocity = 1 + (200 / (distance + 1));

            // Rotate around center
            let angularVelocity = 0.02 + (5 / (distance + 1));

            angle += angularVelocity;
            distance -= radialVelocity;

            // Update position
            p.x = centerX + Math.cos(angle) * distance;
            p.y = centerY + Math.sin(angle) * distance;

            // Respawn if too close to center (Event Horizon)
            if (distance < 5) {
                // Respawn at edge of screen
                let spawnAngle = Math.random() * Math.PI * 2;
                let spawnRadius = Math.max(width, height) * 0.8;
                p.x = centerX + Math.cos(spawnAngle) * spawnRadius;
                p.y = centerY + Math.sin(spawnAngle) * spawnRadius;
            }
        }
    }

    draw() {
        for (let p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 4. Ripple Scene (Breathing Grid Wave)
class RippleScene extends Scene {
    constructor() {
        super();
        this.name = "Ripple";
        this.cols = 0;
        this.rows = 0;
        this.spacing = 30;
        this.time = 0;
    }

    init() {
        this.particles = [];
        this.cols = Math.ceil(width / this.spacing);
        this.rows = Math.ceil(height / this.spacing);
        this.time = 0;

        for (let y = 0; y <= this.rows; y++) {
            for (let x = 0; x <= this.cols; x++) {
                this.particles.push({
                    baseX: x * this.spacing,
                    baseY: y * this.spacing,
                    x: x * this.spacing,
                    y: y * this.spacing,
                });
            }
        }
    }

    update() {
        this.time += 0.05;

        for (let p of this.particles) {
            // Idle Wave Motion (Breathing)
            // Calculate distance from center for a radial wave, or just use X/Y for linear wave
            let idleOffset = Math.sin(p.baseX * 0.02 + this.time) * 5 + Math.cos(p.baseY * 0.02 + this.time) * 5;

            let targetX = p.baseX;
            let targetY = p.baseY + idleOffset;

            // Mouse Interaction
            if (mouse.x != null) {
                let dx = mouse.x - p.baseX;
                let dy = mouse.y - p.baseY;
                let distance = Math.sqrt(dx * dx + dy * dy);

                let maxDist = 300;
                if (distance < maxDist) {
                    let angle = Math.atan2(dy, dx);
                    let force = (maxDist - distance) / maxDist;
                    // Push away
                    let displacement = force * 50;
                    targetX -= Math.cos(angle) * displacement;
                    targetY -= Math.sin(angle) * displacement;
                }
            }

            // Smoothly move to target
            p.x += (targetX - p.x) * 0.1;
            p.y += (targetY - p.y) * 0.1;
        }
    }

    draw() {
        ctx.fillStyle = 'rgba(0, 255, 150, 0.6)';
        for (let p of this.particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 5. Galaxy Scene (Logarithmic Spiral)
class GalaxyScene extends Scene {
    constructor() {
        super();
        this.name = "Galaxy";
    }

    init() {
        this.particles = [];
        const count = 800;
        const arms = 3;

        for (let i = 0; i < count; i++) {
            // Logarithmic spiral math
            // r = a * e^(b * theta)
            let spiralAngle = (Math.random() * Math.PI * 2 * 3); // 3 full rotations
            let armOffset = (Math.floor(Math.random() * arms) / arms) * Math.PI * 2;
            let finalAngle = spiralAngle + armOffset;

            let radius = 5 + Math.pow(spiralAngle, 1.5) * 15; // Exponential growth

            // Add randomness to scatter particles around the arm
            let randomOffset = (Math.random() - 0.5) * (radius * 0.4);

            this.particles.push({
                baseRadius: radius + randomOffset,
                angle: finalAngle,
                speed: 0.002 / (radius * 0.01 + 1), // Outer stars move slower
                size: Math.random() * 2 + 0.5,
                color: this.getGalaxyColor(radius),
                z: Math.random() // For 3D tilt effect simulation
            });
        }
    }

    getGalaxyColor(radius) {
        // Center = Hot/White/Yellow, Middle = Purple/Pink, Outer = Blue
        if (radius < 50) return `hsl(60, 100%, 80%)`;
        if (radius < 150) return `hsl(${300 + Math.random() * 40}, 80%, 60%)`;
        return `hsl(${200 + Math.random() * 60}, 80%, 60%)`;
    }

    update() {
        let centerX = width / 2;
        let centerY = height / 2;

        // Mouse tilts the galaxy (simulated 3D)
        let tiltX = 1;
        let tiltY = 0.6; // Default flattened view

        if (mouse.x != null) {
            // Map mouse Y to tilt
            tiltY = 0.3 + (mouse.y / height) * 0.7;
        }

        for (let p of this.particles) {
            p.angle += p.speed;

            // 3D Projection
            p.x = centerX + Math.cos(p.angle) * p.baseRadius * tiltX;
            p.y = centerY + Math.sin(p.angle) * p.baseRadius * tiltY;
        }
    }

    draw() {
        for (let p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 6. Matrix Rain Scene (Digital Fall)
class MatrixScene extends Scene {
    constructor() {
        super();
        this.name = "Matrix Rain";
        this.fontSize = 14;
    }

    init() {
        this.columns = Math.floor(width / this.fontSize);
        this.drops = [];
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.random() * -100; // Start above screen
        }
        // Pre-generate characters to save performance
        this.chars = "0123456789ABCDEF";
    }

    update() {
        // No specific update logic needed per frame other than drawing
    }

    draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Fade effect
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#0F0'; // Green text
        ctx.font = this.fontSize + 'px monospace';

        for (let i = 0; i < this.drops.length; i++) {
            const text = this.chars.charAt(Math.floor(Math.random() * this.chars.length));

            // Mouse interaction: Brighten or change color near mouse
            let isNearMouse = false;
            if (mouse.x != null) {
                let dx = i * this.fontSize - mouse.x;
                let dy = this.drops[i] * this.fontSize - mouse.y;
                if (dx * dx + dy * dy < 10000) isNearMouse = true;
            }

            if (isNearMouse) ctx.fillStyle = '#FFF';
            else ctx.fillStyle = '#0F0';

            ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

            if (this.drops[i] * this.fontSize > height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }

            // Mouse "lift" effect
            if (isNearMouse) {
                this.drops[i] -= 0.5; // Slow down or reverse
            } else {
                this.drops[i]++;
            }
        }
    }
}

// 7. Flow Field Scene (Enhanced)
class FlowFieldScene extends Scene {
    constructor() {
        super();
        this.name = "Flow Field";
        this.scale = 20;
    }

    init() {
        this.particles = [];
        const count = 1000;
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 0,
            vy: 0,
            history: [],
            maxLength: Math.random() * 20 + 10,
            baseColor: Math.random() * 60 + 180, // Blue-ish hue
            hue: 0
        };
    }

    update() {
        for (let p of this.particles) {
            // Simple pseudo-noise based on position
            let angle = (Math.sin(p.x * 0.005) + Math.cos(p.y * 0.005)) * Math.PI * 2;

            // Mouse interaction: Add velocity and change color
            let speedBoost = 0;
            if (mouse.x != null) {
                let dx = p.x - mouse.x;
                let dy = p.y - mouse.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    // Drag effect: move in direction of mouse movement (approximated by just pushing away or swirling)
                    // Let's make them flow AROUND the mouse like a rock in a stream
                    let angleToMouse = Math.atan2(dy, dx);
                    angle = angleToMouse + Math.PI / 2; // Perpendicular
                    speedBoost = 2;
                    p.hue = 0; // Red/Hot near mouse
                } else {
                    p.hue = p.baseColor;
                }
            } else {
                p.hue = p.baseColor;
            }

            p.vx += Math.cos(angle) * (0.5 + speedBoost);
            p.vy += Math.sin(angle) * (0.5 + speedBoost);

            // Friction
            p.vx *= 0.95;
            p.vy *= 0.95;

            p.x += p.vx;
            p.y += p.vy;

            // Trail
            p.history.push({ x: p.x, y: p.y });
            if (p.history.length > p.maxLength) p.history.shift();

            // Wrap
            if (p.x < 0) { p.x = width; p.history = []; }
            if (p.x > width) { p.x = 0; p.history = []; }
            if (p.y < 0) { p.y = height; p.history = []; }
            if (p.y > height) { p.y = 0; p.history = []; }
        }
    }

    draw() {
        ctx.lineWidth = 1;
        for (let p of this.particles) {
            ctx.strokeStyle = `hsla(${p.hue}, 80%, 60%, 0.5)`;
            ctx.beginPath();
            if (p.history.length > 0) {
                ctx.moveTo(p.history[0].x, p.history[0].y);
                for (let i = 1; i < p.history.length; i++) {
                    ctx.lineTo(p.history[i].x, p.history[i].y);
                }
            }
            ctx.stroke();
        }
    }
}

// 8. Voronoi Scene (Cellular Geometry)
class VoronoiScene extends Scene {
    constructor() {
        super();
        this.name = "Voronoi";
    }

    init() {
        this.seeds = [];
        const count = 20;
        for (let i = 0; i < count; i++) {
            this.seeds.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`
            });
        }
    }

    update() {
        // Move seeds
        for (let s of this.seeds) {
            s.x += s.vx;
            s.y += s.vy;
            if (s.x < 0 || s.x > width) s.vx *= -1;
            if (s.y < 0 || s.y > height) s.vy *= -1;
        }

        // Mouse is an extra seed
        this.mouseSeed = null;
        if (mouse.x != null) {
            this.mouseSeed = { x: mouse.x, y: mouse.y, color: '#FFF' };
        }
    }

    draw() {
        // Naive Voronoi rendering (pixel by pixel is too slow for JS Canvas 60fps full screen)
        // Optimization: Draw cones from top view using WebGL... but we are in 2D canvas.
        // Alternative: Just draw the seeds and connections (Delaunay) or limited resolution.
        // Let's do a "Cellular" effect by drawing large circles that overlap? No.
        // Let's do Delaunay Triangulation (Dual of Voronoi) which is easier to draw with lines.

        // Actually, for a cool effect that isn't heavy:
        // Draw points, and for every pixel (low res), find closest point.
        // To make it fast, we'll use a lower resolution canvas or just draw the edges.

        // Let's stick to "Delaunay Connections" as a proxy for Voronoi structure visualization
        // It fits the "Network" theme better and is performant.

        let allSeeds = [...this.seeds];
        if (this.mouseSeed) allSeeds.push(this.mouseSeed);

        ctx.lineWidth = 1;
        for (let i = 0; i < allSeeds.length; i++) {
            let s1 = allSeeds[i];

            // Draw Seed
            ctx.fillStyle = s1.color;
            ctx.beginPath();
            ctx.arc(s1.x, s1.y, 4, 0, Math.PI * 2);
            ctx.fill();

            // Connect to nearby seeds (approximate Delaunay)
            for (let j = i + 1; j < allSeeds.length; j++) {
                let s2 = allSeeds[j];
                let dist = Math.hypot(s1.x - s2.x, s1.y - s2.y);
                if (dist < 300) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.beginPath();
                    ctx.moveTo(s1.x, s1.y);
                    ctx.lineTo(s2.x, s2.y);
                    ctx.stroke();
                }
            }
        }
    }
}

// 9. Sine Wave Scene (3D Surface)
class SineWaveScene extends Scene {
    constructor() {
        super();
        this.name = "Sine Waves";
        this.time = 0;
    }

    init() {
        this.particles = [];
        let spacing = 40;
        let cols = Math.ceil(width / spacing);
        let rows = Math.ceil(height / spacing);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                this.particles.push({
                    x: x * spacing,
                    y: y * spacing,
                    baseY: y * spacing,
                    baseX: x * spacing
                });
            }
        }
    }

    update() {
        this.time += 0.05;

        let mouseX = mouse.x || width / 2;
        let mouseY = mouse.y || height / 2;

        for (let p of this.particles) {
            // Distance from "source" (mouse or center)
            let dx = p.baseX - mouseX;
            let dy = p.baseY - mouseY;
            let dist = Math.sqrt(dx * dx + dy * dy);

            // 3D Wave function: z = sin(dist - t)
            // We map z to circle size and color brightness
            let z = Math.sin(dist * 0.03 - this.time);

            p.size = (z + 1) * 3 + 1; // Size 1 to 7
            p.lightness = (z + 1) * 40 + 20; // 20% to 100%
        }
    }

    draw() {
        for (let p of this.particles) {
            ctx.fillStyle = `hsl(200, 80%, ${p.lightness}%)`;
            ctx.beginPath();
            ctx.arc(p.baseX, p.baseY, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 10. Boids Scene (Flocking)
class BoidsScene extends Scene {
    constructor() {
        super();
        this.name = "Boids (Flocking)";
    }

    init() {
        this.boids = [];
        const count = 150;
        for (let i = 0; i < count; i++) {
            this.boids.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: `hsl(${Math.random() * 60 + 200}, 70%, 60%)`
            });
        }
    }

    update() {
        for (let b of this.boids) {
            // Rules: Separation, Alignment, Cohesion
            let separationX = 0, separationY = 0;
            let alignmentX = 0, alignmentY = 0;
            let cohesionX = 0, cohesionY = 0;
            let count = 0;

            for (let other of this.boids) {
                if (other === b) continue;
                let dx = other.x - b.x;
                let dy = other.y - b.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 50) {
                    // Separation
                    separationX -= dx / dist;
                    separationY -= dy / dist;

                    // Alignment
                    alignmentX += other.vx;
                    alignmentY += other.vy;

                    // Cohesion
                    cohesionX += other.x;
                    cohesionY += other.y;

                    count++;
                }
            }

            if (count > 0) {
                alignmentX /= count;
                alignmentY /= count;
                cohesionX /= count;
                cohesionY /= count;

                cohesionX = (cohesionX - b.x) * 0.05;
                cohesionY = (cohesionY - b.y) * 0.05;

                alignmentX *= 0.05;
                alignmentY *= 0.05;

                separationX *= 0.05;
                separationY *= 0.05;

                b.vx += separationX + alignmentX + cohesionX;
                b.vy += separationY + alignmentY + cohesionY;
            }

            // Mouse Interaction (Predator)
            if (mouse.x != null) {
                let dx = mouse.x - b.x;
                let dy = mouse.y - b.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    b.vx -= dx * 0.05; // Flee
                    b.vy -= dy * 0.05;
                }
            }

            // Speed limit
            let speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            if (speed > 4) {
                b.vx = (b.vx / speed) * 4;
                b.vy = (b.vy / speed) * 4;
            }

            b.x += b.vx;
            b.y += b.vy;

            // Wrap
            if (b.x < 0) b.x = width;
            if (b.x > width) b.x = 0;
            if (b.y < 0) b.y = height;
            if (b.y > height) b.y = 0;
        }
    }

    draw() {
        for (let b of this.boids) {
            let angle = Math.atan2(b.vy, b.vx);
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(angle);
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-5, 5);
            ctx.lineTo(-5, -5);
            ctx.fill();
            ctx.restore();
        }
    }
}

// 11. Game of Life Scene (Cyberpunk)
class LifeScene extends Scene {
    constructor() {
        super();
        this.name = "Game of Life";
        this.cellSize = 10;
    }

    init() {
        this.cols = Math.ceil(width / this.cellSize);
        this.rows = Math.ceil(height / this.cellSize);
        this.grid = this.createGrid();
        this.nextGrid = this.createGrid();
        this.randomize();
    }

    createGrid() {
        let arr = new Array(this.cols);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = new Array(this.rows).fill(0);
        }
        return arr;
    }

    randomize() {
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                this.grid[i][j] = Math.random() > 0.85 ? 1 : 0; // Sparse start
            }
        }
    }

    update() {
        // Mouse interaction: Paint cells
        if (mouse.x != null) {
            let mx = Math.floor(mouse.x / this.cellSize);
            let my = Math.floor(mouse.y / this.cellSize);
            // Paint a small radius
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    let col = (mx + i + this.cols) % this.cols;
                    let row = (my + j + this.rows) % this.rows;
                    this.grid[col][row] = 1;
                }
            }
        }

        // Compute next generation
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                let state = this.grid[i][j];
                let neighbors = this.countNeighbors(this.grid, i, j);

                if (state == 0 && neighbors == 3) {
                    this.nextGrid[i][j] = 1;
                } else if (state == 1 && (neighbors < 2 || neighbors > 3)) {
                    this.nextGrid[i][j] = 0;
                } else {
                    this.nextGrid[i][j] = state;
                }
            }
        }

        // Swap
        let temp = this.grid;
        this.grid = this.nextGrid;
        this.nextGrid = temp;
    }

    countNeighbors(grid, x, y) {
        let sum = 0;
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                let col = (x + i + this.cols) % this.cols;
                let row = (y + j + this.rows) % this.rows;
                sum += grid[col][row];
            }
        }
        sum -= grid[x][y];
        return sum;
    }

    draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Trail effect
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#0FF'; // Cyan/Neon
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                if (this.grid[i][j] == 1) {
                    ctx.fillRect(i * this.cellSize, j * this.cellSize, this.cellSize - 1, this.cellSize - 1);
                }
            }
        }
    }
}

// 12. Kaleidoscope Scene (Mirrored Trails)
class KaleidoscopeScene extends Scene {
    constructor() {
        super();
        this.name = "Kaleidoscope";
        this.symmetry = 6;
    }

    init() {
        this.particles = [];
        const count = 50;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: Math.random() * 5 + 2,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`
            });
        }
    }

    update() {
        if (mouse.x != null) {
            // Mouse X controls symmetry count
            this.symmetry = Math.max(2, Math.floor((mouse.x / width) * 12));
        }

        for (let p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;
        }
    }

    draw() {
        // We draw to an offscreen buffer or just use transforms
        // Let's use transforms for the kaleidoscope effect

        let centerX = width / 2;
        let centerY = height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);

        for (let i = 0; i < this.symmetry; i++) {
            ctx.rotate((Math.PI * 2) / this.symmetry);
            for (let p of this.particles) {
                // Map particle position to relative coordinates
                let relX = p.x - centerX;
                let relY = p.y - centerY;

                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(relX, relY, p.size, 0, Math.PI * 2);
                ctx.fill();

                // Mirror
                ctx.beginPath();
                ctx.arc(relX, -relY, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
}

// 13. Hyperspace Scene (Warp Speed)
class HyperspaceScene extends Scene {
    constructor() {
        super();
        this.name = "Hyperspace";
    }

    init() {
        this.stars = [];
        const count = 1000;
        for (let i = 0; i < count; i++) {
            this.stars.push(this.createStar());
        }
    }

    createStar() {
        return {
            x: Math.random() * width - width / 2,
            y: Math.random() * height - height / 2,
            z: Math.random() * width // Depth
        };
    }

    update() {
        let speed = 5;
        if (mouse.x != null) {
            // Mouse distance from center controls speed
            let dx = mouse.x - width / 2;
            let dy = mouse.y - height / 2;
            speed = Math.sqrt(dx * dx + dy * dy) * 0.1;
        }

        for (let s of this.stars) {
            s.z -= speed;
            if (s.z <= 0) {
                s.z = width;
                s.x = Math.random() * width - width / 2;
                s.y = Math.random() * height - height / 2;
            }
        }
    }

    draw() {
        let centerX = width / 2;
        let centerY = height / 2;

        ctx.fillStyle = 'white';
        for (let s of this.stars) {
            let sx = (s.x / s.z) * width + centerX;
            let sy = (s.y / s.z) * height + centerY;

            let size = (1 - s.z / width) * 3;

            // Draw streak
            let prevZ = s.z + 20; // Length of streak
            let px = (s.x / prevZ) * width + centerX;
            let py = (s.y / prevZ) * height + centerY;

            ctx.beginPath();
            ctx.lineWidth = size;
            ctx.strokeStyle = 'rgba(255, 255, 255, ' + (1 - s.z / width) + ')';
            ctx.moveTo(px, py);
            ctx.lineTo(sx, sy);
            ctx.stroke();
        }
    }
}

// 14. Moire Scene (Optical Illusion)
class MoireScene extends Scene {
    constructor() {
        super();
        this.name = "Moire Patterns";
    }

    init() {
        // No particles
    }

    update() {
        // Just mouse tracking
    }

    draw() {
        let centerX = width / 2;
        let centerY = height / 2;
        let spacing = 8;

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;

        // Layer 1: Static concentric circles
        for (let r = 0; r < Math.max(width, height); r += spacing) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Layer 2: Moving concentric circles
        let mx = mouse.x || centerX;
        let my = mouse.y || centerY;

        ctx.strokeStyle = 'cyan';
        for (let r = 0; r < Math.max(width, height); r += spacing) {
            ctx.beginPath();
            ctx.arc(mx, my, r, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// 15. Quantum Field Scene (Uncertainty)
class QuantumScene extends Scene {
    constructor() {
        super();
        this.name = "Quantum Field";
    }

    init() {
        this.particles = [];
        const count = 300;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                baseX: Math.random() * width,
                baseY: Math.random() * height,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                color: `hsl(${Math.random() * 60 + 180}, 100%, 70%)` // Cyan/Blue
            });
        }
    }

    update() {
        for (let p of this.particles) {
            // Uncertainty principle: Jitter intensely
            p.x += (Math.random() - 0.5) * 20;
            p.y += (Math.random() - 0.5) * 20;

            // Mouse as Observer: Collapse wave function
            if (mouse.x != null) {
                let dx = mouse.x - p.x;
                let dy = mouse.y - p.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 200) {
                    // Stabilize near observer
                    p.x += (p.baseX - p.x) * 0.1;
                    p.y += (p.baseY - p.y) * 0.1;
                } else {
                    // Drift
                    p.baseX += p.vx * 0.1;
                    p.baseY += p.vy * 0.1;
                    // Wrap base
                    if (p.baseX < 0) p.baseX = width;
                    if (p.baseX > width) p.baseX = 0;
                    if (p.baseY < 0) p.baseY = height;
                    if (p.baseY > height) p.baseY = 0;
                }
            }
        }
    }

    draw() {
        for (let p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 2, 2);
        }
    }
}

// 16. Neural Network Scene (Synapse)
class NeuralScene extends Scene {
    constructor() {
        super();
        this.name = "Neural Network";
    }

    init() {
        this.nodes = [];
        const count = 60;
        for (let i = 0; i < count; i++) {
            this.nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                pulse: 0
            });
        }
    }

    update() {
        for (let n of this.nodes) {
            n.x += n.vx;
            n.y += n.vy;
            if (n.x < 0 || n.x > width) n.vx *= -1;
            if (n.y < 0 || n.y > height) n.vy *= -1;

            if (n.pulse > 0) n.pulse -= 0.02;
        }

        // Mouse interaction: Trigger pulse
        if (mouse.x != null) {
            for (let n of this.nodes) {
                let dx = mouse.x - n.x;
                let dy = mouse.y - n.y;
                if (Math.sqrt(dx * dx + dy * dy) < 100) {
                    n.pulse = 1;
                }
            }
        }
    }

    draw() {
        ctx.lineWidth = 1;
        for (let i = 0; i < this.nodes.length; i++) {
            let n1 = this.nodes[i];

            // Draw Node
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + n1.pulse})`;
            ctx.beginPath();
            ctx.arc(n1.x, n1.y, 3 + n1.pulse * 5, 0, Math.PI * 2);
            ctx.fill();

            // Connections
            for (let j = i + 1; j < this.nodes.length; j++) {
                let n2 = this.nodes[j];
                let dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
                if (dist < 150) {
                    ctx.strokeStyle = `rgba(100, 200, 255, ${0.1 + (n1.pulse + n2.pulse) * 0.5})`;
                    ctx.beginPath();
                    ctx.moveTo(n1.x, n1.y);
                    ctx.lineTo(n2.x, n2.y);
                    ctx.stroke();
                }
            }
        }
    }
}

// 17. Fractal Roots Scene (All Roads Lead to Rome)
class RootsScene extends Scene {
    constructor() {
        super();
        this.name = "Fractal Roots";
    }

    init() {
        this.roots = [];
        // Spawn roots from edges
        for (let i = 0; i < 20; i++) {
            this.spawnRoot();
        }
    }

    spawnRoot() {
        let side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0) { x = Math.random() * width; y = 0; } // Top
        else if (side === 1) { x = width; y = Math.random() * height; } // Right
        else if (side === 2) { x = Math.random() * width; y = height; } // Bottom
        else { x = 0; y = Math.random() * height; } // Left

        this.roots.push({
            history: [{ x, y }],
            active: true,
            angle: 0
        });
    }

    update() {
        let targetX = mouse.x || width / 2;
        let targetY = mouse.y || height / 2;

        for (let r of this.roots) {
            if (!r.active) continue;

            let head = r.history[r.history.length - 1];
            let dx = targetX - head.x;
            let dy = targetY - head.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 10) {
                r.active = false;
                // Respawn a new one to keep it going
                setTimeout(() => this.spawnRoot(), 100);
                continue;
            }

            let angleToTarget = Math.atan2(dy, dx);
            // Add some randomness/wiggle
            let moveAngle = angleToTarget + (Math.random() - 0.5);

            let speed = 5;
            let newX = head.x + Math.cos(moveAngle) * speed;
            let newY = head.y + Math.sin(moveAngle) * speed;

            r.history.push({ x: newX, y: newY });

            // Limit length
            if (r.history.length > 100) r.history.shift();
        }

        // Cleanup inactive
        this.roots = this.roots.filter(r => r.active || r.history.length > 0);
    }

    draw() {
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)'; // Gold/Root color

        for (let r of this.roots) {
            ctx.beginPath();
            if (r.history.length > 0) {
                ctx.moveTo(r.history[0].x, r.history[0].y);
                for (let i = 1; i < r.history.length; i++) {
                    ctx.lineTo(r.history[i].x, r.history[i].y);
                }
            }
            ctx.stroke();
        }
    }
}

// Scene Manager
const scenes = [
    new AntigravityScene(),
    new GravityScene(),
    new VortexScene(),
    new RippleScene(),
    new GalaxyScene(),
    new MatrixScene(),
    new FlowFieldScene(),
    new VoronoiScene(),
    new SineWaveScene(),
    new BoidsScene(),
    new LifeScene(),
    new KaleidoscopeScene(),
    new HyperspaceScene(),
    new MoireScene(),
    new QuantumScene(),
    new NeuralScene(),
    new RootsScene(),
];
let currentSceneIndex = 0;

function switchScene(direction) {
    if (direction === 'next') {
        currentSceneIndex = (currentSceneIndex + 1) % scenes.length;
    } else if (direction === 'prev') {
        currentSceneIndex = (currentSceneIndex - 1 + scenes.length) % scenes.length;
    }
    scenes[currentSceneIndex].init();
    modeNameElement.innerText = scenes[currentSceneIndex].name;
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        switchScene('next');
    } else if (e.key === 'ArrowLeft') {
        switchScene('prev');
    }
});

// Touch support for mobile
let touchStartX = 0;
let touchEndX = 0;

window.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

window.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
        switchScene('next'); // Swipe Left -> Next
    }
    if (touchEndX > touchStartX + 50) {
        switchScene('prev'); // Swipe Right -> Prev
    }
}

// Initial UI Update
modeNameElement.innerText = scenes[currentSceneIndex].name;
document.querySelector('#ui p').innerHTML = "Use &larr; &rarr; keys or Swipe to switch modes";

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    scenes[currentSceneIndex].init();
}

window.addEventListener('resize', resize);

function animate() {
    ctx.clearRect(0, 0, width, height);
    scenes[currentSceneIndex].update();
    scenes[currentSceneIndex].draw();
    requestAnimationFrame(animate);
}

// Start
resize();
animate();
