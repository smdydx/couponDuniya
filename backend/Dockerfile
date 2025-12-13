# Multi-stage Dockerfile for FastAPI backend (production optimized)
FROM python:3.13-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100

WORKDIR /build

# System deps (add gcc for any compile needs)
RUN apt-get update && apt-get install -y --no-install-recommends build-essential curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --user -r requirements.txt

# Runtime image
FROM python:3.13-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

# Non-root user
RUN useradd -r -u 1001 -m appuser

# Copy installed packages
COPY --from=builder /root/.local /usr/local

# Copy source (exclude tests via .dockerignore)
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini requirements.txt ./

# Create volume mount points
VOLUME /app/app/images

EXPOSE 8000

USER appuser

# Healthcheck (simple TCP)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD python -c "import socket,sys; s=socket.socket(); s.settimeout(2); s.connect(('127.0.0.1',8000)); s.close()" || exit 1

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
