import os

class Config:
    SECRET_KEY = os.environ.get("SESSION_SECRET", "dev-key-Shanaia_Baghirathi!@#$!$@#$")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
    UPLOAD_FOLDER = 'uploads'
    OSRM_SERVER = os.environ.get('OSRM_SERVER', 'http://localhost:5000')
    