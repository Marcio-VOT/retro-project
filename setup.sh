#!/bin/bash

echo "🚀 Setting up Retro Project..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start infrastructure services
echo "📦 Starting infrastructure services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Setup Go backend
echo "🔧 Setting up Go backend..."
cd server

# Initialize Go module and install dependencies
go mod tidy

# Create config directory if it doesn't exist
mkdir -p config

# Run migrations
echo "🗄️ Running database migrations..."
go run cmd/migrate/main.go

cd ..

# Setup Next.js frontend
echo "⚛️ Setting up Next.js frontend..."
cd client

# Install dependencies
npm install

# Create necessary directories
mkdir -p src/components/ui
mkdir -p src/hooks
mkdir -p src/stores
mkdir -p src/types
mkdir -p src/lib

cd ..

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start the backend: cd server && go run cmd/server/main.go"
echo "2. Start the frontend: cd client && npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 Available services:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8080"
echo "- PostgreSQL: localhost:5432"
echo "- Redis: localhost:6379"
echo "- pgAdmin: http://localhost:5050 (admin@retro.com / admin)"
echo ""
echo "🔧 Development commands:"
echo "- Backend: cd server && go run cmd/server/main.go"
echo "- Frontend: cd client && npm run dev"
echo "- Migrations: cd server && go run cmd/migrate/main.go" 