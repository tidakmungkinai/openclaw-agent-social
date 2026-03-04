#!/bin/bash
# Clawd Office Chat API - Start/Stop Script
# Port: 18790

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_SCRIPT="${SCRIPT_DIR}/office-chat-api.mjs"
PID_FILE="/tmp/clawd-office-chat-api.pid"
LOG_FILE="/Users/danyarkham/clawd/logs/office-chat-api.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

start() {
    echo "🚀 Starting Clawd Office Chat API Server..."
    
    # Check if already running
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "⚠️  Server already running (PID: $PID)"
            echo "   Use: $0 restart"
            return 1
        else
            rm -f "$PID_FILE"
        fi
    fi
    
    # Check dependencies
    if ! node --version >/dev/null 2>&1; then
        echo "❌ Node.js not found"
        return 1
    fi
    
    # Check express is installed
    if ! node -e "import('express')" 2>/dev/null; then
        echo "📦 Installing express..."
        cd "$SCRIPT_DIR" && npm install express 2>/dev/null || npm install express --prefix "$SCRIPT_DIR" 2>/dev/null
        if [ $? -ne 0 ]; then
            echo "⚠️  Could not install express. Trying global..."
        fi
    fi
    
    # Start server
    nohup node "$API_SCRIPT" > "$LOG_FILE" 2>&1 &
    PID=$!
    
    # Wait a moment to check if it started successfully
    sleep 1
    
    if kill -0 "$PID" 2>/dev/null; then
        echo $PID > "$PID_FILE"
        echo "✅ Server started (PID: $PID)"
        echo "   Port: 18790"
        echo "   Log:  $LOG_FILE"
        echo ""
        echo "   Test: curl http://127.0.0.1:18790/health"
        echo "   Stop: $0 stop"
    else
        echo "❌ Failed to start server"
        echo "   Check logs: $LOG_FILE"
        return 1
    fi
}

stop() {
    echo "🛑 Stopping Clawd Office Chat API Server..."
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID" 2>/dev/null
            sleep 1
            
            # Force kill if still running
            if kill -0 "$PID" 2>/dev/null; then
                echo "   Force killing..."
                kill -9 "$PID" 2>/dev/null
            fi
            
            rm -f "$PID_FILE"
            echo "✅ Server stopped"
        else
            echo "⚠️  Server not running (stale PID file)"
            rm -f "$PID_FILE"
        fi
    else
        # Try to find and kill by port
        PID=$(lsof -t -i:18790 2>/dev/null)
        if [ -n "$PID" ]; then
            kill "$PID" 2>/dev/null
            echo "✅ Server stopped (found on port 18790)"
        else
            echo "❌ No server found running"
        fi
    fi
}

status() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "✅ Server running (PID: $PID)"
            echo "   Port: 18790"
            echo "   Log:  $LOG_FILE"
            echo ""
            echo "📜 Recent logs:"
            tail -5 "$LOG_FILE" 2>/dev/null || echo "   (no log entries yet)"
        else
            echo "❌ Server not running (stale PID file)"
            rm -f "$PID_FILE"
        fi
    else
        # Check if running on port
        PID=$(lsof -t -i:18790 2>/dev/null)
        if [ -n "$PID" ]; then
            echo "✅ Server running on port 18790 (PID: $PID)"
            echo "   ⚠️  No PID file found"
        else
            echo "❌ Server not running"
        fi
    fi
}

logs() {
    echo "📜 Watching logs (Ctrl+C to exit)..."
    tail -f "$LOG_FILE"
}

test_api() {
    echo "🧪 Running API tests..."
    "${SCRIPT_DIR}/test-office-chat-api.sh"
}

# Main command handler
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 1
        start
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    test)
        test_api
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|test}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the API server"
        echo "  stop    - Stop the API server"
        echo "  restart - Restart the API server"
        echo "  status  - Check server status"
        echo "  logs    - Watch logs in real-time"
        echo "  test    - Run test suite"
        exit 1
        ;;
esac
