#!/bin/bash

# Schulolympiade Dashboard - Development Startup Script
# This script helps start all services for local development

set -e

echo "🚀 Schulolympiade Dashboard - Development Mode"
echo "=============================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env created. Please edit it with your configuration."
    echo ""
    read -p "Press Enter to continue after editing .env, or Ctrl+C to exit..."
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Create data directories if they don't exist
echo "📁 Creating data directories..."
mkdir -p dashboard/public/data
mkdir -p docker/mysql-backups
mkdir -p logs

echo ""
echo "🔧 Starting services..."
echo ""
echo "Available services:"
echo "  1. Dashboard (port 3000)"
echo "  2. Edit Data Dashboard (port 3003)"
echo "  3. Edit Emoji Dashboard (port 3004)"
echo "  4. Success Emoji (port 3005)"
echo "  5. Success Event (port 3006)"
echo "  6. IP Logging (port 3007)"
echo "  7. All services with Docker"
echo ""

read -p "Which service do you want to start? (1-7): " choice

case $choice in
    1)
        echo "Starting Dashboard..."
        node dashboard/server.js
        ;;
    2)
        echo "Starting Edit Data Dashboard..."
        node edit-data-dashboard/server.js
        ;;
    3)
        echo "Starting Edit Emoji Dashboard..."
        node edit-emoji-dashboard/server.js
        ;;
    4)
        echo "Starting Success Emoji..."
        node success-emoji/server.js
        ;;
    5)
        echo "Starting Success Event..."
        node success-event/server.js
        ;;
    6)
        echo "Starting IP Logging..."
        node ip-logging/server.js
        ;;
    7)
        echo "Starting all services with Docker..."
        if ! command -v docker-compose &> /dev/null; then
            echo "❌ docker-compose not found. Please install Docker and Docker Compose."
            exit 1
        fi
        docker-compose up -d --build
        echo ""
        echo "✅ All services started!"
        echo ""
        echo "Access points:"
        echo "  - Dashboard: http://localhost:3000"
        echo "  - Edit Data: http://localhost:3003"
        echo "  - Edit Emoji: http://localhost:3004"
        echo "  - phpMyAdmin: http://localhost:8080"
        echo "  - CloudBeaver: http://localhost:8081"
        echo ""
        echo "View logs: docker-compose logs -f"
        echo "Stop services: docker-compose down"
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac
