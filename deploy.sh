#!/bin/bash

# --- CONFIGURATION --- Sir please change app directory accordingly
APP_DIR="/Users/Intern/osrm_distance"       
OSRM_DATA="southern-india-latest.osrm"           
FLASK_APP_FILE="app.py"                       
FLASK_PORT=8000
OSRM_PORT=5000
live_server_port=5502

echo "[INFO] Activating virtual environment..."
cd "$APP_DIR" || exit
source venv/bin/activate

echo "[INFO] Starting Flask app on port $FLASK_PORT..."
nohup flask run --host=0.0.0.0 --port=$FLASK_PORT > flask.log 2>&1 &

echo "[INFO] Starting OSRM routed server on port $OSRM_PORT..."
docker run -d -p $OSRM_PORT:$OSRM_PORT -v ${APP_DIR}:/data osrm/osrm-backend \
  osrm-routed --algorithm mld /data/${OSRM_DATA}

echo "[SUCCESS] Deployment complete. App is at http://<server-ip>:$FLASK_PORT/"
