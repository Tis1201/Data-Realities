# Flutter Android MQTT Connection Setup

## Problem

When running a Flutter Android app, `localhost` refers to the Android device itself, not your development machine. This causes connection errors when trying to reach the web server or MQTT broker running on your dev machine.

## Solution

### 1. Find Your Development Machine's Network IP

From your development machine, find your local network IP address:

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v "127.0.0.1"
```

**Windows:**
```bash
ipconfig
```

Look for your local network IP (usually something like `192.168.1.x` or `10.0.0.x`).

Example output shows: `192.168.1.54`

### 2. Update Flutter App Configuration

In your Flutter app, replace `localhost` with your development machine's IP address:

**Before (doesn't work on Android):**
```dart
final apiBaseUrl = 'http://localhost:5173';
final mqttMintUrl = 'http://localhost:5173/api/device/mqtt/mint/factory';
```

**After (works on Android):**
```dart
final apiBaseUrl = 'http://192.168.1.54:5173';
final mqttMintUrl = 'http://192.168.1.54:5173/api/device/mqtt/mint/factory';
```

### 3. Update MQTT Broker URL

The MQTT broker URL returned by the mint endpoint also needs to be accessible from Android.

**Current configuration in `.env`:**
```bash
MQTT_BROKER_URL=ws://localhost:8083/mqtt
```

**Update to use network IP:**
```bash
MQTT_BROKER_URL=ws://192.168.1.54:8083/mqtt
```

Or for TCP (port 1883):
```bash
MQTT_BROKER_URL=mqtt://192.168.1.54:1883
```

### 4. Ensure Devices Are on Same Network

- Your development machine and Android device must be on the same local network (WiFi)
- Both should be able to ping each other

### 5. Verify Server Accessibility

Test from your Android device or emulator:

```bash
# Test web server
curl http://192.168.1.54:5173/api/device/mqtt/mint/factory

# Test MQTT broker (if you have MQTT client on Android)
# Connect to: ws://192.168.1.54:8083/mqtt
```

### 6. Flutter Code Example

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class MqttMintService {
  // Use your development machine's IP instead of localhost
  static const String baseUrl = 'http://192.168.1.54:5173';
  
  Future<Map<String, dynamic>> mintFactoryCredentials(String factoryToken) async {
    final url = Uri.parse('$baseUrl/api/device/mqtt/mint/factory');
    
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $factoryToken',
      },
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        return data['data']; // Contains brokerUrl, clientId, username, jwt
      }
    }
    
    throw Exception('Failed to mint MQTT credentials: ${response.body}');
  }
}
```

### 7. Environment-Based Configuration (Recommended)

For better flexibility, use environment variables or configuration:

```dart
class AppConfig {
  // Development
  static const String devBaseUrl = 'http://192.168.1.54:5173';
  static const String devMqttBroker = 'ws://192.168.1.54:8083/mqtt';
  
  // Production
  static const String prodBaseUrl = 'https://your-production-domain.com';
  static const String prodMqttBroker = 'wss://mqtt.your-production-domain.com';
  
  static String get baseUrl => kDebugMode ? devBaseUrl : prodBaseUrl;
  static String get mqttBroker => kDebugMode ? devMqttBroker : prodMqttBroker;
}
```

### 8. Android Emulator Specific Notes

If using Android Emulator:
- **Android Emulator**: Use `10.0.2.2` instead of `localhost` to reach the host machine
- **Physical Android Device**: Use your development machine's network IP (e.g., `192.168.1.54`)

```dart
// For Android Emulator
static const String baseUrl = 'http://10.0.2.2:5173';

// For Physical Android Device
static const String baseUrl = 'http://192.168.1.54:5173';
```

## Troubleshooting

### Server Still Returns `localhost` in Broker URL

**Problem**: After updating `.env`, the mint endpoint still returns `ws://localhost:8083/mqtt`

**Solution**: 
1. **Restart your dev server** - Environment variables are loaded at startup
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

2. **Verify the change took effect**:
   ```bash
   # Check .env file
   grep MQTT_BROKER_URL .env
   
   # Should show:
   # MQTT_BROKER_URL=ws://192.168.1.54:8083/mqtt
   ```

3. **Test the mint endpoint**:
   ```bash
   curl -X POST http://192.168.1.54:5173/api/device/mqtt/mint/factory \
     -H "Authorization: Bearer YOUR_FACTORY_TOKEN" \
     -H "Content-Type: application/json"
   
   # Check the response - brokerUrl should be ws://192.168.1.54:8083/mqtt
   ```

