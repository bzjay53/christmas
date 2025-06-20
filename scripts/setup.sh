#!/bin/bash

# Christmas Trading MVP Setup Script
# This script sets up the development environment

set -e

echo "🎄 Christmas Trading MVP Setup"
echo "=============================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p {backend/logs,docker/ssl,scripts}

# Copy environment file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📋 Creating environment file..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your actual configuration values"
else
    echo "✅ Environment file already exists"
fi

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose build

# Start Redis first (dependency)
echo "🔴 Starting Redis..."
docker-compose up -d christmas-redis

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
sleep 5

# Check Redis health
if docker-compose exec christmas-redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis failed to start"
    exit 1
fi

# Start the main application
echo "🚀 Starting Christmas Trading API..."
docker-compose up -d christmas-api

# Wait for API to be ready
echo "⏳ Waiting for API to be ready..."
sleep 10

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
    echo "📋 Checking logs..."
    docker-compose logs christmas-api
    exit 1
fi

# Start nginx
echo "🌐 Starting Nginx reverse proxy..."
docker-compose up -d christmas-nginx

echo ""
echo "🎉 Christmas Trading MVP is now running!"
echo ""
echo "📊 Services:"
echo "  - API: http://localhost:8080"
echo "  - Health: http://localhost:8080/health"
echo "  - Docs: http://localhost:8080/docs"
echo "  - Nginx: http://localhost:80"
echo ""
echo "🔧 Management commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart: docker-compose restart"
echo ""
echo "⚠️  Don't forget to:"
echo "  1. Edit backend/.env with your API keys"
echo "  2. Set up Supabase database"
echo "  3. Configure Telegram bot"
echo "  4. Test with paper trading first"
echo ""