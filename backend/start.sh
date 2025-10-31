#!/bin/bash

# Benchmind Backend Startup Script for Render

echo "🚀 Starting Benchmind Backend Deployment..."

# Run database migrations
echo "📊 Running database migrations..."
alembic upgrade head

# Initialize database tables if needed
echo "🏗️ Initializing database..."
python init_db.py

# Start the FastAPI server
echo "🌐 Starting FastAPI server..."
exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
