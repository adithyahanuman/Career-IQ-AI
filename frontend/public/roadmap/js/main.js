document.addEventListener('DOMContentLoaded', () => {
    // Wait a tiny bit for DOM to settle
    setTimeout(() => {
        initRoadmap();
        initProgressBars();
        initScrollObserver();
    }, 100);
});

function initRoadmap() {
    if (window.innerWidth <= 768) return; // Disable SVG on tablet/mobile

    const container = document.getElementById('phases-container');
    const svgContainer = document.getElementById('svg-container');
    if (!container || !svgContainer || typeof ROADMAP === 'undefined') return;

    const cards = container.querySelectorAll('.phase-card');
    const cardSpacing = 300;
    const containerHeight = cards.length * cardSpacing + 100;
    container.style.height = `${containerHeight}px`;

    // Position cards absolutely
    cards.forEach((card, index) => {
        card.style.position = 'absolute';
        card.style.top = `${index * cardSpacing + 50}px`;
        
        if (index % 2 === 0) {
            // Even: left side
            card.style.right = '50%';
            card.style.marginRight = '40px';
        } else {
            // Odd: right side
            card.style.left = '50%';
            card.style.marginLeft = '40px';
        }
    });

    // Build SVG Path
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 1000 ${containerHeight}`);
    svg.style.width = '100%';
    svg.style.height = '100%';

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('class', 'road-path');
    
    // Path logic: start at top center (500, 0)
    let d = `M 500 0 `;
    
    ROADMAP.phases.forEach((phase, index) => {
        const cardY = index * cardSpacing + 50;
        const targetY = cardY + 100; // Middle of the card roughly
        const prevY = index === 0 ? 0 : (index - 1) * cardSpacing + 150;
        
        // Control points for smooth bezier
        const cp1Y = prevY + (targetY - prevY) / 2;
        const cp2Y = targetY - 50;
        
        // Target X: weave slightly towards the card
        const targetX = index % 2 === 0 ? 450 : 550;
        
        d += `C 500 ${cp1Y}, ${targetX} ${cp2Y}, ${targetX} ${targetY} `;
        
        // Curve back to center
        if (index < ROADMAP.phases.length - 1) {
            const nextY = (index + 1) * cardSpacing + 150;
            const backCp1Y = targetY + 50;
            const backCp2Y = targetY + (nextY - targetY) / 2;
            d += `C ${targetX} ${backCp1Y}, 500 ${backCp2Y}, 500 ${targetY + 150} `;
        } else {
            // Final segment goes down
            d += `C ${targetX} ${targetY + 50}, 500 ${targetY + 100}, 500 ${containerHeight} `;
        }
    });
    
    path.setAttribute('d', d);
    svg.appendChild(path);
    svgContainer.appendChild(svg);

    // Animate Path
    const totalLength = path.getTotalLength();
    path.style.strokeDasharray = `${totalLength} ${totalLength}`;
    path.style.strokeDashoffset = totalLength;
    
    // Draw animation
    requestAnimationFrame(() => {
        path.style.transition = 'stroke-dashoffset 1.8s ease-out';
        path.style.strokeDashoffset = '0';
    });

    // Create Nodes
    ROADMAP.phases.forEach((phase, index) => {
        const cardY = index * cardSpacing + 50;
        const targetY = cardY + 100;
        
        // Create circle
        const circle = document.createElementNS(svgNS, 'circle');
        const cx = index % 2 === 0 ? 450 : 550;
        const cy = targetY;
        
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', '22');
        circle.setAttribute('fill', phase.color);
        circle.setAttribute('stroke', 'var(--bg)');
        circle.setAttribute('stroke-width', '3');
        circle.style.opacity = '0';
        circle.style.transition = 'opacity 0.5s ease ' + (index * 0.15 + 0.5) + 's';
        
        // Pulse ring for in progress
        if (phase.status === 'in_progress') {
            const pulseCircle = document.createElementNS(svgNS, 'circle');
            pulseCircle.setAttribute('cx', cx);
            pulseCircle.setAttribute('cy', cy);
            pulseCircle.setAttribute('r', '22');
            pulseCircle.setAttribute('fill', phase.color);
            pulseCircle.style.animation = 'pulse-ring 2s infinite';
            pulseCircle.style.transformOrigin = `${cx}px ${cy}px`;
            svg.appendChild(pulseCircle);
        }

        // Add Icon text
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', cx);
        text.setAttribute('y', cy + 6); // slight optical adjustment
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#fff');
        text.setAttribute('font-size', '18px');
        text.textContent = phase.icon;
        text.style.opacity = '0';
        text.style.transition = 'opacity 0.5s ease ' + (index * 0.15 + 0.5) + 's';
        
        svg.appendChild(circle);
        svg.appendChild(text);

        // Tooltip interaction
        const hitbox = document.createElementNS(svgNS, 'circle');
        hitbox.setAttribute('cx', cx);
        hitbox.setAttribute('cy', cy);
        hitbox.setAttribute('r', '30');
        hitbox.setAttribute('fill', 'transparent');
        hitbox.style.cursor = 'pointer';
        
        const tooltip = document.getElementById('tooltip');
        
        hitbox.addEventListener('mouseenter', (e) => {
            tooltip.innerHTML = `<strong>${phase.name}</strong><br>${phase.duration}`;
            tooltip.classList.add('visible');
            const rect = svgContainer.getBoundingClientRect();
            // Scale cx,cy by the actual rendered SVG size if responsive, 
            // but since it's 1000px wide viewBox, we must compute actual pixels
            const scaleX = rect.width / 1000;
            const scaleY = rect.height / containerHeight;
            tooltip.style.left = `${cx * scaleX + 30}px`;
            tooltip.style.top = `${cy * scaleY - 20}px`;
        });
        hitbox.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
        });
        
        svg.appendChild(hitbox);

        // Fade in circles
        setTimeout(() => {
            circle.style.opacity = '1';
            text.style.opacity = '1';
        }, 100);
    });
}

function initProgressBars() {
    setTimeout(() => {
        const fills = document.querySelectorAll('.progress-fill');
        fills.forEach(fill => {
            const targetWidth = fill.getAttribute('data-progress') || 0;
            fill.style.width = targetWidth + '%';
        });
    }, 300);
}

function initScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = entry.target.getAttribute('data-index') || 0;
                entry.target.style.transitionDelay = `${index * 150}ms`;
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    const cards = document.querySelectorAll('.phase-card');
    cards.forEach(card => observer.observe(card));
}
