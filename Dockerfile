# Multi-stage Dockerfile for Productivity Tracker

# Frontend build stage
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./
RUN npm ci --only=production

# Copy source code and build
COPY frontend/src/ ./src/
COPY frontend/public/ ./public/
RUN npm run build

# Backend stage
FROM python:3.11-slim AS backend

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ .

# Create directories for ChromaDB and logs
RUN mkdir -p ./chromadb ./logs

# Copy frontend build from previous stage
COPY --from=frontend-build /app/frontend/build ./static

# Expose port
EXPOSE 8000

# Environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV CHROMA_PERSIST_DIRECTORY=/app/chromadb

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["sh", "-c", "python -m scripts.wait_for_db && uvicorn main:app --host 0.0.0.0 --port 8000"]