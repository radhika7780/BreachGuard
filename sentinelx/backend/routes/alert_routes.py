from flask import Blueprint, jsonify

alert_bp = Blueprint('alert', __name__)

@alert_bp.route('/unread-count', methods=['GET'])
def get_unread_count():
    try:
        try:
            from ..database import db_session
            from ..models import Alert
        except ImportError:
            from database import db_session
            from models import Alert
        
        count = db_session.query(Alert).filter_by(is_read=False).count()
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@alert_bp.route('/all', methods=['GET'])
def get_all_alerts():
    return jsonify({"message": "All alerts endpoint"})
