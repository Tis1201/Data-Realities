#!/bin/bash
# Port forward script for ClickHouse pod
# Forwards clickhouse-0 pod port 8123 to localhost:8123

set -e

POD_NAME="clickhouse-0"
NAMESPACE="fs04"
LOCAL_PORT="8123"
POD_PORT="8123"

echo "Forwarding ClickHouse pod ${POD_NAME} (port ${POD_PORT}) to localhost:${LOCAL_PORT}..."
echo "Press Ctrl+C to stop"
echo ""

kubectl port-forward -n ${NAMESPACE} ${POD_NAME} ${LOCAL_PORT}:${POD_PORT}

