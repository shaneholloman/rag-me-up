#!/bin/bash
set -euo pipefail

# If a .env.mounted file exists (host-mounted config), copy it to .env
# then override Docker-specific values from environment variables.
if [ -f /ragmeup/.env.mounted ]; then
  cp /ragmeup/.env.mounted /ragmeup/.env

  # Override postgres_uri for Docker networking
  if [ -n "${DOCKER_POSTGRES_URI:-}" ]; then
    sed -i "s|^postgres_uri=.*|postgres_uri=\"${DOCKER_POSTGRES_URI}\"|" /ragmeup/.env
  fi

  # Override data_directory for Docker volume
  if [ -n "${DOCKER_DATA_DIRECTORY:-}" ]; then
    sed -i "s|^data_directory=.*|data_directory='${DOCKER_DATA_DIRECTORY}'|" /ragmeup/.env
  fi

  # Force CPU-only mode inside Docker (no CUDA/GPU access)
  sed -i "s|^embedding_cpu=.*|embedding_cpu=True|" /ragmeup/.env
fi

exec gunicorn \
  --bind 0.0.0.0:5000 \
  --workers 1 \
  --threads 4 \
  --worker-class gthread \
  --timeout 600 \
  --graceful-timeout 300 \
  server:app
