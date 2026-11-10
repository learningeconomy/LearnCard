#!/bin/sh
# Docker build-time installation; never invoked by a request or runtime startup.
set -eu
assets=$1
# Language packs must match the default AI_PRIVACY_OCR_LANGUAGES in
# services/ai-passport-backend/src/constants/env.ts:
#   eng+spa+fra+deu+por+ita+ara+rus+hin+chi_sim+chi_tra+jpn+kor
# Debian package names use hyphens where Tesseract language codes use underscores.
# Do not install tesseract-ocr-all: it ships every traineddata file and pushed the
# MCP image over Fly's 8 GiB unpack limit (Deploy #2485).
apt-get update
apt-get install -y --no-install-recommends \
    python3 \
    python3-venv \
    ca-certificates \
    libgomp1 \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-spa \
    tesseract-ocr-fra \
    tesseract-ocr-deu \
    tesseract-ocr-por \
    tesseract-ocr-ita \
    tesseract-ocr-ara \
    tesseract-ocr-rus \
    tesseract-ocr-hin \
    tesseract-ocr-chi-sim \
    tesseract-ocr-chi-tra \
    tesseract-ocr-jpn \
    tesseract-ocr-kor
rm -rf /var/lib/apt/lists/*
python3 -m venv /opt/ai-privacy
/opt/ai-privacy/bin/python -m pip install --no-cache-dir -r "$assets/requirements.txt"
mkdir -p /opt/ai-privacy/assets
cp "$assets/requirements.txt" /opt/ai-privacy/assets/
# Assets are immutable and readable by non-root runtime users.
chmod -R a+rX /opt/ai-privacy
