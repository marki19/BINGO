#!/bin/bash

# 🎮 BINGO Game - Local Setup Script
# This script will help you set up and run the game locally

set -e

echo "🎮 Welcome to BINGO Game Local Setup!"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 18+ from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js detected: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

echo "✅ npm detected: $(npm --version)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found!"
    echo "Please run this script from the BINGO directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed!"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created!"
    echo ""
    echo "📝 IMPORTANT: Edit .env and set your DATABASE_URL"
    echo "   Example: DATABASE_URL=postgresql://postgres:password@localhost:5432/bingo_game"
    echo ""
    read -p "Press Enter after you've updated .env file..."
fi

# Check if PostgreSQL is accessible
echo "🔍 Testing database connection..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client found"
else
    echo "⚠️  PostgreSQL client not found in PATH"
    echo "   Make sure PostgreSQL is installed or use Docker"
fi
echo ""

echo "🗄️  Running database migration..."
npm run db:push
echo "✅ Database tables created!"
echo ""

echo "🚀 Starting the application..."
echo ""
echo "You need to run BOTH servers:"
echo "  1. Backend server (Terminal 1)"
echo "  2. Frontend dev server (Terminal 2)"
echo ""
echo "Choose an option:"
echo "  1) Start backend only (you'll need to open another terminal for frontend)"
echo "  2) Show commands to copy/paste (for manual start)"
echo "  3) Exit"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🟢 Starting backend server..."
        echo "   After this starts, open a NEW TERMINAL and run:"
        echo "   npm run dev:client"
        echo ""
        npm run dev
        ;;
    2)
        echo ""
        echo "📋 Copy these commands:"
        echo ""
        echo "Terminal 1 (Backend):"
        echo "  npm run dev"
        echo ""
        echo "Terminal 2 (Frontend):"
        echo "  npm run dev:client"
        echo ""
        echo "Then open browser to: http://localhost:5000"
        echo ""
        ;;
    3)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
