#!/bin/bash
# =============================================
# follow-fs04-mqtt-worker-logs.sh
# Stream fs04-mqtt-worker pod logs continuously
# Supports selecting dev or prod context
# =============================================

# Usage: ./follow-fs04-mqtt-worker-logs.sh [dev|prod]
ENVIRONMENT=${1:-dev}

# Namespace (same for both)
NAMESPACE="fs04"

# Choose context based on environment
if [[ "$ENVIRONMENT" == "prod" ]]; then
  CONTEXT="gcp-iot-prod"
else
  CONTEXT="gke_cs-poc-vlkpvg5seziflnwq2ni7x3l_us-central1-a_dr-iot-dev"
fi

echo "🌐 Switching to Kubernetes context: $CONTEXT"
kubectl config use-context "$CONTEXT" >/dev/null 2>&1

if [[ $? -ne 0 ]]; then
  echo "❌ Failed to switch to context $CONTEXT"
  exit 1
fi

echo "🔍 Finding fs04-mqtt-worker pod in namespace: $NAMESPACE..."
POD_NAME=$(kubectl get pods -n "$NAMESPACE" -o name | grep fs04-mqtt-worker | head -n 1)

if [ -z "$POD_NAME" ]; then
  echo "❌ No fs04-mqtt-worker pod found in namespace $NAMESPACE"
  exit 1
fi

echo "✅ Found pod: $POD_NAME"
echo "📜 Streaming logs (press Ctrl + C to stop)..."
echo "---------------------------------------------"

kubectl logs -n "$NAMESPACE" -f "$POD_NAME" 2>&1 \
  | grep -v -E '\$events/client/(connected|disconnected)' \
  | grep -v -E '(bundle:waveStatus|Processing queued notification.*bundle|Successfully sent notification.*bundle)'
