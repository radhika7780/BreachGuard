/**
 * SentinelX – Dark Web Breach Monitor
 * api.js – All REST API communication layer
 */

const API_BASE = ''; // Use relative paths for same-origin requests

async function apiFetch(endpoint, options = {}) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return { ok: true, data };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

// ── Dashboard
export async function fetchDashboardStats() {
    return apiFetch('/api/stats');
}

// ── Emails
export async function fetchEmails() {
    return apiFetch('/api/emails');
}
export async function addEmail(email) {
    return apiFetch('/api/add-email', {
        method: 'POST', body: JSON.stringify({ email })
    });
}
export async function deleteEmail(emailId) {
    return apiFetch(`/api/emails/${emailId}`, { method: 'DELETE' });
}
export async function checkEmailNow(emailId) {
    return apiFetch(`/api/emails/${emailId}/check`, { method: 'POST' });
}

// ── Breaches & Remediation
export async function fetchBreaches(emailId) {
    return apiFetch(`/api/breaches/${emailId}`);
}
export async function fetchAllBreaches() {
    return apiFetch('/api/breaches');
}
export async function fetchRemediation() {
    return apiFetch('/api/remediation');
}

// ── Alerts
export async function fetchAlerts() {
    return apiFetch('/api/alerts');
}
export async function getUnreadAlertCount() {
    return apiFetch('/api/alerts/unread-count');
}
export async function markAlertRead(alertId) {
    return apiFetch(`/api/alerts/${alertId}/read`, { method: 'PUT' });
}
export async function markAllAlertsRead() {
    return apiFetch(`/api/alerts/read-all`, { method: 'PUT' });
}
export async function deleteAlert(alertId) {
    return apiFetch(`/api/alerts/${alertId}`, { method: 'DELETE' });
}

// ── Intel (Usernames)
export async function fetchUsernameVariations() {
    return apiFetch('/api/username-variations');
}
export async function addUsernameMonitor(username) {
    return apiFetch('/api/username-monitor', {
        method: 'POST', body: JSON.stringify({ username })
    });
}

// ── Settings & System
export async function fetchMonitoringStatus() {
    return apiFetch('/api/monitoring/status');
}
export async function toggleAutoMonitoring(enabled) {
    return apiFetch('/api/monitoring/toggle', {
        method: 'POST', body: JSON.stringify({ enabled })
    });
}
export async function fetchSettings() {
    return apiFetch('/api/settings');
}
export async function saveSettings(settingsObj) {
    return apiFetch('/api/settings', {
        method: 'POST', body: JSON.stringify(settingsObj)
    });
}