/* =====================================================
   CareerIQ AI — Roadmap Data
   Priority: 1) localStorage (AI-generated from dashboard)
             2) Static demo data (fallback)
   ===================================================== */

// ── Helper: map colors / icons to phase index ─────────
const _PHASE_COLORS = ['var(--violet)', 'var(--cyan)', 'var(--amber)', 'var(--green)', '#ffb4ab', '#afc6ff'];
const _PHASE_ICONS  = ['🚀', '⚡', '🛠️', '🔥', '🎯', '🏆'];

// ── Try to load AI data from localStorage ─────────────
function _loadFromStorage() {
    try {
        const raw = localStorage.getItem('careeriq_roadmap');
        if (!raw) return null;
        const saved = JSON.parse(raw);
        if (!saved || !saved.parsedData) return null;

        const pd = saved.parsedData;

        // AI format uses pd.steps[]; convert to phases[] used by render.js
        if (pd.steps && Array.isArray(pd.steps) && pd.steps.length > 0) {
            const phases = pd.steps.map((step, i) => {
                const isLast = i === pd.steps.length - 1;
                return {
                    name:       step.title       || `Phase ${i + 1}`,
                    icon:       isLast ? '🏆' : _PHASE_ICONS[i % _PHASE_ICONS.length],
                    color:      _PHASE_COLORS[i % _PHASE_COLORS.length],
                    duration:   step.duration    || 'TBD',
                    status:     i === 0 ? 'in_progress' : 'upcoming',
                    objective:  step.description || '',
                    completion: i === 0 ? 10 : 0,
                    milestones: (step.milestones || step.skills || []).slice(0, 4).map(m => ({
                        text: typeof m === 'string' ? m : m.text || String(m),
                        done: false
                    })),
                    deliverable: step.deliverable || step.outcome || ''
                };
            });

            return {
                title:            saved.title || `${saved.currentRole} → ${saved.targetRole}`,
                subtitle:         `AI-generated career transition plan · ${new Date(saved.generatedAt).toLocaleDateString()}`,
                timeline:         `Estimated timeline: ${pd.estimatedTimeline || 'See phases below'}`,
                tags:             pd.requiredSkills ? pd.requiredSkills.slice(0, 5) : ['AI Generated'],
                overall_progress: 5,
                summary:          pd.summary || `Your personalized career roadmap from ${saved.currentRole} to ${saved.targetRole}. Follow each phase step-by-step to reach your goal.`,
                phases
            };
        }
        return null;
    } catch (e) {
        console.warn('[CareerIQ Roadmap] Could not load from localStorage:', e);
        return null;
    }
}

// ── Static demo data (shown when no AI roadmap is saved) ──
const _DEMO_ROADMAP = {
    title: "Full-Stack Developer Path",
    subtitle: "A comprehensive journey from frontend basics to backend mastery and cloud deployment.",
    timeline: "Estimated timeline: 6 Months",
    tags: ["Frontend", "Backend", "Databases", "Cloud"],
    overall_progress: 45,
    summary: "This roadmap covers all essential skills needed to build production-ready applications. Follow each phase step-by-step and complete the milestones to achieve mastery.",
    phases: [
        {
            name: "Frontend Fundamentals",
            icon: "🎨",
            color: "var(--violet)",
            duration: "4 Weeks",
            status: "completed",
            objective: "Learn the core building blocks of the web: HTML, CSS, and vanilla JavaScript.",
            completion: 100,
            milestones: [
                { text: "Build a responsive landing page", done: true },
                { text: "Master CSS Grid & Flexbox", done: true },
                { text: "Understand JS DOM Manipulation", done: true }
            ],
            deliverable: "Personal Portfolio Website"
        },
        {
            name: "Modern UI Frameworks",
            icon: "⚛️",
            color: "var(--cyan)",
            duration: "6 Weeks",
            status: "in_progress",
            objective: "Adopt a component-based architecture using React and state management.",
            completion: 60,
            milestones: [
                { text: "Understand React Hooks & Context API", done: true },
                { text: "Build a Single Page Application (SPA)", done: true },
                { text: "Integrate a routing library", done: false },
                { text: "Manage global state with Redux/Zustand", done: false }
            ],
            deliverable: "Interactive E-Commerce Dashboard"
        },
        {
            name: "Backend & APIs",
            icon: "⚙️",
            color: "var(--amber)",
            duration: "6 Weeks",
            status: "upcoming",
            objective: "Develop scalable server-side logic and RESTful APIs using Node.js and Express.",
            completion: 0,
            milestones: [
                { text: "Set up a Node/Express server", done: false },
                { text: "Implement JWT authentication", done: false },
                { text: "Create CRUD REST endpoints", done: false }
            ],
            deliverable: "Authentication API Service"
        },
        {
            name: "Databases & Data Modeling",
            icon: "🗄️",
            color: "var(--green)",
            duration: "4 Weeks",
            status: "upcoming",
            objective: "Store and retrieve data efficiently using SQL (PostgreSQL) and NoSQL (MongoDB).",
            completion: 0,
            milestones: [
                { text: "Design a relational schema", done: false },
                { text: "Write complex SQL joins", done: false },
                { text: "Connect Node.js to a database via ORM", done: false }
            ],
            deliverable: "Fully functional Blog Database"
        }
    ]
};

// ── Export: use AI data if available, else demo ────────
const ROADMAP = _loadFromStorage() || _DEMO_ROADMAP;

// ── Expose source flag for render.js banner ────────────
window._ROADMAP_SOURCE = _loadFromStorage() ? 'ai' : 'demo';
