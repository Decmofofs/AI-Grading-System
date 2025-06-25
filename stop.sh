#!/bin/bash
# AI Grading System - Stop Script for macOS/Linux
# ===============================================

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

echo -e "${RED}AI Grading System - Stop Script${NC}"
echo -e "${RED}===============================${NC}"
echo ""

# Function to stop services by PID
stop_by_pid() {
    if [ ! -f "$PID_FILE" ]; then
        echo -e "${YELLOW}[INFO] No PID file found, attempting to find processes by name...${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}[STOP] Stopping services using PID file...${NC}"
    
    while IFS=':' read -r service_name pid; do
        if [ -n "$service_name" ] && [ -n "$pid" ]; then
            echo -e "${YELLOW}[STOP] Stopping $service_name (PID: $pid)...${NC}"
            
            # Check if process is still running
            if kill -0 "$pid" 2>/dev/null; then
                # Try graceful shutdown first
                kill -TERM "$pid" 2>/dev/null
                sleep 2
                
                # Check if process is still running
                if kill -0 "$pid" 2>/dev/null; then
                    echo -e "${YELLOW}[FORCE] Force killing $service_name (PID: $pid)...${NC}"
                    kill -KILL "$pid" 2>/dev/null
                fi
                
                echo -e "${GREEN}[STOPPED] $service_name${NC}"
            else
                echo -e "${GRAY}[SKIP] $service_name (PID: $pid) not running${NC}"
            fi
        fi
    done < "$PID_FILE"
    
    # Remove PID file
    rm -f "$PID_FILE"
    echo -e "${GREEN}[CLEANUP] PID file removed${NC}"
    return 0
}

# Function to stop services by port
stop_by_port() {
    echo -e "${YELLOW}[STOP] Stopping services by port...${NC}"
    
    ports=(3000 5001 5173)
    service_names=("Grading Service" "Conversion Service" "Frontend")
    
    for i in "${!ports[@]}"; do
        port="${ports[$i]}"
        service_name="${service_names[$i]}"
        
        echo -e "${YELLOW}[CHECK] Checking port $port ($service_name)...${NC}"
        
        # Find process using the port
        if command -v lsof &> /dev/null; then
            # Use lsof (macOS and many Linux distributions)
            pids=$(lsof -ti :$port 2>/dev/null)
        elif command -v netstat &> /dev/null && command -v awk &> /dev/null; then
            # Use netstat + awk (fallback for systems without lsof)
            pids=$(netstat -tlnp 2>/dev/null | awk "\$4 ~ /:$port\$/ {split(\$7,a,\"/\"); print a[1]}" | grep -v "^$")
        else
            echo -e "${YELLOW}[SKIP] Cannot check port $port (lsof/netstat not available)${NC}"
            continue
        fi
        
        if [ -n "$pids" ]; then
            for pid in $pids; do
                if [ -n "$pid" ] && [ "$pid" != "-" ]; then
                    echo -e "${YELLOW}[STOP] Stopping $service_name (PID: $pid, Port: $port)...${NC}"
                    
                    # Try graceful shutdown first
                    kill -TERM "$pid" 2>/dev/null
                    sleep 1
                    
                    # Check if process is still running
                    if kill -0 "$pid" 2>/dev/null; then
                        echo -e "${YELLOW}[FORCE] Force killing $service_name (PID: $pid)...${NC}"
                        kill -KILL "$pid" 2>/dev/null
                    fi
                    
                    echo -e "${GREEN}[STOPPED] $service_name (Port: $port)${NC}"
                fi
            done
        else
            echo -e "${GRAY}[SKIP] No process found on port $port${NC}"
        fi
    done
}

# Function to stop Node.js processes related to the project
stop_node_processes() {
    echo -e "${YELLOW}[STOP] Looking for Node.js processes related to AI Grading System...${NC}"
    
    # Find Node.js processes that might be related to our project
    if command -v pgrep &> /dev/null; then
        # Look for node processes with our project paths
        project_processes=$(pgrep -f "node.*grading\|node.*conversion\|node.*frontend" 2>/dev/null)
        
        if [ -n "$project_processes" ]; then
            echo -e "${YELLOW}[FOUND] Project-related Node.js processes:${NC}"
            for pid in $project_processes; do
                # Get process info
                if command -v ps &> /dev/null; then
                    process_info=$(ps -p "$pid" -o pid,ppid,cmd --no-headers 2>/dev/null)
                    if [ -n "$process_info" ]; then
                        echo -e "${GRAY}   PID $pid: $(echo "$process_info" | awk '{$1=$2=""; print $0}' | sed 's/^ *//')${NC}"
                        
                        # Kill the process
                        kill -TERM "$pid" 2>/dev/null
                        sleep 1
                        
                        # Force kill if still running
                        if kill -0 "$pid" 2>/dev/null; then
                            kill -KILL "$pid" 2>/dev/null
                        fi
                        
                        echo -e "${GREEN}[STOPPED] Process $pid${NC}"
                    fi
                fi
            done
        else
            echo -e "${GRAY}[SKIP] No project-related Node.js processes found${NC}"
        fi
    else
        echo -e "${YELLOW}[SKIP] pgrep not available, cannot search for project processes${NC}"
    fi
}

# Function to clean up log files (optional)
cleanup_logs() {
    echo ""
    echo -e "${CYAN}[CLEANUP] Do you want to clean up log files? (y/N):${NC}"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        if [ -d "logs" ]; then
            echo -e "${YELLOW}[CLEANUP] Removing log files...${NC}"
            rm -f logs/*.log
            echo -e "${GREEN}[CLEANUP] Log files removed${NC}"
        else
            echo -e "${GRAY}[SKIP] No logs directory found${NC}"
        fi
    else
        echo -e "${GRAY}[SKIP] Log files preserved${NC}"
    fi
}

# Main execution
main() {
    echo -e "${YELLOW}[INFO] Attempting to stop AI Grading System services...${NC}"
    echo ""
    
    # Method 1: Try to stop using PID file
    if ! stop_by_pid; then
        echo ""
        # Method 2: Stop by port
        stop_by_port
        echo ""
        # Method 3: Stop Node.js processes that might be related
        stop_node_processes
    fi
    
    echo ""
    echo -e "${GREEN}[COMPLETE] Stop process completed${NC}"
    
    # Optional cleanup
    cleanup_logs
    
    echo ""
    echo -e "${CYAN}[INFO] Verification commands:${NC}"
    echo -e "${GRAY}   Check ports: netstat -an | grep -E ':3000|:5001|:5173'${NC}"
    echo -e "${GRAY}   Check processes: ps aux | grep node${NC}"
    echo ""
    echo -e "${GREEN}[DONE] All services should be stopped${NC}"
}

# Run main function
main
