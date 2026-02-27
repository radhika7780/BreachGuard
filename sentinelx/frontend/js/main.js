/**
 * SentinelX – Dark Web Breach Monitor
 * main.js – Core application controller
 */

import * as api from './api.js';
import { renderAnalyticsCharts } from './charts.js';
import { simulateSMSAlert, createAlertToast } from './alerts.js';

const state = {
    currentPage: 'dashboard',
    emails: [],
    alerts: [],
};

// ── Utils ───────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const showEmailPreview = (email, message) => {
    $('breachModal').style.display = 'flex';
    $('modalEmailTitle').innerHTML = `📧 Email Alert Preview`;
    const c = $('breachContainer');

    c.innerHTML = `
    <div style="background:#f4f7fa; color:#333; padding:40px; border-radius:8px; font-family: sans-serif; max-width:500px; margin:20px auto;">
        <div style="background:#0d1320; padding:20px; border-radius:8px 8px 0 0; color:#00d4ff; font-weight:800; font-size:20px;">
          🛡 SentinelX
        </div>
        <div style="background:#fff; padding:30px; border-radius:0 0 8px 8px;">
          <h2 style="margin-top:0; color:#1a1f2e;">Security Alert for ${email}</h2>
          <p style="color:#555; line-height:1.6;">${message}</p>
          <div style="margin:30px 0; border-top:1px solid #eee; padding-top:20px;">
            <p style="font-size:12px; color:#999;">If this wasn't you, please secure your account immediately.</p>
          </div>
          <button style="background:#00d4ff; color:#fff; border:none; padding:12px 24px; border-radius:6px; font-weight:700; cursor:pointer;">Secure Account Now</button>
        </div>
    </div>
  `;
};

const timeAgo = iso => {
    if (!iso) return 'Never';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

const badgeClass = status => {
    const map = { safe: 'badge-safe', compromised: 'badge-compromised', monitoring: 'badge-monitoring' };
    return map[status?.toLowerCase()] || 'badge-safe';
};

const severityColor = sev => {
    const map = { critical: 'var(--neon-red)', high: 'var(--neon-orange)', medium: 'var(--neon-blue)', low: 'var(--neon-green)' };
    return map[sev?.toLowerCase()] || 'var(--text-primary)';
};

// ── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initGlobalActions();
    navigateTo('dashboard');
});

function initNav() {
    document.querySelectorAll('.nav-item').forEach(el => {
        el.addEventListener('click', () => {
            const page = el.dataset.page;
            if (page) navigateTo(page);
        });
    });
}

const initGlobalActions = () => {
    const refresh = $('refreshBtn');
    if (refresh) refresh.addEventListener('click', () => loadPage(state.currentPage));

    // SMS Simulation
    $('simulateSmsBtn')?.addEventListener('click', () => {
        simulateSMSAlert('demo-user@example.com', 3);
    });

    // Modal close
    $('closeModal')?.addEventListener('click', () => {
        $('breachModal').style.display = 'none';
    });
}

