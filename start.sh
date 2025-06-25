#!/bin/bash
# AI Grading System - Bash Start Script for macOS/Linux
# ====================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# PID file to track running services
PID_FILE="$PWD/.ai-grading-pids"

echo -e "${GREEN}AI Grading System - Start Script (Bash)${NC}"
echo -e "${GREEN}=======================================${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}[CHECK] Checking prerequisites...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}[ERROR] Node.js not found, please install Node.js first${NC}"
        exit 1
    fi
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}[OK] Node.js installed: $NODE_VERSION${NC}"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}[ERROR] npm not found, please install npm first${NC}"
        exit 1
    fi
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}[OK] npm installed: $NPM_VERSION${NC}"
    
    # Check Tesseract (optional but recommended)
    if command -v tesseract &> /dev/null; then
        TESSERACT_VERSION=$(tesseract --version | head -1)
        echo -e "${GREEN}[OK] Tesseract installed: $TESSERACT_VERSION${NC}"
        
        # Check for Chinese language pack
        if tesseract --list-langs | grep -q "chi_sim"; then
            echo -e "${GREEN}[OK] Chinese language pack (chi_sim) available${NC}"
        else
            echo -e "${YELLOW}[WARNING] Chinese language pack (chi_sim) not found${NC}"
            echo -e "${YELLOW}          OCR may not work for Chinese text${NC}"
        fi
    else
        echo -e "${YELLOW}[WARNING] Tesseract not found, OCR features will be limited${NC}"
        echo -e "${YELLOW}          Please install Tesseract for better image text recognition${NC}"
    fi
    
    echo ""
}

# Function to initialize directories
initialize_directories() {
    if [ ! -d "logs" ]; then
        mkdir logs
        echo -e "${CYAN}[CREATE] logs directory${NC}"
    fi
}

# Function to check if port is in use
check_port() {
    local port=$1
    if command -v lsof &> /dev/null; then
        lsof -i :$port &> /dev/null
    elif command -v netstat &> /dev/null; then
        netstat -an | grep -q ":$port "
    else
        # If neither lsof nor netstat is available, assume port is free
        return 1
    fi
}

# Function to start a service
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3
    
    echo -e "${YELLOW}[START] $service_name (Port: $port)...${NC}"
    
    # Check if service directory exists
    if [ ! -d "$service_path" ]; then
        echo -e "${RED}[ERROR] Service directory '$service_path' not found${NC}"
        exit 1
    fi
    
    cd "$service_path"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo -e "${RED}[ERROR] package.json not found in $service_path${NC}"
        cd ..
        exit 1
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo -e "${CYAN}[INSTALL] Installing $service_name dependencies...${NC}"
        npm install
        if [ $? -ne 0 ]; then
            echo -e "${RED}[ERROR] $service_name dependency installation failed${NC}"
            cd ..
            exit 1
        fi
    fi
    
    # Build TypeScript projects
    if [ -f "tsconfig.json" ]; then
        echo -e "${CYAN}[BUILD] Building $service_name...${NC}"
        npm run build
        if [ $? -ne 0 ]; then
            echo -e "${RED}[ERROR] $service_name build failed${NC}"
            cd ..
            exit 1
        fi
    fi
    
    # Start service in background
    echo -e "${CYAN}[LAUNCH] Starting $service_name...${NC}"
    nohup npm run dev > "../logs/${service_name,,}.log" 2>&1 &
    local pid=$!
    
    # Save PID for later cleanup
    echo "$service_name:$pid" >> "../$PID_FILE"
    
    echo -e "${GREEN}[SUCCESS] $service_name started (PID: $pid)${NC}"
    
    cd ..
    sleep 2
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local url=$2
    
    if command -v curl &> /dev/null; then
        if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}[HEALTHY] $service_name : OK${NC}"
        else
            echo -e "${YELLOW}[WARNING] $service_name : Unhealthy (may still be starting)${NC}"
        fi
    elif command -v wget &> /dev/null; then
        if wget -q --timeout=5 --tries=1 "$url" -O /dev/null 2>&1; then
            echo -e "${GREEN}[HEALTHY] $service_name : OK${NC}"
        else
            echo -e "${YELLOW}[WARNING] $service_name : Unhealthy (may still be starting)${NC}"
        fi
    else
        echo -e "${YELLOW}[SKIP] Cannot check $service_name health (curl/wget not available)${NC}"
    fi
}

# Function to cleanup on exit
cleanup_on_exit() {
    echo ""
    echo -e "${YELLOW}[CLEANUP] Cleaning up...${NC}"
    if [ -f "$PID_FILE" ]; then
        rm -f "$PID_FILE"
    fi
    exit 0
}

# Trap Ctrl+C
trap cleanup_on_exit INT

# Main execution
main() {
    # Clean up any existing PID file
    if [ -f "$PID_FILE" ]; then
        rm -f "$PID_FILE"
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Initialize directories
    initialize_directories
    
    echo -e "${YELLOW}[PREPARE] Preparing to start services...${NC}"
    echo ""
    
    # Check port occupation
    ports=(3000 5001 5173)
    services=("Grading Service" "Conversion Service" "Frontend")
    
    for i in "${!ports[@]}"; do
        if check_port "${ports[$i]}"; then
            echo -e "${YELLOW}[WARNING] Port ${ports[$i]} is occupied (${services[$i]})${NC}"
        fi
    done
    
    echo ""
    
    # Start services
    start_service "Grading-Service" "grading" 3000
    start_service "Conversion-Service" "conversion" 5001
    start_service "Frontend" "frontend" 5173
    
    echo ""
    echo -e "${GREEN}[COMPLETE] All services started!${NC}"
    echo ""
    echo -e "${CYAN}[ADDRESSES] Service URLs:${NC}"
    echo -e "${WHITE}   Grading Service:    http://localhost:3000${NC}"
    echo -e "${WHITE}   Conversion Service: http://localhost:5001${NC}"
    echo -e "${WHITE}   Frontend:           http://localhost:5173${NC}"
    echo ""
    
    echo -e "${YELLOW}[WAIT] Waiting for services to start...${NC}"
    sleep 8
    
    echo ""
    echo -e "${YELLOW}[HEALTH] Checking service health...${NC}"
    
    # Check service health
    check_service_health "Grading Service" "http://localhost:3000/health"
    check_service_health "Conversion Service" "http://localhost:5001/health"
    
    echo ""
    echo -e "${CYAN}[ACCESS] Please visit in browser: http://localhost:5173${NC}"
    echo -e "${GREEN}[READY] System is ready!${NC}"
    echo ""
    echo -e "${CYAN}[INFO] Instructions:${NC}"
    echo -e "${GRAY}   - Services are running in the background${NC}"
    echo -e "${GRAY}   - To stop all services, run: ./stop.sh${NC}"
    echo -e "${GRAY}   - Service logs are in ./logs/ directory${NC}"
    echo -e "${GRAY}   - PID file location: $PID_FILE${NC}"
    echo ""
    
    # On macOS, optionally open browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${YELLOW}[MACOS] Opening browser in 3 seconds... (Press Ctrl+C to cancel)${NC}"
        sleep 3
        open "http://localhost:5173" 2>/dev/null || true
    fi
    
    echo -e "${WHITE}Press Ctrl+C to exit this script (services will continue running)${NC}"
    
    # Keep script running until user interrupts
    while true; do
        sleep 1
    done
}

# Run main function
main
