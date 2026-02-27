/**
 * SentinelX – Dark Web Breach Monitor
 * charts.js – Chart.js configuration and rendering
 */

import { fetchAllBreaches, fetchEmails } from './api.js';

let riskChartInstance = null;
let timelineChartInstance = null;

// Dynamically load Chart.js from CDN
async function loadChartJs() {
    if (window.Chart) return window.Chart;
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => resolve(window.Chart);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export async function renderAnalyticsCharts() {
    try {
        await loadChartJs();

        const [breachesRes, emailsRes] = await Promise.all([
            fetchAllBreaches(),
            fetchEmails()
        ]);

        const breaches = breachesRes.ok ? breachesRes.data : [];
        const emails = emailsRes.ok ? emailsRes.data : [];

        renderRiskDistribution(emails);
        renderBreachTimeline(breaches);
        renderTopSources(breaches);

    } catch (err) {
        console.error('Error rendering charts:', err);
    }
}

function renderRiskDistribution(emails) {
    const ctx = document.getElementById('riskChart');
    if (!ctx || emails.length === 0) return;

    let high = 0, med = 0, low = 0, safe = 0;
    emails.forEach(e => {
        if (e.status === 'safe') safe++;
        else if (e.risk_score >= 70) high++;
        else if (e.risk_score >= 40) med++;
        else low++;
    });

    if (riskChartInstance) riskChartInstance.destroy();

    Chart.defaults.color = '#8ba4c8';
    Chart.defaults.font.family = 'Inter';

    riskChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['High Risk', 'Medium Risk', 'Low Risk', 'Safe'],
            datasets: [{
                data: [high, med, low, safe],
                backgroundColor: [
                    '#ff3366', // neon-red
                    '#ff8c42', // neon-orange
                    '#00d4ff', // neon-blue
                    '#00ff9f'  // neon-green
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12, padding: 20 } }
            }
        }
    });
}

function renderBreachTimeline(breaches) {
    const ctx = document.getElementById('timelineChart');
    if (!ctx || breaches.length === 0) return;

    // Group by Yesr-Month
    const counts = {};
    breaches.forEach(b => {
        if (!b.breach_date) return;
        const ym = b.breach_date.substring(0, 7); // YYYY-MM
        counts[ym] = (counts[ym] || 0) + 1;
    });

    // Sort chronologically
    const labels = Object.keys(counts).sort();
    const data = labels.map(l => counts[l]);

    // Keep max past 12 entries
    const recentLabels = labels.slice(-12);
    const recentData = data.slice(-12);

    if (timelineChartInstance) timelineChartInstance.destroy();

    timelineChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: recentLabels,
            datasets: [{
                label: 'Breach Detections',
                data: recentData,
                backgroundColor: 'rgba(0, 212, 255, 0.4)',
                borderColor: '#00d4ff',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderTopSources(breaches) {
    const container = document.getElementById('topBreachSources');
    if (!container) return;

    if (breaches.length === 0) {
        container.innerHTML = '<div class="empty-state">No breaches found yet.</div>';
        return;
    }

    const counts = {};
    breaches.forEach(b => {
        counts[b.breach_name] = (counts[b.breach_name] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);

    container.innerHTML = sorted.map(([name, count], index) => `
    <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--border)">
      <div style="display:flex; gap:12px; align-items:center;">
        <span style="color:var(--text-muted); font-size:0.8rem; width:20px">${index + 1}.</span>
        <span style="font-weight:600">${name}</span>
      </div>
      <span class="badge-compromised">${count} accounts</span>
    </div>
  `).join('');
}