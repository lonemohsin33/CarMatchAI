#!/bin/sh
set -e
python <<'PY'
import os, time, socket

host = os.environ.get("PGHOST", "db")
port = int(os.environ.get("PGPORT", "5432"))
for i in range(60):
    try:
        s = socket.create_connection((host, port), timeout=2)
        s.close()
        break
    except OSError:
        time.sleep(1)
else:
    raise SystemExit("PostgreSQL did not become ready in time")
PY
cd /app
python seed_database.py
exec gunicorn --bind 0.0.0.0:5000 --workers 2 wsgi:app
