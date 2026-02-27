from flask import Blueprint, jsonify

breach_bp = Blueprint('breach', __name__)

@breach_bp.route('/latest', methods=['GET'])
def get_latest_breaches():
    return jsonify({"message": "Latest breaches endpoint"})
