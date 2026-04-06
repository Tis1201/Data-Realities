#!/bin/bash
# Port forward script for ClickHouse pod (runs in background)
# Forwards clickhouse-0 pod port 8123 to localhost:8123

POD_NAME="clickhouse-0"
NAMESPACE="fs04"
LOCAL_PORT="8123"
POD_PORT="8123"
LOG_FILE="/tmp/clickhouse-port-forward.log"
PID_FILE="/tmp/clickhouse-port-forward.pid"

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "Port forward is already running (PID: $OLD_PID)"
        echo "To stop it, run: kill $OLD_PID"
        exit 1
    else
        # Clean up stale PID file
        rm -f "$PID_FILE"
    fi
fi

echo "Starting ClickHouse port forward in background..."
echo "Pod: ${POD_NAME} (${NAMESPACE})"
echo "Forwarding: localhost:${LOCAL_PORT} -> ${POD_NAME}:${POD_PORT}"
echo "Log file: ${LOG_FILE}"
echo "PID file: ${PID_FILE}"
echo ""

# Start port forward in background
kubectl port-forward -n ${NAMESPACE} ${POD_NAME} ${LOCAL_PORT}:${POD_PORT} > "$LOG_FILE" 2>&1 &
PF_PID=$!

# Save PID
echo $PF_PID > "$PID_FILE"

# Wait a moment to check if it started successfully
sleep 2

if ps -p "$PF_PID" > /dev/null 2>&1; then
    echo "✓ Port forward started successfully (PID: $PF_PID)"
    echo ""
    echo "ClickHouse is now available at: http://localhost:${LOCAL_PORT}"
    echo ""
    echo "To stop the port forward, run:"
    echo "  kill $PF_PID"
    echo "or"
    echo "  ./stop-clickhouse-port-forward.sh"
else
    echo "✗ Failed to start port forward"
    echo "Check log file: $LOG_FILE"
    cat "$LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi

