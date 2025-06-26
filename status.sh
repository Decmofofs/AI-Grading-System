#!/bin/bash
# AI Grading System - Status Check Script
# =======================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# PID file location
PID_FILE="$PWD/.ai-grading-pids"

echo -e "${CYAN}AI Grading System - Status Check${NC}"
echo -e "${CYAN}================================${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    local port=$1
    local service_name=$2
    
    if command -v lsof &> /dev/null; then
        local result=$(lsof -i :$port 2>/dev/null)
        if [ -n "$result" ]; then
            local pid=$(echo "$result" | awk 'NR==2 {print $2}')
            echo -e "${GREEN}[RUNNING] $service_name (Port: $port, PID: $pid)${NC}"
            return 0
        else
            echo -e "${RED}[STOPPED] $service_name (Port: $port)${NC}"
            return 1
        fi
    elif command -v netstat &> /dev/null; then
        if netstat -an | grep -q ":$port "; then
            echo -e "${GREEN}[RUNNING] $service_name (Port: $port)${NC}"
            return 0
        else
            echo -e "${RED}[STOPPED] $service_name (Port: $port)${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}[UNKNOWN] $service_name (Port: $port) - Cannot check (lsof/netstat not available)${NC}"
        return 2
    fi
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local url=$2
    
    if command -v curl &> /dev/null; then
        if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}[HEALTHY] $service_name${NC}"
            return 0
        else
            echo -e "${RED}[UNHEALTHY] $service_name${NC}"
            return 1
        fi
    elif command -v wget &> /dev/null; then
        if wget -q --timeout=5 --tries=1 "$url" -O /dev/null 2>&1; then
            echo -e "${GREEN}[HEALTHY] $service_name${NC}"
            return 0
        else
            echo -e "${RED}[UNHEALTHY] $service_name${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}[SKIP] Cannot check $service_name health (curl/wget not available)${NC}"
        return 2
    fi
}

# Function to get server IP addresses
get_server_ip() {
    # Get local network IP
    if command -v ip &> /dev/null; then
        LOCAL_IP=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'src \K\S+' | head -1)
    elif command -v ifconfig &> /dev/null; then
        LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
    fi
    
    echo "$LOCAL_IP"
}

# Main status check
main() {
    echo -e "${YELLOW}[CHECK] Checking service status...${NC}"
    echo ""
    
    # Check port status
    echo -e "${CYAN}Port Status:${NC}"
    running_services=0
    
    if check_port 3000 "Grading Service"; then
        ((running_services++))
    fi
    
    if check_port 5001 "Conversion Service"; then
        ((running_services++))
    fi
    
    if check_port 5173 "Frontend Service"; then
        ((running_services++))
    fi
    
    echo ""
    
    # Check service health
    if [ $running_services -gt 0 ]; then
        echo -e "${CYAN}Health Check:${NC}"
        check_service_health "Grading Service" "http://localhost:3000/health"
        check_service_health "Conversion Service" "http://localhost:5001/health"
        echo ""
    fi
    
    # Show access URLs if services are running
    if [ $running_services -gt 0 ]; then
        LOCAL_IP=$(get_server_ip)
        
        echo -e "${CYAN}Access URLs:${NC}"
        echo -e "${WHITE}   Local:    http://localhost:5173${NC}"
        
        if [ -n "$LOCAL_IP" ]; then
            echo -e "${WHITE}   Network:  http://$LOCAL_IP:5173${NC}"
        fi
        echo ""
    fi
    
    # Show PID file info
    if [ -f "$PID_FILE" ]; then
        echo -e "${CYAN}PID File Status:${NC}"
        echo -e "${GREEN}[EXISTS] $PID_FILE${NC}"
        while IFS=':' read -r service_name pid; do
            if [ -n "$service_name" ] && [ -n "$pid" ]; then
                if kill -0 "$pid" 2>/dev/null; then
                    echo -e "${GREEN}   $service_name: PID $pid (Running)${NC}"
                else
                    echo -e "${RED}   $service_name: PID $pid (Not Running)${NC}"
                fi
            fi
        done < "$PID_FILE"
    else
        echo -e "${YELLOW}[INFO] No PID file found${NC}"
    fi
    
    echo ""
    
    # Summary
    if [ $running_services -eq 3 ]; then
        echo -e "${GREEN}[STATUS] All services are running!${NC}"
    elif [ $running_services -gt 0 ]; then
        echo -e "${YELLOW}[STATUS] $running_services/3 services are running${NC}"
    else
        echo -e "${RED}[STATUS] No services are running${NC}"
        echo -e "${GRAY}   To start services: ./start.sh${NC}"
    fi
    
    echo ""
    echo -e "${GRAY}   To stop services: ./stop.sh${NC}"
    echo -e "${GRAY}   Log files: ./logs/${NC}"
}

# Run main function
main
