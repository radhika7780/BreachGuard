import re
import random
import datetime
from flask import Blueprint, jsonify, request

try:
    from ..database import db_session
    from ..models import Email, Breach
    from ..services.risk_engine import calculate_risk
except ImportError:
    from database import db_session
    from models import Email, Breach
    from services.risk_engine import calculate_risk

email_bp = Blueprint('email', __name__)


# -----------------------
# Utility
# -----------------------

def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


# -----------------------
# Add Email
# -----------------------

@email_bp.route('/add-email', methods=['POST'])
def add_email():
    try:
        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({"error": "Email is required"}), 400

        email_address = data['email'].strip()

        if not is_valid_email(email_address):
            return jsonify({"error": "Invalid email format"}), 400

        existing = db_session.query(Email).filter_by(email_address=email_address).first()
        if existing:
            return jsonify({"error": "Email already being monitored"}), 400

        new_email = Email(email_address=email_address)
        db_session.add(new_email)
        db_session.commit()

        return jsonify({
            "message": "Email added successfully",
            "email": {
                "id": new_email.id,
                "email": new_email.email_address,
                "risk_score": new_email.risk_score,
                "status": new_email.status,
                "created_at": new_email.created_at.isoformat()
            }
        }), 201

    except Exception as e:
        db_session.rollback()
        return jsonify({"error": str(e)}), 500


# -----------------------
# Get Emails
# -----------------------

@email_bp.route('/emails', methods=['GET'])
def get_emails():
    try:
        emails = db_session.query(Email).all()

        return jsonify([{
            "id": e.id,
            "email": e.email_address,
            "risk_score": e.risk_score,
            "status": e.status,
            "last_checked": e.last_checked.isoformat() if e.last_checked else None,
            "created_at": e.created_at.isoformat()
        } for e in emails]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------
# Delete Email
# -----------------------

@email_bp.route('/emails/<int:email_id>', methods=['DELETE'])
def delete_email(email_id):
    try:
        email = db_session.query(Email).filter_by(id=email_id).first()
        if not email:
            return jsonify({"error": "Email not found"}), 404

        db_session.query(Breach).filter_by(email_id=email_id).delete()
        db_session.delete(email)
        db_session.commit()

        return jsonify({"message": "Email deleted successfully"}), 200

    except Exception as e:
        db_session.rollback()
        return jsonify({"error": str(e)}), 500


# -----------------------
# Stats
# -----------------------

@email_bp.route('/stats', methods=['GET'])
@email_bp.route('/stats/', methods=['GET'])
def get_stats():
    try:
        emails = db_session.query(Email).all()

        total = len(emails)
        compromised = sum(1 for e in emails if e.status == "COMPROMISED")
        safe = sum(1 for e in emails if e.status == "SAFE")

        avg_risk = sum(e.risk_score for e in emails) / total if total > 0 else 0

        return jsonify({
            "totalEmails": total,
            "compromisedCount": compromised,
            "safeCount": safe,
            "overallRiskScore": round(avg_risk, 1)
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------
# Breach Check (Demo Mode)
# -----------------------

@email_bp.route('/emails/<int:email_id>/check', methods=['POST'])
def run_breach_check(email_id):
    try:
        email = db_session.query(Email).filter_by(id=email_id).first()
        if not email:
            return jsonify({"error": "Email not found"}), 404

        email_address = email.email_address.lower()
        breach_found = False
        new_breach_name = None
        new_breach_severity = None
        selected_data = None

        # Demo trigger
        if "breachdemo" in email_address:
            breach_found = True
            new_breach_name = "Dark Web Credential Exposure"
            new_breach_severity = "critical"
            selected_data = "Email, Password"
        else:
            breach_found = random.random() > 0.6

            if breach_found:
                breach_names = ["LinkedIn Leak", "Adobe Breach", "Canva Data Exposure"]
                data_types = ["Email", "Email, Password", "Email, Password, Phone"]

                new_breach_name = random.choice(breach_names)
                selected_data = random.choice(data_types)
                new_breach_severity = "high" if "Password" in selected_data else "medium"

        if breach_found:
            breach = Breach(
                email_id=email.id,
                breach_name=new_breach_name,
                breach_date=datetime.date.today().strftime("%Y-%m-%d"),
                data_types=selected_data,
                severity=new_breach_severity
            )
            db_session.add(breach)

        db_session.commit()

        risk_data = calculate_risk(email.id)

        email.status = risk_data["status"]
        email.risk_score = risk_data["score"]
        email.last_checked = datetime.datetime.utcnow()

        db_session.commit()

        if breach_found:
            from ..services.alert_service import AlertService
            AlertService.send_alert(
                email_obj=email,
                severity=new_breach_severity,
                message=f"Breach detected in {new_breach_name}"
            )

        return jsonify({
            "breaches_found": 1 if breach_found else 0,
            "risk_score": email.risk_score,
            "status": email.status,
            "breach_name": new_breach_name,
            "severity": new_breach_severity
        }), 200

    except Exception as e:
        db_session.rollback()
        return jsonify({"error": str(e)}), 500


# -----------------------
# Monitoring Status
# -----------------------

@email_bp.route('/monitoring/status', methods=['GET'])
def get_monitoring_status():
    return jsonify({"enabled": True}), 200


# -----------------------
# Inject Demo Breach
# -----------------------

@email_bp.route('/emails/<int:email_id>/inject-demo-breach', methods=['POST'])
def inject_demo_breach(email_id):
    try:
        email = db_session.query(Email).filter_by(id=email_id).first()
        if not email:
            return jsonify({"error": "Email not found"}), 404

        # Create guaranteed critical breach
        breach = Breach(
            email_id=email.id,
            breach_name="Dark Web Credential Dump",
            breach_date=datetime.date.today().strftime("%Y-%m-%d"),
            data_types="Email, Password, Financial Data",
            severity="critical"
        )
        db_session.add(breach)
        db_session.commit()

        # Recalculate risk
        risk_data = calculate_risk(email.id)

        email.status = risk_data["status"]
        email.risk_score = risk_data["score"]
        email.last_checked = datetime.datetime.utcnow()

        db_session.commit()

        # Send alert email
        from ..services.alert_service import AlertService
        AlertService.send_alert(
            email_obj=email,
            severity="critical",
            message="Critical breach detected in Dark Web Credential Dump."
        )

        return jsonify({
            "message": "Demo breach injected successfully",
            "risk_score": email.risk_score,
            "status": email.status
        }), 200

    except Exception as e:
        db_session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db_session.remove()