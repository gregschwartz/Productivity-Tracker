#!/bin/bash

# Test setup script for Productivity Tracker

echo "🚀 Testing Productivity Tracker Setup"
echo "======================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

echo "✅ docker-compose is available"

# Check if backend environment file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found. Creating from example..."
    cp backend/env.example backend/.env
    echo "📝 Please edit backend/.env with your API keys before running the application"
fi

echo "✅ Environment configuration checked"

# Build and test backend
echo "🔧 Building backend container..."
docker-compose build backend

if [ $? -eq 0 ]; then
    echo "✅ Backend container built successfully"
else
    echo "❌ Backend container build failed"
    exit 1
fi

# Build and test frontend
echo "🔧 Building frontend container..."
docker-compose build frontend

if [ $? -eq 0 ]; then
    echo "✅ Frontend container built successfully"
else
    echo "❌ Frontend container build failed"
    exit 1
fi

# Test backend health
echo "🏥 Testing backend health..."
docker-compose up -d backend
sleep 5

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy and responding"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend health check failed"
        docker-compose logs backend
        exit 1
    fi
    sleep 1
done

# Test API endpoints
echo "🔍 Testing API endpoints..."

# Test root endpoint
if curl -f http://localhost:8000/ > /dev/null 2>&1; then
    echo "✅ Root endpoint responding"
else
    echo "❌ Root endpoint not responding"
fi

# Test knowledge stats
if curl -f http://localhost:8000/api/knowledge-stats > /dev/null 2>&1; then
    echo "✅ Knowledge stats endpoint responding"
else
    echo "❌ Knowledge stats endpoint not responding"
fi

# Test API documentation
if curl -f http://localhost:8000/docs > /dev/null 2>&1; then
    echo "✅ API documentation accessible"
else
    echo "❌ API documentation not accessible"
fi


echo ""
echo "🎉 Setup completed!"
echo ""
echo "URLs:"
echo "  Frontend:        http://localhost:3000"
echo "  Backend API:     http://localhost:8000"
echo "  API Docs:        http://localhost:8000/docs"
echo ""
echo "To start the application next time:"
echo "  docker-compose up --build"
echo ""
echo "📚 Check README.md for detailed setup instructions" 