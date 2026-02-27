const mockEmails = [
    { email: 'personal@spark.com', risk: 12, status: 'SAFE', lastCheck: '10m ago' },
    { email: 'work@mail.com', risk: 89, status: 'COMPROMISED', lastCheck: '1h ago' },
    { email: 'dev@github-labs.io', risk: 45, status: 'SAFE', lastCheck: '3d ago' }
];

function renderEmailCards() {
    const container = document.getElementById('email-cards-container');
    if (!container) return;

    container.innerHTML = mockEmails.map(item => `
        <div class="glass-card email-card">
            <div class="email-info">
                <div class="email-avatar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${item.status === 'SAFE' ? 'var(--accent-blue)' : 'var(--accent-red)'}" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <div>
                    <p class="email-address">${item.email}</p>
                    <p class="email-last-check">Last checked: ${item.lastCheck}</p>
                </div>
            </div>
            <div class="email-stats">
                <div class="email-risk-mini">
                    <p class="risk-label">Risk Score</p>
                    <p class="risk-value-mini ${item.risk > 50 ? 'text-neon-red' : 'text-neon-blue'}">${item.risk}</p>
                </div>
                <span class="badge ${item.status === 'SAFE' ? 'badge-safe' : 'badge-danger'}">${item.status}</span>
                <button class="details-btn">View Details</button>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    renderEmailCards();

    // Switch simulation
    const monitorToggle = document.querySelector('.activity-area + .widgets-area #sidebar + #app-container #main-content .sections-grid .widgets-area section .width-40-height-20');
    // Selector above is a bit messy because of my inline styles, let me fix dashboard.html later to have IDs
});
