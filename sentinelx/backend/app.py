import os
import datetime
import random
import uuid
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app) # Enable CORS for development

# --- Mock Data ---

mock_emails = [
    {"id": "1", "email": "admin@sentinelx.io", "status": "compromised", "risk_score": 85, "last_checked": "2026-02-27T10:00:00Z", "created_at": "2026-01-15T08:30:00Z"},
    {"id": "2", "email": "jessani.r@example.com", "status": "safe", "risk_score": 12, "last_checked": "2026-02-27T12:45:00Z", "created_at": "2026-02-01T14:20:00Z"},
    {"id": "3", "email": "dev-monitor@web.org", "status": "compromised", "risk_score": 42, "last_checked": "2026-02-27T14:15:00Z", "created_at": "2026-02-20T09:10:00Z"},
]

mock_breaches = [
    {"id": "b1", "email_id": "1", "email_address": "admin@sentinelx.io", "breach_name": "Adobe Creative Cloud", "breach_date": "2013-10-04", "severity": "high", "data_leaked": "Email, Passwords, Names", "description": "In October 2013, Adobe suffered a massive data breach that exposed the accounts of 38 million users."},
    {"id": "b2", "email_id": "1", "email_address": "admin@sentinelx.io", "breach_name": "LinkedIn Megabreach", "breach_date": "2016-05-17", "severity": "critical", "data_leaked": "Email, Passwords", "description": "LinkedIn reported a breach from 2012 that resulted in the compromise of over 100 million user credentials."},
    {"id": "b3", "email_id": "3", "email_address": "dev-monitor@web.org", "breach_name": "Canva Leak", "breach_date": "2019-05-24", "severity": "medium", "data_leaked": "Email, Names, Usernames", "description": "Canva had a security breach where hackers accessed the data of 137 million users."},
]

mock_alerts = [
    {"id": "a1", "severity": "critical", "message": "High risk breach detected for admin@sentinelx.io on LinkedIn", "is_read": False, "created_at": "2026-02-27T15:00:00Z", "email": "admin@sentinelx.io"},
    {"id": "a2", "severity": "medium", "message": "Suspicious login attempt from unknown IP (192.168.1.1)", "is_read": True, "created_at": "2026-02-26T20:30:00Z", "email": "jessani.r@example.com"},
    {"id": "a3", "severity": "high", "message": "Your password for dev-monitor@web.org was found in Canva leak", "is_read": False, "created_at": "2026-02-27T16:45:00Z", "email": "dev-monitor@web.org"},
]

mock_remediation = [
    {"title": "Enable 2FA", "description": "Compromised accounts detected. Enable Two-Factor Authentication across all linked platforms immediately.", "priority": "critical", "icon": "🔐"},
    {"title": "Reset Passwords", "description": "Update leaked passwords for jessani.r@example.com. Use a unique complex password for each service.", "priority": "high", "icon": "🔑"},
    {"title": "Financial Watch", "description": "Several breaches included financial metadata. Monitor your credit statements for suspicious activity.", "priority": "medium", "icon": "💳"},
]

mock_intel = [
    {"username": "jessani_r", "platforms": ["Twitter", "Github", "Reddit"], "confidence_score": 0.98, "risk_level": "low"},
    {"username": "jessani_radhika", "platforms": ["LinkedIn", "Facebook"], "confidence_score": 0.85, "risk_level": "medium"},
    {"username": "jessani_dev", "platforms": [], "confidence_score": 0.45, "risk_level": "high"},
]

mock_settings = {
    "auto_monitoring": "true",
    "email_alerts": "true",
    "alert_threshold": 40,
    "monitoring_interval": 3600
}

monitoring_enabled = True

# --- Helper functions ---

def get_stats():
    total = len(mock_emails)
    compromised = sum(1 for e in mock_emails if e['status'] == 'compromised')
    safe = total - compromised
    avg_risk = sum(e['risk_score'] for e in mock_emails) / total if total > 0 else 0
    return {
        "totalEmails": total,
        "compromisedCount": compromised,
        "safeCount": safe,
        "overallRiskScore": avg_risk
    }

# --- API Endpoints ---

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/dashboard.html')
def serve_dashboard():
    return send_from_directory(app.static_folder, 'dashboard.html')