### WebSocket URL Format Error

**Problem**: Flutter MQTT client error: `"The URI supplied for the WS has an incorrect scheme - localhost"`

**Causes**:
1. Server still returning `localhost` (see above)
2. MQTT client library expects a different URL format

**Solutions**:

1. **Ensure server returns network IP** (restart server after updating `.env`)

2. **Try different WebSocket URL formats** in your Flutter app:
   ```dart
   // Format 1: Full WebSocket URL (most common)
   final brokerUrl = 'ws://192.168.1.54:8083/mqtt';
   
   // Format 2: Without /mqtt path (some clients)
   final brokerUrl = 'ws://192.168.1.54:8083';
   
   // Format 3: Use TCP instead of WebSocket
   final brokerUrl = 'mqtt://192.168.1.54:1883';
   ```

3. **Check your MQTT client library documentation** - Some libraries expect:
   - Host and port separately instead of full URL
   - Different WebSocket path (`/ws`, `/mqtt`, or no path)

4. **Example Flutter MQTT client usage**:
   ```dart
   // For mqtt_client package
   final client = MqttClient('192.168.1.54', '');
   client.port = 8083;
   client.secure = false;
   client.useWebSocket = true;
   client.logging(on: true);
   
   // Or with full URL parsing
   final uri = Uri.parse('ws://192.168.1.54:8083/mqtt');
   final client = MqttClient(uri.host, uri.path);
   client.port = uri.port;
   ```

### Connection Refused Error

1. **Check firewall**: Ensure your dev machine's firewall allows connections on ports 5173 and 8083
2. **Check network**: Verify both devices are on the same WiFi network
3. **Check server is running**: Ensure `npm run dev` is running and accessible
4. **Check EMQX is running**: Verify EMQX container is running: `docker ps | grep emqx`

### MQTT Connection Fails After Minting

1. **Verify broker URL**: Check that the `brokerUrl` in the mint response uses the network IP, not localhost
2. **Check EMQX ports**: Ensure ports 1883 (TCP) and 8083 (WebSocket) are accessible
3. **Check JWT**: Verify the JWT token is valid and not expired
4. **Check EMQX WebSocket path**: EMQX WebSocket is typically at `/mqtt` path

### Testing MQTT Connection

You can test the MQTT connection using an MQTT client app on Android:
- **MQTT Client ID**: From mint response
- **Broker**: `192.168.1.54` (or your dev machine IP)
- **Port**: `8083` for WebSocket or `1883` for TCP
- **WebSocket Path**: `/mqtt` (if required by client)
- **Username**: From mint response
- **Password**: JWT token from mint response

## Starting the MQTT Worker

**IMPORTANT**: The MQTT worker must be running separately from the dev server to process device requests!

The MQTT worker handles:
- Device RPC requests (like `get.pin`)
- Device notifications
- Message routing between devices and users

### Start the Worker

In a **separate terminal**, run:

```bash
npm run mqtt:worker
```

You should see output like:
```
[MQTT Transport] Worker starting up...
[MQTT Transport] Connecting to ws://192.168.1.54:8083/mqtt...
[MQTT Transport] Connected as fs04-worker-...
[MQTT Transport] Subscribed to topics: $share/server/device/+/requests, ...
```

### Verify Worker is Running

Check that the worker is subscribed to device topics:
- `$share/server/device/+/requests` - for device RPC requests
- `$share/server/device/+/replies` - for device responses

### Troubleshooting Worker Issues

**Worker not connecting:**
- Check `MQTT_BROKER_URL` is set correctly in `.env`
- Verify EMQX is running: `docker ps | grep emqx`
- Check worker logs for connection errors

**Worker not processing requests:**
- Verify worker is subscribed to the correct topics
- Check that shared subscription group matches (`MQTT_SHARED_GROUP`)
- Ensure worker has proper MQTT credentials

## Summary

1. ✅ Replace `localhost` with your dev machine's network IP (`192.168.1.54`)
2. ✅ Update `MQTT_BROKER_URL` in `.env` to use network IP
3. ✅ Ensure both devices are on the same network
4. ✅ Restart the dev server after changing `.env`
5. ✅ **Start the MQTT worker**: `npm run mqtt:worker` (in separate terminal)
6. ✅ Use `10.0.2.2` for Android Emulator, network IP for physical devices

