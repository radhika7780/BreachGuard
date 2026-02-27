from flask import Blueprint, jsonify

alert_bp = Blueprint('alert', __name__)

@alert_bp.route('/all', methods=['GET'])
def get_all_alerts():
    return jsonify({"message": "All alerts endpoint"})
