try:
    from ..database import db_session
    from ..models import Breach
except ImportError:
    from database import db_session
    from models import Breach

def calculate_risk(email_id):
    """
    Computes a cumulative risk score for an email based on its breach history.
    """
    try:
        # Query all breaches for the given email
        breaches = db_session.query(Breach).filter_by(email_id=email_id).all()
        
        score = 0
        
        for breach in breaches:
            # 1. Base score based on severity
            severity = (breach.severity or "").lower()
            if severity == "critical":
                score += 50
            elif severity == "high":
                score += 35
            elif severity == "medium":
                score += 20
                
            # 2. Additional score based on sensitive data leaked
            data_leaked = breach.data_types or ""
            if "Password" in data_leaked:
                score += 20
            if "Phone" in data_leaked:
                score += 10
        
        # Cap score at 100
        score = min(score, 100)
        
        # Determine status based on score
        if score >= 70:
            status = "COMPROMISED"
        elif score >= 40:
            status = "AT RISK"
        else:
            status = "SAFE"
            
        return {
            "score": float(score),
            "status": status
        }
        
    except Exception as e:
        print(f"Error calculating risk for email {email_id}: {e}")
        return {
            "score": 0.0,
            "status": "SAFE"
        }
