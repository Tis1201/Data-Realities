#!/bin/bash
# =============================================
# follow-fs04-web-v2-logs.sh
# Stream fs04-web-v2 pod logs continuously
# Same as follow-fs04-web-logs.sh but for fs04-web-v2 (ReplicaSet fs04-web-v2-*)
# Supports selecting dev or prod context
# =============================================

# Usage: ./follow-fs04-web-v2-logs.sh [dev|prod]
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

echo "🔍 Finding fs04-web-v2 pod in namespace: $NAMESPACE..."
POD_NAME=$(kubectl get pods -n "$NAMESPACE" -o name | grep fs04-web-v2 | head -n 1)

if [ -z "$POD_NAME" ]; then
  echo "❌ No fs04-web-v2 pod found in namespace $NAMESPACE"
  exit 1
fi

echo "✅ Found pod: $POD_NAME"
echo "📜 Streaming logs (press Ctrl + C to stop)..."
echo "---------------------------------------------"

kubectl logs -n "$NAMESPACE" -f "$POD_NAME" 2>&1 \
  | grep -v '\[DeviceProfileLoader\]' \
  | grep -v -E '(GET /api/health|kube-probe|Incoming request: GET /api/health)' \
  | grep -v -E '(Permission cache hit|\[SessionCache\]|Cache hit for session)'
