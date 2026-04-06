# Lens Pods Not Showing - Root Cause & Solutions

## Root Cause Identified

From the Lens error log (`lens-error-log.txt` line 326):
```
[TOKEN-REFRESHER-FOR-RENDERER]: Failed to refresh token Timeout awaiting 'request' for 6000ms
```

**Problem**: Lens is timing out (6 seconds) when trying to execute `gke-gcloud-auth-plugin` to refresh the authentication token. Without a valid token, Lens cannot fetch pods or other resources.

## What We've Done

1. ✅ Updated kubeconfig to use full path to auth plugin
2. ✅ Created wrapper script at `/Users/bachsoda/bin/gke-auth-wrapper.sh`
3. ✅ Updated kubeconfig to use the wrapper script
4. ✅ Verified kubectl still works

## Next Steps to Fix Lens

### Option 1: Restart Lens and Test (Try This First)

1. **Completely quit Lens** (Cmd+Q on Mac)
2. **Reopen Lens**
3. **Disconnect and reconnect** to the cluster:
   - Right-click cluster → Disconnect
   - Right-click cluster → Connect
4. **Check if pods appear**

### Option 2: Verify Lens Can Execute the Script

Test if Lens can execute the wrapper:
```bash
# Test the wrapper directly
/Users/bachsoda/bin/gke-auth-wrapper.sh

# Should output JSON with token
```

If this works but Lens still times out, the issue is Lens-specific.

### Option 3: Use Service Account Token (Most Reliable for Lens)

If the exec-based auth continues to fail in Lens, use a service account token instead:

```bash
# Create service account
kubectl create serviceaccount lens-user -n default

# Grant permissions (adjust as needed - this gives full access)
kubectl create clusterrolebinding lens-user-binding \
  --clusterrole=cluster-admin \
  --serviceaccount=default:lens-user

# Get token
TOKEN=$(kubectl create token lens-user -n default)

# Update kubeconfig to use token instead of exec
# (We can automate this if needed)
```

Then update the kubeconfig user section to:
```yaml
users:
- name: gke_cs-poc-vlkpvg5seziflnwq2ni7x3l_us-central1-a_dr-iot-dev
  user:
    token: <TOKEN_HERE>
```

**Note**: Tokens expire, so you'll need to refresh periodically or use a long-lived token.

### Option 4: Check Lens Settings

1. **Lens Preferences** → **Kubernetes**:
   - Verify kubeconfig path: `/Users/bachsoda/.kube/config`
   - Check "Sync Kubeconfig" is enabled
   
2. **Lens Preferences** → **Proxy**:
   - Check if proxy settings are interfering
   - Try disabling proxy if enabled

3. **Check Lens Version**:
   - Help → About
   - Update to latest version if outdated
   - Some older versions have GKE auth issues

### Option 5: Check Network/Firewall

The timeout might be due to network issues:
- Check if Lens has network permissions
- Verify firewall isn't blocking Lens
- Check if corporate VPN/proxy is interfering

### Option 6: Lens Logs Analysis

Check Lens logs for more details:
```bash
# Mac
tail -f ~/Library/Logs/Lens/*.log

# Look for:
# - Authentication errors
# - Plugin execution errors  
# - Network timeout errors
# - Permission denied errors
```

## Current Kubeconfig Status

- ✅ Uses wrapper script: `/Users/bachsoda/bin/gke-auth-wrapper.sh`
- ✅ Wrapper sets up PATH and environment
- ✅ kubectl works correctly
- ❓ Lens still timing out (needs testing after restart)

## Debugging Commands

```bash
# Test auth plugin directly
/Users/bachsoda/google-cloud-sdk/bin/gke-gcloud-auth-plugin

# Test wrapper script
/Users/bachsoda/bin/gke-auth-wrapper.sh

# Test kubectl access
kubectl get pods --all-namespaces

# Check current context
kubectl config current-context

# Verify kubeconfig
kubectl config view --minify
```

## Expected Behavior

After fix:
- Lens should connect to cluster
- Pods should appear in Lens UI
- No timeout errors in Lens console
- Other resources (Deployments, Services) should also work

## If Still Not Working

1. Share new Lens error logs (after restart)
2. Check Lens Developer Console (Cmd+Option+I) for new errors
3. Verify the wrapper script is executable: `ls -la /Users/bachsoda/bin/gke-auth-wrapper.sh`
4. Try Option 3 (Service Account Token) for most reliable solution

