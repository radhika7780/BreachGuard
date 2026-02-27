from flask import Blueprint, jsonify

email_bp = Blueprint('email', __name__)

@email_bp.route('/check', methods=['POST'])
def check_email():
    return jsonify({"message": "Email check endpoint"})
