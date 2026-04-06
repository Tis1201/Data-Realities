#!/bin/bash
# Stop the ClickHouse port forward process

PID_FILE="/tmp/clickhouse-port-forward.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "No port forward process found (PID file doesn't exist)"
    exit 1
fi

PID=$(cat "$PID_FILE")

if ! ps -p "$PID" > /dev/null 2>&1; then
    echo "Port forward process (PID: $PID) is not running"
    rm -f "$PID_FILE"
    exit 1
fi

echo "Stopping ClickHouse port forward (PID: $PID)..."
kill "$PID"

# Wait a moment and check if it's stopped
sleep 1

if ps -p "$PID" > /dev/null 2>&1; then
    echo "Process still running, forcing kill..."
    kill -9 "$PID"
fi

rm -f "$PID_FILE"
echo "✓ Port forward stopped"