@app.route('/api/stats')
def api_stats():
    return jsonify(get_stats())

@app.route('/api/emails', methods=['GET'])
def api_emails():
    return jsonify(mock_emails)

@app.route('/api/add-email', methods=['POST'])
def api_add_email():
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({"error": "Email is required"}), 400
    new_email = {
        "id": str(uuid.uuid4()),
        "email": email,
        "status": "monitoring",
        "risk_score": 0,
        "last_checked": None,
        "created_at": datetime.datetime.utcnow().isoformat() + "Z"
    }
    mock_emails.append(new_email)
    return jsonify({"message": f"Successfully added {email}", "email": new_email})

@app.route('/api/emails/<id>', methods=['DELETE'])
def api_delete_email(id):
    global mock_emails
    mock_emails = [e for e in mock_emails if e['id'] != id]
    return jsonify({"message": "Email removed"})

@app.route('/api/emails/<id>/check', methods=['POST'])
def api_check_email(id):
    found = False
    for e in mock_emails:
        if e['id'] == id:
            e['last_checked'] = datetime.datetime.utcnow().isoformat() + "Z"
            # Simulate random update
            if random.random() > 0.5:
                e['status'] = 'compromised'
                e['risk_score'] = random.randint(40, 95)
            else:
                e['status'] = 'safe'
                e['risk_score'] = random.randint(0, 30)
            return jsonify({"status": "success", "breaches_found": 1 if e['status'] == 'compromised' else 0})
    return jsonify({"error": "Email not found"}), 404

@app.route('/api/breaches/<email_id>')
def api_breaches_by_id(email_id):
    filtered = [b for b in mock_breaches if b['email_id'] == email_id]
    return jsonify({"breaches": filtered})

@app.route('/api/breaches')
def api_all_breaches():
    return jsonify(mock_breaches)

@app.route('/api/remediation')
def api_remediation():
    return jsonify(mock_remediation)

@app.route('/api/alerts')
def api_alerts():
    return jsonify(sorted(mock_alerts, key=lambda x: x['created_at'], reverse=True))

@app.route('/api/alerts/unread-count')
def api_unread_count():
    count = sum(1 for a in mock_alerts if not a['is_read'])
    return jsonify({"count": count})

@app.route('/api/alerts/<id>/read', methods=['PUT'])
def api_mark_read(id):
    for a in mock_alerts:
        if a['id'] == id:
            a['is_read'] = True
            break
    return jsonify({"message": "Alert marked as read"})

@app.route('/api/alerts/read-all', methods=['PUT'])
def api_read_all():
    for a in mock_alerts:
        a['is_read'] = True
    return jsonify({"message": "All alerts marked as read"})

@app.route('/api/alerts/<id>', methods=['DELETE'])
def api_delete_alert(id):
    global mock_alerts
    mock_alerts = [a for a in mock_alerts if a['id'] != id]
    return jsonify({"message": "Alert deleted"})

@app.route('/api/username-variations')
def api_username_variations():
    return jsonify(mock_intel)

@app.route('/api/username-monitor', methods=['POST'])
def api_username_monitor():
    data = request.json
    username = data.get('username')
    new_variation = {
        "username": f"{username}_variation",
        "platforms": ["Detectron", "ShadowWeb"],
        "confidence_score": 0.72,
        "risk_level": "medium"
    }
    mock_intel.append(new_variation)
    return jsonify({"message": "Scanning initiated", "variation": new_variation})

@app.route('/api/monitoring/status')
def api_mon_status():
    return jsonify({"enabled": monitoring_enabled})

@app.route('/api/monitoring/toggle', methods=['POST'])
def api_mon_toggle():
    global monitoring_enabled
    data = request.json
    monitoring_enabled = data.get('enabled', True)
    return jsonify({"status": "success", "enabled": monitoring_enabled})

@app.route('/api/settings', methods=['GET', 'POST'])
def api_settings():
    global mock_settings
    if request.method == 'POST':
        mock_settings.update(request.json)
        return jsonify({"message": "Settings updated"})
    return jsonify(mock_settings)

if __name__ == "__main__":
    print(f"Starting SentinelX Mock Backend...")
    app.run(debug=True, port=5000)
