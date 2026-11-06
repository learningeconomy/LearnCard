#!/bin/sh
# Docker build-time installation; never invoked by a request or runtime startup.
set -eu
assets=$1
apt-get update
apt-get install -y --no-install-recommends python3 python3-venv ca-certificates libgomp1 tesseract-ocr tesseract-ocr-all
rm -rf /var/lib/apt/lists/*
python3 -m venv /opt/ai-privacy
/opt/ai-privacy/bin/python -m pip install --no-cache-dir -r "$assets/requirements.txt"
mkdir -p /opt/ai-privacy/assets
cp "$assets/requirements.txt" /opt/ai-privacy/assets/
# Assets are immutable and readable by non-root runtime users.
chmod -R a+rX /opt/ai-privacy
