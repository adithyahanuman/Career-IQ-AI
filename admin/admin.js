/**
 * CareerIQ AI — Admin Panel JavaScript
 * Firebase Integrated & Fully Aligned
 */

const AdminPanel = {
  currentTab: 'dashboard',
  domainToDelete: null,
  domains: [],
  logs: [],
  users: [],
  unsubscribers: [],
  auditFilter: 'all',

  async init() {
    // 1. Auth & Role Check
    await CareerIQAuth.authReady;
    
    const session = CareerIQAuth.Session.get();
    if (!session) {
      window.location.href = '../auth/login.html';
      return;
    }
    
    // Check if admin
    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
      window.location.href = `../auth/access-denied.html?email=${encodeURIComponent(session.user.email)}&reason=not_admin`;
      return;
    }

    // Set user initials in header avatar
    const initials = session.user.name ? session.user.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'A';
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) avatarEl.textContent = initials;

    // 2. Setup Tabs
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    this.switchTab(hash);

    document.querySelectorAll('.admin-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    // 3. Setup Button Event Handlers
    const setupBtn = (id, handler) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', handler);
    };

    setupBtn('logoutBtn', () => this.logout());
    setupBtn('cancelAddDomain', () => this.closeAddModal());
    setupBtn('cancelDeleteDomain', () => this.closeDeleteModal());
    setupBtn('confirmDeleteDomain', () => this.confirmDelete());
    setupBtn('refreshLogsBtn', () => this.refreshData());
    setupBtn('clearLogsBtn', () => this.clearLogs());
    
    // Hook up quick actions
    setupBtn('qaAddDomain', () => this.openAddModal());
    setupBtn('qaViewAudit', () => this.switchTab('audit'));
    setupBtn('qaManageDomains', () => this.switchTab('domains'));

    // Handle add domain form submit
    const form = document.getElementById('addDomainForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addDomain();
      });
    }
    
    // Open modal buttons
    document.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', () => this.openAddModal());
    });

    // 4. Load initial data & Setup Real-time Listeners
    this.setupListeners();
    this.setupSearch();
  },

  switchTab(tabName) {
    this.currentTab = tabName;
    window.location.hash = tabName;

    // Update nav links
    document.querySelectorAll('.admin-nav-link').forEach(link => {
      if (link.dataset.tab === tabName) {
        link.classList.add('active');
        link.setAttribute('aria-selected', 'true');
      } else {
        link.classList.remove('active');
        link.setAttribute('aria-selected', 'false');
      }
    });

    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      if (panel.id === `panel-${tabName}`) {
        panel.style.display = 'block';
        panel.classList.add('active');
      } else {
        panel.style.display = 'none';
        panel.classList.remove('active');
      }
    });
  },

  setupListeners() {
    const db = window.CareerIQAuth.db;
    
    // 1. Domains (Real-time listener)
    this.unsubscribers.push(
      db.collection('allowed_domains').orderBy('createdAt', 'desc').onSnapshot(snap => {
        this.domains = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        this.renderDomainTable(document.getElementById('domainSearch')?.value || '');
        this.renderStats();
      }, err => console.error("Error listening to domains:", err))
    );

    // 2. Audit Logs (Real-time listener, last 10 events)
    this.unsubscribers.push(
      db.collection('audit_logs').orderBy('createdAt', 'desc').limit(10).onSnapshot(snap => {
        this.logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        this.renderAuditTable();
        this.renderStats();
      }, err => console.error("Error listening to audit logs:", err))
    );

    // 3. Users (Static fetch taken until the point of time when admin logs in/loads page)
    this.fetchUsersStatic();
  },

  async fetchUsersStatic() {
    const db = window.CareerIQAuth.db;
    try {
      const snap = await db.collection('users').get();
      let fetchedUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort in memory by lastLogin (handle missing fields safely)
      fetchedUsers.sort((a, b) => {
        let t1 = a.lastLogin ? (a.lastLogin.toMillis ? a.lastLogin.toMillis() : new Date(a.lastLogin).getTime()) : 0;
        let t2 = b.lastLogin ? (b.lastLogin.toMillis ? b.lastLogin.toMillis() : new Date(b.lastLogin).getTime()) : 0;
        return t2 - t1;
      });
      this.users = fetchedUsers;
      this.renderUsersTable(document.getElementById('userSearch')?.value || '');
      this.renderStats();
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  },

  async refreshData() {
    const icon = document.getElementById('refreshIcon');
    if (icon) {
      icon.classList.add('refreshing');
      setTimeout(() => icon.classList.remove('refreshing'), 500);
    }
    
    // Re-fetch static snapshot of users
    await this.fetchUsersStatic();
    CareerIQAuth.Toast.show('Users list and stats updated', 'success');
  },

  async clearLogs() {
    if (!confirm('Are you sure you want to clear all audit logs?')) return;
    try {
      const db = window.CareerIQAuth.db;
      const snap = await db.collection('audit_logs').get();
      if (snap.empty) {
        CareerIQAuth.Toast.show('No audit logs to clear', 'info');
        return;
      }
      
      const batch = db.batch();
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      CareerIQAuth.Toast.show('Audit logs cleared successfully', 'success');
    } catch(err) {
      CareerIQAuth.Toast.show('Failed to clear logs: ' + err.message, 'error');
    }
  },

  renderStats() {
    const domains = this.domains || [];
    const logs = this.logs || [];
    const users = this.users || [];
    const blocked = logs.filter(l => !l.allowed).length;

    if (document.getElementById('statTotalUsers')) document.getElementById('statTotalUsers').textContent = users.length;
    if (document.getElementById('statTotalDomains')) document.getElementById('statTotalDomains').textContent = domains.length;
    if (document.getElementById('statBlocked')) document.getElementById('statBlocked').textContent = blocked;
    
    // Recent activity on dashboard
    const list = document.getElementById('recentActivityList');
    if (list) {
      list.innerHTML = logs.slice(0, 5).map(l => `
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border);">
          <span style="font-size: 13px;">${l.email || l.domain || 'Unknown'} — <b>${l.event_type}</b></span>
          <span style="font-size: 12px; color: var(--text-muted);">${this.formatDate(l.createdAt || l.created_at)}</span>
        </div>
      `).join('') || '<div style="color:var(--text-muted); font-size:13px; text-align:center; padding:12px;">No recent activity</div>';
    }
  },

  renderDomainTable(filter = '') {
    const tbody = document.getElementById('domainTableBody');
    if (!tbody) return;

    let domains = this.domains || [];
    const badge = document.getElementById('domainCountBadge');
    if (badge) badge.textContent = domains.length;

    if (filter) {
      const f = filter.toLowerCase();
      domains = domains.filter(d => (d.domain && d.domain.toLowerCase().includes(f)) || (d.org_name && d.org_name.toLowerCase().includes(f)));
    }

    const emptyState = document.getElementById('domainEmptyState');
    const table = document.getElementById('domainTable');
    
    if (domains.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      if (table) table.style.display = 'none';
      return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (table) table.style.display = 'table';

    tbody.innerHTML = domains.map(d => `
      <tr>
        <td><span class="domain-text">@${d.domain}</span></td>
        <td>${d.org_name || '-'} ${d.org_logo || ''}</td>
        <td>
          <span class="status-badge ${d.is_active ? 'status-active' : 'status-inactive'}">
            ${d.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>${this.formatDate(d.createdAt || d.created_at)}</td>
        <td>
          <div class="table-actions">
            <button class="table-action-btn" onclick="window.AdminPanel.toggleDomain('${d.id}')">
              ${d.is_active ? 'Disable' : 'Enable'}
            </button>
            <button class="table-action-btn danger" onclick="window.AdminPanel.openDeleteModal('${d.id}', '${d.domain}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  renderAuditTable() {
    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;

    const filterVal = this.auditFilter || 'all';
    let logs = this.logs || [];
    const badge = document.getElementById('auditCountBadge');
    if (badge) badge.textContent = logs.length;

    if (filterVal === 'blocked') logs = logs.filter(l => !l.allowed);
    if (filterVal === 'allowed') logs = logs.filter(l => l.allowed);

    const emptyState = document.getElementById('auditEmptyState');
    const table = document.getElementById('auditTable');

    if (logs.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      if (table) table.style.display = 'none';
      return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (table) table.style.display = 'table';

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td class="log-time">${this.formatDate(l.createdAt || l.created_at)}</td>
        <td style="font-size:12px; font-weight:600;">${l.event_type}</td>
        <td>${l.email || '-'}</td>
        <td><span class="domain-text">${l.domain ? '@'+l.domain : '-'}</span></td>
        <td class="${l.allowed ? 'log-allowed' : 'log-blocked'}">${l.allowed ? 'Allowed' : 'Blocked'}</td>
        <td style="font-size:11px; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${l.user_agent || ''}">${this.formatUserAgent(l.user_agent)}</td>
      </tr>
    `).join('');
  },

  renderUsersTable(filter = '') {
    const tbody = document.getElementById('userTableBody');
    const emptyState = document.getElementById('userEmptyState');
    const badge = document.getElementById('userCountBadge');
    const table = document.getElementById('userTable');
    
    if (!tbody) return;

    let users = this.users || [];
    if (badge) badge.textContent = users.length;

    if (filter) {
      const f = filter.toLowerCase();
      users = users.filter(u => (u.name && u.name.toLowerCase().includes(f)) || (u.email && u.email.toLowerCase().includes(f)));
    }

    if (users.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      if (table) table.style.display = 'none';
      return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (table) table.style.display = 'table';

    tbody.innerHTML = users.map(u => {
      const roleBadge = u.role === 'admin' || u.role === 'super_admin' 
        ? `<span class="status-badge status-active">Admin</span>`
        : `<span class="status-badge" style="background: rgba(255,255,255,0.1); color: var(--text-secondary);">User</span>`;
        
      const currentUser = CareerIQAuth.Session.getUser();
      const canToggle = currentUser && (currentUser.role === 'super_admin' || (currentUser.role === 'admin' && u.role !== 'super_admin' && u.id !== currentUser.uid));

      let actionHtml = '-';
      if (canToggle) {
        actionHtml = `
          <button class="table-action-btn" onclick="window.AdminPanel.toggleUserRole('${u.id}', '${u.role}')">
            ${u.role === 'admin' ? 'Demote to User' : 'Make Admin'}
          </button>
        `;
      }

      return `
        <tr>
          <td>
            <div style="font-weight:600;">${u.name || '-'}</div>
            <div style="font-size:12px;color:var(--text-muted);">${u.email}</div>
          </td>
          <td>${roleBadge}</td>
          <td><span class="domain-text">@${u.domain || '-'}</span></td>
          <td>${this.formatDate(u.lastLogin)}</td>
          <td>
            <div class="table-actions">${actionHtml}</div>
          </td>
        </tr>
      `;
    }).join('');
  },

  async toggleUserRole(uid, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await window.CareerIQAuth.db.collection('users').doc(uid).set({ role: newRole }, { merge: true });
      CareerIQAuth.Toast.show('User role updated to ' + newRole, 'success');
      
      // Update local copy immediately for responsive feedback
      const uIdx = this.users.findIndex(u => u.id === uid);
      if (uIdx !== -1) {
        this.users[uIdx].role = newRole;
        this.renderUsersTable(document.getElementById('userSearch')?.value || '');
        this.renderStats();
      }
    } catch(err) {
      CareerIQAuth.Toast.show('Failed to update role: ' + err.message, 'error');
    }
  },

  setupSearch() {
    const input = document.getElementById('domainSearch');
    if (input) {
      input.addEventListener('input', (e) => {
        this.renderDomainTable(e.target.value);
      });
    }

    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
      userSearch.addEventListener('input', (e) => {
        this.renderUsersTable(e.target.value);
      });
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.auditFilter = e.currentTarget.dataset.filter || 'all';
        this.renderAuditTable();
      });
    });
  },

  // Modals
  openAddModal() {
    const modal = document.getElementById('addDomainModal');
    if (modal) modal.classList.remove('hidden');
    const input = document.getElementById('newDomainInput');
    if (input) input.focus();
  },

  closeAddModal() {
    const modal = document.getElementById('addDomainModal');
    if (modal) modal.classList.add('hidden');
    const inputDomain = document.getElementById('newDomainInput');
    if (inputDomain) inputDomain.value = '';
    const inputOrg = document.getElementById('newOrgInput');
    if (inputOrg) inputOrg.value = '';
  },

  async addDomain() {
    const domainEl = document.getElementById('newDomainInput');
    const orgEl = document.getElementById('newOrgInput');
    const domain = domainEl ? domainEl.value.trim().toLowerCase().replace('@', '') : '';
    const org = orgEl ? orgEl.value.trim() : '';

    if (!domain) {
      CareerIQAuth.Toast.show('Domain is required', 'error');
      return;
    }
    if (!domain.includes('.')) {
      CareerIQAuth.Toast.show('Invalid domain format', 'error');
      return;
    }

    const res = await CareerIQAuth.addDomain(domain, org);
    if (res.error) {
      CareerIQAuth.Toast.show(res.error, 'error');
      return;
    }

    CareerIQAuth.Toast.show(`Added domain @${domain}`, 'success');
    this.closeAddModal();
  },

  openDeleteModal(id, domain) {
    this.domainToDelete = id;
    const disp = document.getElementById('deleteDomainDisplay');
    if (disp) disp.textContent = `@${domain}`;
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('hidden');
  },

  closeDeleteModal() {
    this.domainToDelete = null;
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.add('hidden');
  },

  async confirmDelete() {
    if (this.domainToDelete) {
      await CareerIQAuth.removeDomain(this.domainToDelete);
      CareerIQAuth.Toast.show('Domain deleted', 'success');
      this.closeDeleteModal();
    }
  },

  async toggleDomain(id) {
    await CareerIQAuth.toggleDomain(id);
    CareerIQAuth.Toast.show('Domain status updated', 'success');
  },

  async logout() {
    await CareerIQAuth.Session.destroy();
    window.location.href = '../auth/login.html';
  },

  // Utils
  formatDate(dateObj) {
    if (!dateObj) return '-';
    let d = dateObj;
    if (d && typeof d.toDate === 'function') {
      d = d.toDate();
    } else if (typeof d === 'string' || typeof d === 'number') {
      d = new Date(d);
    }
    if (!(d instanceof Date) || isNaN(d.getTime())) return '-';
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  },

  formatUserAgent(ua) {
    if (!ua) return 'Unknown';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }
};

window.AdminPanel = AdminPanel;

const initApp = () => {
  if (typeof window.CareerIQAuth !== 'undefined') {
    AdminPanel.init();
  }
};

if (window.CareerIQAuth) {
  initApp();
} else {
  document.addEventListener('CareerIQAuthReady', initApp);
}
