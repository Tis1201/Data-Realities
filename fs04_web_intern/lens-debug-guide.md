# Lens Debugging Guide - Pods Not Showing

## Current Status
✅ Pods exist in cluster (verified via kubectl)
✅ Permissions are correct (can list pods)
✅ Kubeconfig uses full path to auth plugin
❌ Lens not showing pods

## Step-by-Step Debugging

### 1. Check Lens Connection Status
- In Lens, look at the cluster icon/status indicator
- Check if it shows "Connected" or any error messages
- Look for red/yellow status indicators

### 2. Open Lens Developer Console
- Press `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows/Linux)
- Or: Help → Toggle Developer Tools
- Check the Console tab for errors
- Look for:
  - Authentication errors
  - API call failures
  - Permission denied errors
  - Network errors

### 3. Check Lens Settings
- Go to: File → Preferences (or Lens → Preferences on Mac)
- Navigate to: Kubernetes → Kubeconfig Path
- Verify it points to: `/Users/bachsoda/.kube/config`
- Check: "Sync Kubeconfig" is enabled

### 4. Verify Cluster Context in Lens
- In Lens sidebar, check which cluster is selected
- Should be: `gke_cs-poc-vlkpvg5seziflnwq2ni7x3l_us-central1-a_dr-iot-dev`
- Try disconnecting and reconnecting to the cluster

### 5. Check Namespace Filter
- In Lens, look at the namespace selector (usually top-right)
- Make sure it's set to "All Namespaces" or a specific namespace
- Try switching between namespaces
- Check if pods appear in specific namespaces (e.g., `fs04`)

### 6. Test API Access from Lens
- In Lens, try accessing other resources:
  - Deployments
  - Services
  - ConfigMaps
- If these work but pods don't, it's a pods-specific issue

### 7. Check Lens Logs
- Mac: `~/Library/Logs/Lens/*.log`
- Linux: `~/.config/Lens/logs/*.log`
- Windows: `%APPDATA%\Lens\logs\*.log`
- Look for authentication or API errors

### 8. Verify Auth Plugin Execution
Run this to test if the plugin works:
```bash
/Users/bachsoda/google-cloud-sdk/bin/gke-gcloud-auth-plugin
```
It should output JSON with credentials. If it fails, that's the issue.

### 9. Try Alternative: Use Service Account Token
If exec-based auth doesn't work in Lens, you can create a service account token:
```bash
# Create service account
kubectl create serviceaccount lens-user -n default

# Create cluster role binding
kubectl create clusterrolebinding lens-user-binding \
  --clusterrole=cluster-admin \
  --serviceaccount=default:lens-user

# Get token
kubectl create token lens-user -n default
```
Then update kubeconfig to use token instead of exec.

### 10. Lens Version Check
- Check your Lens version: Help → About
- Some older versions have issues with GKE auth plugins
- Consider updating to latest version

### 11. Manual Kubeconfig Test
Verify the kubeconfig works:
```bash
kubectl --kubeconfig ~/.kube/config get pods --all-namespaces
```

### 12. Check Lens Resource Filters
- In Lens Pods view, check if there are any filters applied
- Look for search boxes or filter buttons
- Clear all filters

## Quick Fixes to Try

1. **Restart Lens completely** (quit and reopen)
2. **Remove and re-add cluster** in Lens
3. **Clear Lens cache** (if available in settings)
4. **Check Lens permissions** - ensure it has access to execute the auth plugin
5. **Try Lens in a different namespace** - select `fs04` namespace specifically

## Common Issues

### Issue: "exec: executable not found"
- **Solution**: Already fixed by using full path in kubeconfig

### Issue: "Unauthorized" or "Forbidden"
- **Solution**: Check RBAC permissions, may need cluster-admin role

### Issue: Pods show in some namespaces but not others
- **Solution**: Check namespace selector in Lens UI

### Issue: Lens shows "Loading..." indefinitely
- **Solution**: Check network connectivity, firewall rules, or Lens version

## Next Steps
If none of these work, share:
1. Lens version
2. Error messages from Developer Console
3. Lens log file contents
4. Screenshot of Lens UI showing the issue

