/**
 * SentinelX – Dark Web Breach Monitor
 * alerts.js – Push notification simulator & logic
 */

const SEVERITY_ICONS = {
    critical: '🚨',
    high: '⚠️',
    medium: '🔔',
    low: 'ℹ️'
};

export function simulateSMSAlert(email, breachCount) {
    // Simple visual simulation of an SMS toast notification reaching a phone
    if (breachCount === 0) return;

    const toast = document.createElement('div');
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        background: 'rgba(13, 19, 32, 0.95)',
        border: '1px solid var(--neon-red)',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow: '0 10px 30px rgba(255, 51, 102, 0.2)',
        zIndex: '9999',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        transform: 'translateX(120%)',
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        backdropFilter: 'blur(10px)',
        maxWidth: '320px'
    });

    toast.innerHTML = `
    <div style="font-size: 24px;">💬</div>
    <div>
      <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 4px; display: flex; justify-content: space-between;">
        <span>SMS Alert</span> <span style="color: var(--neon-red)">SentinelX</span>
      </div>
      <div style="font-size: 14px; line-height: 1.4;">
        Security breach detected for <span style="color: var(--text-primary); font-weight: 600;">${email}</span>. Found in <b>${breachCount}</b> new database leak(s).
      </div>
    </div>
  `;

    document.body.appendChild(toast);

    // Slide in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
    });

    // Slide out after 5 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

export function createAlertToast(message, type = 'info') {
    const toast = document.createElement('div');

    const colors = {
        info: 'var(--neon-blue)',
        success: 'var(--neon-green)',
        warning: 'var(--neon-orange)',
        error: 'var(--neon-red)'
    };
    const color = colors[type];

    Object.assign(toast.style, {
        position: 'fixed',
        top: '30px',
        right: '30px',
        background: 'var(--bg-secondary)',
        borderLeft: `4px solid ${color}`,
        borderTop: '1px solid var(--border)',
        borderRight: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px 20px',
        boxShadow: `0 5px 20px rgba(0,0,0,0.5)`,
        zIndex: '9999',
        fontSize: '0.9rem',
        transform: 'translateY(-150%)',
        transition: 'transform 0.3s ease',
        minWidth: '250px'
    });

    toast.textContent = message;
    document.body.appendChild(toast);

    // Slide in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
    });

    // Slide out after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateY(-150%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}