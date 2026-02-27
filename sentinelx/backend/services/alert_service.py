import smtplib
import datetime
from email.mime.text import MIMEText

try:
    from ..database import db_session
    from ..models import Alert
    from ..config import Config
except ImportError:
    from database import db_session
    from models import Alert
    from config import Config


class AlertService:

    @staticmethod
    def send_alert(email_obj, severity, message):
        # 1️⃣ Save alert in DB
        alert = Alert(
            email_id=email_obj.id,
            severity=severity,
            message=message,
            is_read=False,
            created_at=datetime.datetime.utcnow()
        )
        db_session.add(alert)
        db_session.commit()

        # 2️⃣ STRICT Gmail Send
        if not Config.SMTP_EMAIL or not Config.SMTP_PASSWORD:
            raise Exception("SMTP credentials not configured")

        subject = "🚨 SentinelX Security Alert"

        body = f"""
SentinelX Security Alert

Email: {email_obj.email_address}
Severity: {severity.upper()}
Risk Score: {email_obj.risk_score}

Details:
{message}

Recommended Actions:
- Reset password immediately
- Enable 2FA
- Check linked financial accounts

SentinelX Monitoring System
"""

        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = Config.SMTP_EMAIL
        msg["To"] = email_obj.email_address

        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(Config.SMTP_EMAIL, Config.SMTP_PASSWORD)
                server.send_message(msg)

            print("✅ Gmail Alert Sent Successfully")

        except Exception as e:
            print("❌ Gmail Send Failed:", str(e))
            raise