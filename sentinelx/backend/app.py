from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

try:
    from .database import init_db, db_session
    from .routes.email_routes import email_bp
    from .routes.breach_routes import breach_bp
    from .routes.alert_routes import alert_bp
except ImportError:
    from database import init_db, db_session
    from routes.email_routes import email_bp
    from routes.breach_routes import breach_bp
    from routes.alert_routes import alert_bp

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Register Blueprints
app.register_blueprint(email_bp, url_prefix='/api')
app.register_blueprint(breach_bp, url_prefix='/api')
app.register_blueprint(alert_bp, url_prefix='/api/alerts')

@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()

# -----------------------------
# BASIC HEALTH CHECK ROUTE
# -----------------------------

@app.route("/api/health")
def health_check():
    return jsonify({
        "status": "SentinelX Backend Running",
        "version": "1.0.0",
        "environment": "development"
    })


# -----------------------------
# FRONTEND SERVING
# -----------------------------

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)


# -----------------------------
# START SERVER
# -----------------------------

if __name__ == "__main__":
    print("🚀 Initializing Database...")
    init_db()
    print("🚀 Starting SentinelX Backend...")
    app.run(debug=True, port=5000)