// ── Routing ─────────────────────────────────────────────────────────────────
function navigateTo(page) {
    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const nav = $(`nav-${page}`);
    if (nav) nav.classList.add('active');

    // Show page content
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const pageEl = $(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    // Update Headers
    const titles = {
        dashboard: ['Dashboard Overview', 'Dark Web Breach Monitor'],
        emails: ['Monitored Emails', 'Track and manage monitored email addresses'],
        alerts: ['Alerts Center', 'Real-time security notifications'],
        analytics: ['Risk Analytics', 'Threat intelligence and risk trends'],
        username: ['Username Intelligence', 'Discover and monitor username variations'],
        settings: ['Settings', 'Configure your monitoring preferences']
    };

    const titleEl = $('topbarTitle');
    if (titleEl && titles[page]) {
        titleEl.querySelector('h2').textContent = titles[page][0];
        titleEl.querySelector('p').textContent = titles[page][1];
    }

    state.currentPage = page;
    loadPage(page);
    updateAlertBadge();
}

async function loadPage(page) {
    switch (page) {
        case 'dashboard': await loadDashboard(); break;
        case 'emails': await loadEmails(); break;
        case 'alerts': await loadAlerts(); break;
        case 'analytics': await loadAnalytics(); break;
        case 'username': await loadUsername(); break;
        case 'settings': await loadSettings(); break;
    }
}

// ── Dashboard ───────────────────────────────────────────────────────────────
async function loadDashboard() {
    // Stats
    const statsRes = await api.fetchDashboardStats();
    if (statsRes.ok) {
        const score = Math.round(statsRes.data.overallRiskScore);
        $('totalEmails').textContent = statsRes.data.totalEmails;
        $('compromisedCount').textContent = statsRes.data.compromisedCount;
        $('safeCount').textContent = statsRes.data.safeCount;
        $('overallRiskScore').textContent = score;

        // Animate circular meter
        const circle = $('riskCircle');
        if (circle) {
            circle.style.strokeDasharray = `${score}, 100`;
            if (score >= 70) circle.style.stroke = 'var(--neon-red)';
            else if (score >= 40) circle.style.stroke = 'var(--neon-orange)';
            else circle.style.stroke = 'var(--neon-blue)';
        }
    }

    // Recent Breaches
    const breachesRes = await api.fetchAllBreaches();
    const bc = $('recentBreachContainer');
    if (breachesRes.ok) {
        const breaches = breachesRes.data.slice(0, 4); // Top 4
        if (breaches.length === 0) {
            bc.innerHTML = `<div class="empty-state" style="padding:24px"><div class="empty-title" style="font-size:0.9rem">No breaches detected</div></div>`;
        } else {
            bc.innerHTML = breaches.map(b => `
        <div class="breach-card" style="padding:14px 22px">
          <div style="display:flex; justify-content:space-between; align-items:center;">
             <div>
               <div class="breach-name" style="font-size:0.9rem">${b.breach_name}</div>
               <div class="breach-meta" style="margin-bottom:0">Found for: ${b.email_address || 'Unknown'}</div>
             </div>
             <span class="sev-${b.severity.substring(0, 3)}" style="font-size:0.8rem; font-weight:700">${b.severity.toUpperCase()}</span>
          </div>
        </div>
      `).join('');
        }
    } else {
        bc.innerHTML = `<div class="error-state">Failed to load breach data.</div>`;
    }

    // Monitoring Status
    const monRes = await api.fetchMonitoringStatus();
    const mc = $('monitoringStatusContainer');
    if (monRes.ok) {
        const isEn = monRes.data.enabled;
        mc.innerHTML = `
      <div class="monitoring-status">
        <div class="monitoring-row">
          <span class="monitoring-label">System Status</span>
          <div style="display:flex; align-items:center; gap:10px">
            <span class="monitoring-val" style="color:var(--neon-${isEn ? 'green' : 'orange'})">${isEn ? 'Active' : 'Paused'}</span>
            <label class="toggle-switch" style="transform:scale(0.8)">
              <input type="checkbox" id="dashMonToggle" ${isEn ? 'checked' : ''} />
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <div class="monitoring-row">
          <span class="monitoring-label">Last Sweep</span>
          <span class="monitoring-val">${timeAgo(new Date().toISOString())}</span>
        </div>
        <div class="monitoring-row">
          <span class="monitoring-label">Next Scheduled</span>
          <span class="monitoring-val" style="color:var(--text-muted)">In 54 mins...</span>
        </div>
      </div>
    `;

        $('dashMonToggle').onchange = async (e) => {
            await api.toggleAutoMonitoring(e.target.checked);
            loadDashboard();
            createAlertToast(e.target.checked ? 'Auto-monitoring enabled' : 'Auto-monitoring paused', 'info');
        };
    }

    // Remediation
    const remRes = await api.fetchRemediation();
    const rc = $('remediationContainer');
    if (remRes.ok) {
        const steps = remRes.data;
        if (steps.length === 0) {
            rc.innerHTML = `<div style="padding:22px; color:var(--neon-green); font-weight:600">No action required at this time.</div>`;
        } else {
            rc.innerHTML = steps.map(s => `
        <div class="remediation-step">
          <div class="step-icon">${s.icon || '🛡'}</div>
          <div class="step-body">
            <div class="step-title">${s.title} <span class="priority-${s.priority}">${s.priority.toUpperCase()} Priority</span></div>
            <div class="step-desc">${s.description}</div>
          </div>
        </div>
      `).join('');
        }
    }
}

// ── Emails ──────────────────────────────────────────────────────────────────
async function loadEmails() {
    // Bind Add Email
    const addBtn = $('addEmailBtn');
    addBtn.onclick = async () => {
        const input = $('emailInput');
        const msg = $('addEmailMsg');
        const email = input.value.trim();

        if (!email) return;

        addBtn.textContent = 'Adding...';
        const res = await api.addEmail(email);
        addBtn.textContent = '+ Add Email';

        if (res.ok) {
            msg.className = 'form-msg success';
            msg.textContent = res.data.message;
            input.value = '';
            loadEmails(); // refresh list
            createAlertToast(`Started monitoring ${email}`, 'success');

            // Auto check after adding
            setTimeout(() => triggerEmailCheck(res.data.email.id, email), 1000);
        } else {
            msg.className = 'form-msg error';
            msg.textContent = res.error;
        }
    };

    const res = await api.fetchEmails();
    const list = $('emailListContainer');

    if (!res.ok) {
        list.innerHTML = `<div class="error-state">Error: ${res.error}</div>`;
        return;
    }

    state.emails = res.data;

    if (state.emails.length === 0) {
        list.innerHTML = `<div class="empty-state"><div class="empty-icon">✉️</div><div class="empty-title">No emails monitored</div><p>Add an email above to start tracking dark web breaches.</p></div>`;
        return;
    }

    list.innerHTML = state.emails.map(e => `
    <div class="email-item">
      <div class="email-avatar">${e.email.charAt(0).toUpperCase()}</div>
      <div class="email-info">
        <div class="email-addr">${e.email}</div>
        <div class="email-meta">Added ${new Date(e.created_at).toLocaleDateString()} • Last check: ${timeAgo(e.last_checked)}</div>
      </div>
      <div class="risk-bar-wrap">
        <div class="risk-bar-label">Risk: ${e.risk_score}</div>
        <div class="risk-bar risk-${e.risk_score >= 70 ? 'high' : e.risk_score >= 40 ? 'medium' : 'low'}">
          <div class="risk-bar-fill" style="width: ${e.risk_score}%"></div>
        </div>
      </div>
      <div style="width:100px; text-align:center"><span class="${badgeClass(e.status)}">${e.status}</span></div>
      <div class="email-actions">
        <button class="icon-btn scan-btn" data-id="${e.id}" data-email="${e.email}" title="Scan Now">📡</button>
        <button class="btn-outline view-breach-btn" data-id="${e.id}" data-email="${e.email}">View Details</button>
        <button class="icon-btn del-email-btn" data-id="${e.id}" style="color:var(--neon-red); border-color:transparent" title="Remove">🗑</button>
      </div>
    </div>
  `).join('');

    // Bind clicks
    document.querySelectorAll('.view-breach-btn').forEach(btn => {
        btn.onclick = () => showBreachDetails(btn.dataset.id, btn.dataset.email);
    });

    document.querySelectorAll('.scan-btn').forEach(btn => {
        btn.onclick = () => triggerEmailCheck(btn.dataset.id, btn.dataset.email);
    });

    document.querySelectorAll('.del-email-btn').forEach(btn => {
        btn.onclick = async () => {
            if (confirm('Stop monitoring this email? This will delete all history.')) {
                await api.deleteEmail(btn.dataset.id);
                loadEmails();
            }
        };
    });
}

async function triggerEmailCheck(id, email) {
    createAlertToast(`Scanning ${email} for breaches...`, 'info');
    const res = await api.checkEmailNow(id);
    if (res.ok) {
        if (res.data.breaches_found > 0) {
            createAlertToast(`Alert! Found ${res.data.breaches_found} breaches for ${email}.`, 'error');
            simulateSMSAlert(email, res.data.breaches_found);
        } else {
            createAlertToast(`Scan complete. No breaches found.`, 'success');
        }
        loadEmails();
        updateAlertBadge();
    }
}

async function showBreachDetails(emailId, emailAddress) {
    $('breachModal').style.display = 'flex';
    $('modalEmailTitle').textContent = `Breaches: ${emailAddress}`;
    const c = $('breachContainer');
    c.innerHTML = `<div class="loading-row"><div class="spinner"></div><span>Loading…</span></div>`;

    const res = await api.fetchBreaches(emailId);
    if (!res.ok) {
        c.innerHTML = `<div class="error-state" style="padding:22px">Failed to load data.</div>`;
        return;
    }

    const breaches = res.data.breaches;
    if (breaches.length === 0) {
        c.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">Clean Record</div><p>No known breaches found for this email address.</p></div>`;
        return;
    }

    c.innerHTML = breaches.map(b => `
    <div class="breach-card">
      <div style="display:flex; justify-content:space-between; align-items:flex-start">
        <div>
          <div class="breach-name" style="font-size:1.1rem">${b.breach_name}</div>
          <div class="breach-meta">
            <span>📅 ${b.breach_date || 'Unknown Date'}</span>
            <span style="color:${severityColor(b.severity)}; font-weight:700">● ${b.severity?.toUpperCase()}</span>
          </div>
        </div>
      </div>
      <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5; margin-bottom:12px">
        ${b.description || 'No description provided.'}
      </p>
      <div class="breach-data">
        <span style="font-size:0.75rem; color:var(--text-muted); margin-top:2px; margin-right:4px">Data Compromised:</span>
        ${(b.data_leaked || '').split(',').map(d => `<span class="data-tag">${d.trim()}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

// ── Alerts ──────────────────────────────────────────────────────────────────
async function loadAlerts() {
    const readAllBtn = $('markAllReadBtn');
    readAllBtn.onclick = async () => {
        await api.markAllAlertsRead();
        loadAlerts();
        updateAlertBadge();
    };

    const list = $('alertContainer');
    const res = await api.fetchAlerts();

    if (!res.ok) {
        list.innerHTML = `<div class="error-state">Error loading alerts.</div>`;
        return;
    }

    const alerts = res.data;
    if (alerts.length === 0) {
        list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-title">All Caught Up</div><p>No security alerts to display.</p></div>`;
        return;
    }

    list.innerHTML = alerts.map(a => `
    <div class="alert-item severity-${a.severity} ${a.is_read ? '' : 'unread'}">
      <div class="alert-icon">${SEVERITY_ICONS[a.severity] || '🔔'}</div>
      <div class="alert-body">
        <div class="alert-msg">${a.message}</div>
        <div class="alert-meta">${timeAgo(a.created_at)}</div>
      </div>
      <div class="alert-actions" style="flex-direction:column; align-items:flex-end">
        <div style="display:flex; gap:6px; margin-bottom:6px">
          ${!a.is_read ? `<button class="icon-btn mark-read-btn" data-id="${a.id}" title="Mark Read">✓</button>` : ''}
          <button class="icon-btn del-alert-btn" data-id="${a.id}" style="color:var(--text-muted); border-color:transparent" title="Delete">✕</button>
        </div>
        <button class="card-link preview-email-btn" data-id="${a.id}" data-msg="${a.message}" data-email="${a.email || 'User'}" style="background:transparent; border:none; cursor:pointer">Preview Email</button>
      </div>
    </div>
  `).join('');

    // Binds
    document.querySelectorAll('.preview-email-btn').forEach(btn => {
        btn.onclick = () => showEmailPreview(btn.dataset.email, btn.dataset.msg);
    });
    document.querySelectorAll('.mark-read-btn').forEach(btn => {
        btn.onclick = async () => {
            await api.markAlertRead(btn.dataset.id);
            loadAlerts();
            updateAlertBadge();
        };
    });
    document.querySelectorAll('.del-alert-btn').forEach(btn => {
        btn.onclick = async () => {
            await api.deleteAlert(btn.dataset.id);
            loadAlerts();
            updateAlertBadge();
        };
    });
}

async function updateAlertBadge() {
    const res = await api.getUnreadAlertCount();
    const b = $('alertsBadge');
    if (b && res.ok) {
        const limit = res.data.count;
        if (limit > 0) {
            b.style.display = 'block';
            b.textContent = limit > 99 ? '99+' : limit;
        } else {
            b.style.display = 'none';
        }
    }
}

// ── Analytics ───────────────────────────────────────────────────────────────
async function loadAnalytics() {
    const bRes = await api.fetchAllBreaches();
    const eRes = await api.fetchEmails();

    if (bRes.ok && eRes.ok) {
        $('totalBreaches').textContent = bRes.data.length;
        $('activeMonitors').textContent = eRes.data.length;
        $('highRiskCount').textContent = eRes.data.filter(e => e.risk_score >= 70).length;
    }

    const aRes = await api.getUnreadAlertCount();
    if (aRes.ok) $('unreadAlerts').textContent = aRes.data.count;

    // Render Charts
    renderAnalyticsCharts();
}

// ── Username Intel ──────────────────────────────────────────────────────────
async function loadUsername() {
    const btn = $('addUsernameBtn');
    btn.onclick = async () => {
        const input = $('usernameInput');
        const msg = $('addUsernameMsg');
        const val = input.value.trim();
        if (!val) return;

        btn.textContent = 'Scanning...';
        const res = await api.addUsernameMonitor(val);
        btn.textContent = '🔎 Scan Username';

        if (res.ok) {
            msg.className = 'form-msg success';
            msg.textContent = res.data.message;
            input.value = '';
            loadUsernameList();
        } else {
            msg.className = 'form-msg error';
            msg.textContent = res.error;
        }
    };

    loadUsernameList();
}

async function loadUsernameList() {
    const c = $('usernameContainer');
    c.innerHTML = `<div class="loading-row"><div class="spinner"></div><span>Analyzing intelligence data…</span></div>`;
    const res = await api.fetchUsernameVariations();

    if (!res.ok) {
        c.innerHTML = `<div class="error-state">Error loading username variations.</div>`;
        return;
    }

    const list = res.data;
    if (list.length === 0) {
        c.innerHTML = `<div class="empty-state"><div class="empty-icon">🔎</div><div class="empty-title">No usernames scanned yet</div><p>Enter a username above to discover variations and platform exposure.</p></div>`;
        return;
    }

    c.innerHTML = list.map(u => `
    <div class="username-card">
      <div class="username-icon">👤</div>
      <div class="username-info">
        <div class="username-text">${u.username}</div>
        <div class="username-platforms">Platforms: ${u.platforms.length > 0 ? u.platforms.join(', ') : 'None detected'}</div>
      </div>
      <div style="text-align:right">
        <div style="margin-bottom:8px">
          <span class="confidence-badge">${Math.round(u.confidence_score * 100)}% match</span>
          <span class="badge-${u.risk_level === 'high' ? 'compromised' : u.risk_level === 'medium' ? 'warning' : 'safe'}">${u.risk_level} risk</span>
        </div>
        <button class="btn-outline add-to-monitor-btn" data-username="${u.username}" style="padding:4px 10px; font-size:0.7rem">Add to Monitor</button>
      </div>
    </div>
  `).join('');

    // Bind Add to Monitor buttons
    document.querySelectorAll('.add-to-monitor-btn').forEach(btn => {
        btn.onclick = async () => {
            const uname = btn.dataset.username;
            btn.textContent = 'Adding...';
            const res = await api.addUsernameMonitor(uname);
            if (res.ok) {
                createAlertToast(`Now monitoring username: ${uname}`, 'success');
                btn.textContent = 'Monitored ✓';
                btn.disabled = true;
            } else {
                createAlertToast(res.error, 'error');
                btn.textContent = 'Add to Monitor';
            }
        };
    });
}

// ── Settings ────────────────────────────────────────────────────────────────
async function loadSettings() {
    const res = await api.fetchSettings();
    if (res.ok) {
        const s = res.data;
        $('autoMonitoringToggle').checked = s.auto_monitoring === 'true';
        $('emailAlertsToggle').checked = s.email_alerts === 'true';
        $('alertThreshold').value = s.alert_threshold || 40;
        $('monitoringInterval').value = s.monitoring_interval || 3600;
    }

    $('saveSettingsBtn').onclick = async () => {
        const payload = {
            auto_monitoring: $('autoMonitoringToggle').checked ? 'true' : 'false',
            email_alerts: $('emailAlertsToggle').checked ? 'true' : 'false',
            alert_threshold: $('alertThreshold').value,
            monitoring_interval: $('monitoringInterval').value,
        };

        // Attempt toggle API explicitly for backend schedule state
        await api.toggleAutoMonitoring($('autoMonitoringToggle').checked);

        const sRes = await api.saveSettings(payload);
        const msg = $('settingsMsg');
        msg.className = sRes.ok ? 'form-msg success' : 'form-msg error';
        msg.textContent = sRes.ok ? 'Settings saved successfully.' : sRes.error;

        setTimeout(() => msg.textContent = '', 3000);
    };
}