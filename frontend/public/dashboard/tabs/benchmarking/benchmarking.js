/**
 * benchmarking.js  (v2)
 * Personal role-fit benchmarking tab.
 * – Auto-loads on tab open (uses cached result if available).
 * – Shows top 10 by default; search + "Show all" toggle.
 * – Click any card to expand strength / improvement detail.
 */

'use strict';

(function () {
    const API_BASE = window.API_BASE || 'http://localhost:5000/api';
    const TOP_N    = 10;

    let allResults  = [];   // sorted by fit_score DESC
    let showAll     = false;
    let searchQuery = '';
    let courseTier  = '';
    let runDate     = '';

    // ── Auth ──────────────────────────────────────────────────────────────────
    async function authHeaders() {
        try {
            if (window.firebase && firebase.auth().currentUser) {
                const t = await firebase.auth().currentUser.getIdToken();
                return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` };
            }
        } catch (_) {}
        const t = localStorage.getItem('authToken') || '';
        return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` };
    }

    // ── Score helpers ─────────────────────────────────────────────────────────
    function scoreClass(grade) {
        const map = {
            'A+':'sc-a-plus','A':'sc-a','A−':'sc-a-minus','A-':'sc-a-minus',
            'B+':'sc-b-plus','B':'sc-b','B−':'sc-b-minus','B-':'sc-b-minus',
            'C+':'sc-c-plus','C':'sc-c','C−':'sc-c-minus','C-':'sc-c-minus',
            'D':'sc-d','F':'sc-f',
        };
        return map[grade] || 'sc-f';
    }

    function gradeColor(grade) {
        if (!grade) return '#6b7280';
        const g = grade.replace('−','-');
        if (g.startsWith('A')) return '#34d399';
        if (g === 'B+') return '#60a5fa';
        if (g === 'B')  return '#818cf8';
        if (g === 'B-') return '#a78bfa';
        if (g.startsWith('C')) return '#fbbf24';
        if (g === 'D')  return '#f87171';
        return '#fca5a5';
    }

    function barColor(score) {
        if (score >= 85) return '#34d399';
        if (score >= 75) return '#60a5fa';
        if (score >= 65) return '#818cf8';
        if (score >= 55) return '#fbbf24';
        if (score >= 45) return '#fb923c';
        return '#f87171';
    }

    function podiumEmoji(rank) {
        return ['🥇','🥈','🥉'][rank] || '';
    }

    function tierLabel(tier) {
        return { btech:'B.Tech', mtech:'M.Tech', phd:'PhD' }[tier] || 'B.Tech';
    }

    // ── Render ────────────────────────────────────────────────────────────────
    const root = () => document.getElementById('page-benchmarking');

    function setRoot(html) {
        const el = root();
        if (el) el.innerHTML = `<div class="bench-tab">${html}</div>`;
    }

    // State: loading
    function showLoading(message = 'Scoring all roles against your resume…') {
        setRoot(`
            <div class="bench-header">
                <div class="bench-header-left">
                    <h2>Role Fit Benchmarking</h2>
                    <p>AI-powered fit score across all placement roles for your course.</p>
                </div>
                <span class="bench-badge">⚡ AI Powered</span>
            </div>
            <div class="bench-state-box">
                <div class="bench-state-icon">⚡</div>
                <p class="bench-state-title">Analysing Your Profile</p>
                <p class="bench-state-sub">${message}</p>
                <div class="bench-loading-bar"></div>
                <p style="font-size:12px;color:var(--text-secondary);margin:0;">This takes 15–30 seconds — sit tight!</p>
            </div>`);
    }

    // State: no resume
    function showNoResume() {
        setRoot(`
            <div class="bench-header">
                <div class="bench-header-left">
                    <h2>Role Fit Benchmarking</h2>
                    <p>AI-powered fit score across all placement roles for your course.</p>
                </div>
                <span class="bench-badge">⚡ AI Powered</span>
            </div>
            <div class="bench-state-box">
                <div class="bench-state-icon">📄</div>
                <p class="bench-state-title">No Analysed Resume Found</p>
                <p class="bench-state-sub">Upload and analyse your resume first from the <strong>Resume Analysis</strong> tab. Once done, come back here to see your role-fit scores.</p>
            </div>`);
    }

    // State: error
    function showError(msg) {
        setRoot(`
            <div class="bench-header">
                <div class="bench-header-left">
                    <h2>Role Fit Benchmarking</h2>
                    <p>AI-powered fit score across all placement roles for your course.</p>
                </div>
                <div class="bench-header-right">
                    <button class="bench-refresh-btn" onclick="window.benchRun()">
                        <span class="bench-refresh-icon">🔄</span>
                        <div class="bench-spin"></div>
                        Retry
                    </button>
                </div>
            </div>
            <div class="bench-error-box">⚠️ ${msg}</div>`);
    }

    // State: results
    function renderResults() {
        const filtered = allResults.filter(r =>
            !searchQuery || r.role_name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const top3    = allResults.slice(0, 3);
        const visible = showAll ? filtered : filtered.slice(0, TOP_N);
        const hiddenCount = filtered.length - TOP_N;

        // Header
        const headerHtml = `
            <div class="bench-header">
                <div class="bench-header-left">
                    <h2>Role Fit Benchmarking</h2>
                    <p>Your AI fit scores across all ${tierLabel(courseTier)} placement roles — ${runDate}.</p>
                </div>
                <div class="bench-header-right">
                    ${courseTier ? `<span class="bench-course-tag">${tierLabel(courseTier)}</span>` : ''}
                    <button class="bench-refresh-btn" id="benchRefreshBtn" onclick="window.benchRefresh()">
                        <span class="bench-refresh-icon">🔄</span>
                        <div class="bench-spin"></div>
                        Refresh
                    </button>
                </div>
            </div>`;

        // Podium top 3
        const podiumHtml = top3.length >= 3 ? `
            <div>
                <p class="bench-roles-section-label" style="margin-bottom:12px;">🏆 Top Matches</p>
                <div class="bench-podium">
                    ${top3.slice(0,3).map((r, i) => {
                        const color = gradeColor(r.grade);
                        return `
                        <div class="bench-podium-card rank-${i+1}" style="border-color:${color}22;">
                            <div class="bench-podium-rank">${podiumEmoji(i)}</div>
                            <div class="bench-podium-role">${r.role_name}</div>
                            <div class="bench-podium-score-row">
                                <div class="bench-podium-score" style="color:${color};">${r.fit_score}</div>
                                <div class="bench-podium-grade" style="color:${color};">${r.grade}</div>
                            </div>
                            ${r.major_strength ? `<div class="bench-podium-strength">💪 ${r.major_strength}</div>` : ''}
                        </div>`;
                    }).join('')}
                </div>
            </div>` : '';

        // Controls bar
        const controlsHtml = `
            <div class="bench-controls">
                <div class="bench-search-wrap">
                    <svg class="bench-search-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input class="bench-search" id="benchSearchInput"
                           placeholder="Search roles…"
                           value="${searchQuery}"
                           oninput="window.benchSearch(this.value)" />
                </div>
                <span class="bench-count-badge">${filtered.length} roles</span>
                ${!showAll && hiddenCount > 0 ? `
                <button class="bench-show-all-btn" id="benchShowAllBtn" onclick="window.benchToggleAll()">
                    Show all ${filtered.length} roles ↓
                </button>` : ''}
                ${showAll && filtered.length > TOP_N ? `
                <button class="bench-show-all-btn active" id="benchShowAllBtn" onclick="window.benchToggleAll()">
                    Show top ${TOP_N} only ↑
                </button>` : ''}
            </div>`;

        // Role grid (ranks 4+ or all if showing all)
        const startRank = showAll && top3.length >= 3 ? 1 : (top3.length >= 3 ? 4 : 1);
        const gridResults = showAll ? filtered : filtered.slice(0, TOP_N);
        const gridStartOffset = (!showAll && top3.length >= 3) ? 3 : 0;

        const gridLabel = top3.length >= 3
            ? (showAll ? 'All Roles' : `Roles #4–${Math.min(TOP_N, filtered.length)}`)
            : 'All Roles';

        const gridHtml = `
            <div>
                <p class="bench-roles-section-label" style="margin-bottom:12px;">📋 ${gridLabel}</p>
                <div class="bench-role-grid" id="benchRoleGrid">
                    ${gridResults.slice(gridStartOffset).map((r, i) => roleCardHtml(r, gridStartOffset + i + 1)).join('')}
                </div>
                ${!showAll && hiddenCount > 0 ? `
                <div style="text-align:center;margin-top:16px;">
                    <button class="bench-show-all-btn" onclick="window.benchToggleAll()" style="margin:auto;">
                        + Show ${hiddenCount} more roles
                    </button>
                </div>` : ''}
            </div>`;

        setRoot(headerHtml + podiumHtml + controlsHtml + gridHtml);

        // Re-attach search focus
        const inp = document.getElementById('benchSearchInput');
        if (inp && searchQuery) { inp.focus(); inp.setSelectionRange(9999,9999); }
    }

    function roleCardHtml(r, rank) {
        const cls   = scoreClass(r.grade);
        const color = gradeColor(r.grade);
        const bColor = barColor(r.fit_score);
        const pct   = r.fit_score;
        const id    = `brc-${r.role_name.replace(/\W/g,'_')}`;
        return `
        <div class="bench-role-card" id="${id}" onclick="window.benchExpandCard('${id}')">
            <div class="bench-role-card-main">
                <div class="bench-role-rank-badge">#${rank}</div>
                <div class="bench-role-info">
                    <div class="bench-role-name">${r.role_name}</div>
                </div>
                <div class="bench-score-bar-wrap">
                    <div class="bench-score-bar" style="width:${pct}%;background:${bColor};"></div>
                </div>
                <div class="bench-score-pill ${cls}">
                    <span class="bench-score-num">${r.fit_score}</span>
                    <span class="bench-score-grade">${r.grade}</span>
                </div>
            </div>
            <div class="bench-role-detail">
                ${r.major_strength ? `
                <div class="bench-detail-item">
                    <div class="bench-detail-dot" style="background:#34d399;"></div>
                    <div>
                        <div class="bench-detail-label" style="color:#34d399;">Strength</div>
                        <div class="bench-detail-text">${r.major_strength}</div>
                    </div>
                </div>` : ''}
                ${r.improvement_suggestion ? `
                <div class="bench-detail-item">
                    <div class="bench-detail-dot" style="background:#fbbf24;"></div>
                    <div>
                        <div class="bench-detail-label" style="color:#fbbf24;">To Improve</div>
                        <div class="bench-detail-text">${r.improvement_suggestion}</div>
                    </div>
                </div>` : ''}
            </div>
        </div>`;
    }

    // ── Interactions ──────────────────────────────────────────────────────────
    window.benchExpandCard = function (id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('expanded');
    };

    window.benchSearch = function (q) {
        searchQuery = q;
        renderResults();
    };

    window.benchToggleAll = function () {
        showAll = !showAll;
        renderResults();
    };

    // ── API calls ─────────────────────────────────────────────────────────────
    async function loadData(forceRefresh = false) {
        showLoading(forceRefresh
            ? 'Re-running AI analysis across all roles…'
            : 'Scoring all roles against your resume…');

        try {
            const headers = await authHeaders();
            const endpoint = forceRefresh
                ? `${API_BASE}/benchmark/my-role-fit/refresh`
                : `${API_BASE}/benchmark/my-role-fit`;
            const method = forceRefresh ? 'POST' : 'GET';

            const res  = await fetch(endpoint, { method, headers });
            const json = await res.json();

            if (!res.ok) {
                if (res.status === 422) { showNoResume(); return; }
                throw new Error(json.message || 'Benchmark failed.');
            }

            const data = json.data;
            allResults  = (data.results || []).sort((a, b) => b.fit_score - a.fit_score);
            courseTier  = data.course_tier || '';
            runDate     = data.updated_at || data.created_at
                ? new Date(data.updated_at || data.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
                : '';

            showAll     = false;
            searchQuery = '';
            renderResults();
        } catch (err) {
            if (err.message && err.message.toLowerCase().includes('no analysed resume')) {
                showNoResume();
            } else {
                showError(err.message || 'Something went wrong. Please try again.');
            }
        }
    }

    window.benchRun     = () => loadData(false);
    window.benchRefresh = () => loadData(true);

    // ── Init on tab visibility ────────────────────────────────────────────────
    function init() {
        // Only run when tab is actually visible
        const tab = document.getElementById('page-benchmarking');
        if (!tab) return;
        if (allResults.length > 0) { renderResults(); return; } // already loaded
        loadData(false);
    }

    // Hook into dashboard tab switching
    const origShowTab = window.showTab;
    window.showTab = function (tabName) {
        if (origShowTab) origShowTab(tabName);
        if (tabName === 'benchmarking') init();
    };

    // Also init immediately if the benchmarking tab is already active
    document.addEventListener('DOMContentLoaded', () => {
        const active = document.querySelector('.page-view.active, .page-view[style*="block"]');
        if (active && active.id === 'page-benchmarking') init();

        // Listen for menu item clicks as fallback
        document.querySelectorAll('[data-target="benchmarking"]').forEach(el => {
            el.addEventListener('click', () => setTimeout(init, 50));
        });
    });

    window.initBenchmarking = init;
})();
