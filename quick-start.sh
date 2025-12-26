#!/bin/bash
# Chat App Quick Start Script
# Run this script to set up both backend and frontend

echo "=========================================="
echo "Chat App - Quick Start Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backend Setup
echo -e "${BLUE}Setting up Backend...${NC}"
cd backend

if [ -f .env ]; then
    echo ".env file already exists"
else
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}Please update backend/.env with your MongoDB URI${NC}"
fi

echo "Installing backend dependencies..."
npm install

echo -e "${GREEN}Backend setup complete!${NC}"
echo "To start backend: cd backend && npm run dev"
echo ""

# Frontend Setup
cd ../frontend

if [ -f .env.local ]; then
    echo ".env.local file already exists"
else
    echo "Creating .env.local from .env.example..."
    cp .env.example .env.local
fi

echo "Installing frontend dependencies..."
npm install

echo -e "${GREEN}Frontend setup complete!${NC}"
echo "To start frontend: cd frontend && npm run dev"
echo ""

echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your MongoDB URI"
echo "2. In terminal 1: cd backend && npm run dev"
echo "3. In terminal 2: cd frontend && npm run dev"
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "Happy chatting! 💬"
