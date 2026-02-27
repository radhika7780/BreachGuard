import os

# Project Root
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATABASE_DIR = os.path.join(BASE_DIR, "database")
DATABASE_PATH = os.path.join(DATABASE_DIR, "sentinelx.db")

# Ensure database directory exists
os.makedirs(DATABASE_DIR, exist_ok=True)


class Config:
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or f"sqlite:///{DATABASE_PATH}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get("SECRET_KEY") or "super-secret-key"

    # SMTP Settings (Gmail)
    SMTP_EMAIL = os.environ.get("SMTP_EMAIL", "jessani.radhika@gmail.com")
    SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "vaaqoylwjzmulqtx")
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 465