/* =====================================================
   CareerIQ AI — Roadmap Render
   ===================================================== */

function renderHero() {
    const heroSection = document.getElementById('hero');
    if (!heroSection || typeof ROADMAP === 'undefined') return;

    // Detect source
    const isAI = localStorage.getItem('careeriq_roadmap') !== null;

    // Build tags
    const tagsHtml = (ROADMAP.tags || []).map(tag => `<span class="chip chip-tag">${tag}</span>`).join('');

    // Source banner
    const sourceBanner = isAI
        ? `<div style="display:inline-flex;align-items:center;gap:8px;background:rgba(175, 198, 255, 0.12);border:1px solid rgba(175, 198, 255, 0.3);border-radius:99px;padding:6px 16px;font-size:0.8rem;font-weight:600;color:#d9e2ff;margin-bottom:20px;">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                AI-Generated Roadmap
           </div>`
        : `<div style="display:inline-flex;align-items:center;gap:8px;background:rgba(131, 132, 134, 0.12);border:1px solid rgba(131, 132, 134, 0.2);border-radius:99px;padding:6px 16px;font-size:0.8rem;font-weight:600;color:#c5c6ca;margin-bottom:20px;">
                📋 Demo Roadmap — Generate yours from the Dashboard
           </div>`;

    heroSection.innerHTML = `
        <div class="orb violet"></div>
        <div class="orb amber"></div>
        <div class="orb cyan"></div>
        <div class="container">
            ${sourceBanner}
            <div class="chip chip-pill">${ROADMAP.timeline}</div>
            <h1 class="hero-title">${ROADMAP.title}</h1>
            <p class="hero-subtitle">${ROADMAP.subtitle}</p>
            <div class="tags-row">
                ${tagsHtml}
            </div>
            <div class="progress-container">
                <div class="progress-header">
                    <span>Overall Progress</span>
                    <span>${ROADMAP.overall_progress}%</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" id="overall-progress-fill" data-progress="${ROADMAP.overall_progress}"></div>
                </div>
            </div>
        </div>
    `;
}

function renderPhases() {
    const container = document.getElementById('phases-container');
    if (!container || typeof ROADMAP === 'undefined') return;

    (ROADMAP.phases || []).forEach((phase, index) => {
        const card = document.createElement('div');
        card.className = 'phase-card';
        card.setAttribute('data-index', index);
        card.style.setProperty('--phase-color', phase.color);

        // Status Badge
        let statusBadge = '';
        if (phase.status === 'completed') {
            statusBadge = `<span class="badge-status completed"><span class="status-dot"></span>Completed</span>`;
        } else if (phase.status === 'in_progress') {
            statusBadge = `<span class="badge-status in_progress"><span class="status-dot"></span>In Progress</span>`;
        } else {
            statusBadge = `<span class="badge-status upcoming"><span class="status-dot"></span>Upcoming</span>`;
        }

        // Milestones (safe — AI data may have empty array)
        const milestones = phase.milestones || [];
        const milestonesHtml = milestones.length > 0
            ? milestones.map(m => `
                <li class="milestone-item ${m.done ? 'done' : ''}">
                    <span class="milestone-icon">${m.done ? '✓' : '○'}</span>
                    <span>${m.text}</span>
                </li>
            `).join('')
            : `<li class="milestone-item" style="color:var(--muted);font-style:italic;">Follow the phase objectives to build your skills.</li>`;

        // Deliverable (optional)
        const deliverableHtml = phase.deliverable
            ? `<div class="deliverable-box"><span>📦</span> ${phase.deliverable}</div>`
            : '';

        card.innerHTML = `
            <div class="card-eyebrow">
                <span>${phase.icon}</span> Phase ${index + 1}
            </div>
            <h3 class="card-title">${phase.name}</h3>
            <div class="card-meta">
                <span class="chip chip-pill" style="margin: 0;">⏱ ${phase.duration}</span>
                ${statusBadge}
            </div>
            <p class="card-objective">${phase.objective}</p>

            <div class="progress-container" style="margin-bottom: 24px;">
                <div class="progress-header" style="font-size: 0.8rem;">
                    <span>Progress</span>
                    <span>${phase.completion}%</span>
                </div>
                <div class="progress-track" style="height: 4px;">
                    <div class="progress-fill phase-progress-fill" data-progress="${phase.completion}" style="width: 0;"></div>
                </div>
            </div>

            <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 12px; color: var(--text-dim);">Milestones:</div>
            <ul class="milestones-list">
                ${milestonesHtml}
            </ul>

            ${deliverableHtml}
        `;

        container.appendChild(card);
    });
}

function renderSummary() {
    const summarySection = document.getElementById('summary');
    if (!summarySection || typeof ROADMAP === 'undefined') return;

    const tagsHtml = (ROADMAP.tags || []).map(tag => `<span class="chip chip-tag">${tag}</span>`).join('');
    const isAI = localStorage.getItem('careeriq_roadmap') !== null;

    summarySection.innerHTML = `
        <div class="container">
            <p>${ROADMAP.summary}</p>
            <div class="tags-row" style="margin-bottom: 0;">
                ${tagsHtml}
            </div>
            <div class="credit">${isAI ? '⚡ Generated by CareerIQ AI' : 'Demo — Generate your own from the Dashboard'}</div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    renderHero();
    renderPhases();
    renderSummary();
});
