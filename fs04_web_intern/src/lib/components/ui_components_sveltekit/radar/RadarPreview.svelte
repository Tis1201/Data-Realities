<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import { mqttStore } from "$lib/stores/mqtt-store";

    const dispatch = createEventDispatcher<{
        frame: { points: Array<{ x: number; y: number; z?: number; velocity?: number }> };
        stateChange: { streaming: boolean };
    }>();
    import { Button } from "$lib/components/ui/button";
    import { RADAR_CONSTRAINTS } from "./constraints";
    import { getZoneColors } from "./zoneColors";

    // Props
    export let deviceId: string;
    export let controllerId: string;
    export let sensorId: string;
    export let duration = 60;
    export let width = 400;
    export let height = 400;
    
    // Config overlay props (optional)
    export let trackingArea: { startX: number; startY: number; endX: number; endY: number } | null = null;
    export let zones: Array<{ id?: string; name: string; startX: number; startY: number; endX: number; endY: number; color?: string; active?: boolean }> = [];
    export let showOverlay = true; // Toggle overlay on/off

    // Types
    interface RadarPoint {
        x: number;
        y: number;
        z: number;
        velocity?: number;
    }

    interface DataFrame {
        timestamp: number;
        frameNumber?: number;
        points: RadarPoint[];
    }

    type PreviewState = "idle" | "starting" | "active" | "stopping" | "error";

    // State
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null = null;
    let previewState: PreviewState = "idle";
    let error: string | null = null;
    let latestFrame: DataFrame | null = null;
    let frameCount = 0;
    let sessionId: string | null = null;
    let flowId: string | null = null;
    let notificationCleanup: (() => void) | null = null;
    let expiresAt: Date | null = null;
    let timeRemaining = 0;
    let countdownInterval: ReturnType<typeof setInterval> | null = null;

    // Radar display settings - match Visual Editor coordinate system
    const POINT_SIZE = 4;
    const GRID_LINES = 5;
    const SENSOR_MARGIN = 40; // Margin for sensor dot at top (match Visual Editor)
    
    // Calculate scale to fit RADAR_CONSTRAINTS (8m x 7m) - same as Visual Editor
    $: scale = (() => {
        const worldWidth = RADAR_CONSTRAINTS.X_MAX - RADAR_CONSTRAINTS.X_MIN; // 8 meters
        const worldHeight = RADAR_CONSTRAINTS.Y_MAX - RADAR_CONSTRAINTS.Y_MIN; // 7 meters
        
        const availableWidth = width;
        const availableHeight = height - SENSOR_MARGIN; // Reserve space for sensor at top
        
        const scaleX = availableWidth / worldWidth;
        const scaleY = availableHeight / worldHeight;
        
        return Math.min(scaleX, scaleY); // Fit to constraints
    })();
    
    // Origin: Sensor at top-center (match Visual Editor)
    // X = 0 is at center, Y = 0 is at sensor position
    function getOrigin() {
        return {
            x: width / 2, // Center horizontally
            y: SENSOR_MARGIN, // Sensor position at top
        };
    }
    
    // Coordinate conversion helpers - match Visual Editor (X flipped: positive = left, negative = right)
    function worldToCanvas(worldX: number, worldY: number): { x: number; y: number } {
        const origin = getOrigin();
        return {
            x: origin.x - worldX * scale,
            y: origin.y + worldY * scale // Y increases downward (forward direction)
        };
    }

    // Subscribe to store for connection status
    $: mqttStatus = $mqttStore.status;
    $: isConnected = mqttStatus === "OPEN";

    // Redraw when frame updates OR when zones/trackingArea/showOverlay change.
    // Accessing zones and trackingArea here registers them as reactive dependencies,
    // ensuring inactive-zone changes are reflected immediately on the canvas.
    $: if (ctx) {
        const _zones = zones;
        const _trackingArea = trackingArea;
        const _showOverlay = showOverlay;
        if (latestFrame) {
            drawFrame(latestFrame);
        } else {
            drawGrid();
            if (_showOverlay) drawOverlay();
        }
    }

    onMount(async () => {
        if (canvas) {
            ctx = canvas.getContext("2d");
            drawGrid();
        }
        
        // Ensure MQTT connection is established
        try {
            await mqttStore.connect();
            console.log("[RadarPreview] MQTT connected, subject:", mqttStore.subject);
        } catch (err) {
            console.warn("[RadarPreview] Failed to connect MQTT:", err);
            error = "Failed to connect to MQTT. Please refresh the page.";
        }
    });

    onDestroy(() => {
        if (previewState === "active") {
            handleStop();
        }
        stopCountdown();
    });

    function startCountdown() {
        stopCountdown();
        updateTimeRemaining();
        countdownInterval = setInterval(updateTimeRemaining, 1000);
    }

    function stopCountdown() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        timeRemaining = 0;
    }

    function updateTimeRemaining() {
        if (!expiresAt) {
            timeRemaining = 0;
            return;
        }
        const remaining = Math.max(
            0,
            Math.floor((expiresAt.getTime() - Date.now()) / 1000),
        );
        timeRemaining = remaining;

        // Auto-stop if time expired
        if (remaining <= 0 && previewState === "active") {
            handleStop();
        }
    }

    function formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    function drawGrid() {
        if (!ctx) return;
        const origin = getOrigin();

        // Clear
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, width, height);

        // Draw constraint bounds rectangle (X: -4 to 4, Y: 0 to 7)
        const boundsTL = worldToCanvas(RADAR_CONSTRAINTS.X_MIN, RADAR_CONSTRAINTS.Y_MIN);
        const boundsBR = worldToCanvas(RADAR_CONSTRAINTS.X_MAX, RADAR_CONSTRAINTS.Y_MAX);
        const boundsX = Math.min(boundsTL.x, boundsBR.x);
        const boundsY = Math.min(boundsTL.y, boundsBR.y);
        const boundsW = Math.abs(boundsBR.x - boundsTL.x);
        const boundsH = Math.abs(boundsBR.y - boundsTL.y);
        
        ctx.strokeStyle = "rgba(100, 100, 150, 0.5)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(boundsX, boundsY, boundsW, boundsH);
        ctx.setLineDash([]);

        // Grid lines - vertical (X axis)
        ctx.strokeStyle = "rgba(100, 100, 150, 0.3)";
        ctx.lineWidth = 1;
        for (let x = RADAR_CONSTRAINTS.X_MIN; x <= RADAR_CONSTRAINTS.X_MAX; x += 1) {
            const canvasX = worldToCanvas(x, 0).x;
            ctx.beginPath();
            ctx.moveTo(canvasX, boundsY);
            ctx.lineTo(canvasX, boundsY + boundsH);
            ctx.stroke();
        }
        
        // Grid lines - horizontal (Y axis)
        for (let y = RADAR_CONSTRAINTS.Y_MIN; y <= RADAR_CONSTRAINTS.Y_MAX; y += 1) {
            const canvasY = worldToCanvas(0, y).y;
            ctx.beginPath();
            ctx.moveTo(boundsX, canvasY);
            ctx.lineTo(boundsX + boundsW, canvasY);
            ctx.stroke();
        }

        // Center line (X = 0)
        const centerX = worldToCanvas(0, 0).x;
        ctx.strokeStyle = "rgba(100, 100, 150, 0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, boundsY);
        ctx.lineTo(centerX, boundsY + boundsH);
        ctx.stroke();

        // Sensor point at origin (top-center) – design: SENSOR label at origin
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(220, 38, 38, 0.95)";
        ctx.font = "11px sans-serif";
        ctx.fillText("SENSOR", origin.x + 8, origin.y + 4);
    }

    /** Check if (x,y) is inside a zone rectangle (handles any start/end order). */
    function pointInZone(x: number, y: number, zone: { startX: number; startY: number; endX: number; endY: number }): boolean {
        const xMin = Math.min(zone.startX, zone.endX);
        const xMax = Math.max(zone.startX, zone.endX);
        const yMin = Math.min(zone.startY, zone.endY);
        const yMax = Math.max(zone.startY, zone.endY);
        return x >= xMin && x <= xMax && y >= yMin && y <= yMax;
    }

    function pointInAnyZone(x: number, y: number, zoneList: Array<{ startX: number; startY: number; endX: number; endY: number }>): boolean {
        return zoneList.some((z) => pointInZone(x, y, z));
    }

    function drawFrame(frame: DataFrame) {
        if (!ctx) return;

        drawGrid();

        if (showOverlay) {
            drawOverlay();
        }

        // Draw points – design: numbered (001, 002…), green if inside an active zone, red if outside
        const c = ctx!;
        const zoneList = zones.filter(z => z.active !== false).map((z) => ({ startX: z.startX, startY: z.startY, endX: z.endX, endY: z.endY }));
        frame.points.forEach((point, index) => {
            const canvasPos = worldToCanvas(point.x, point.y);
            const inZone = zoneList.length > 0 && pointInAnyZone(point.x, point.y, zoneList);
            c.fillStyle = inZone ? "rgba(34, 197, 94, 0.95)" : "rgba(220, 38, 38, 0.95)";
            c.beginPath();
            c.arc(canvasPos.x, canvasPos.y, POINT_SIZE, 0, Math.PI * 2);
            c.fill();
            const label = String(index + 1).padStart(3, "0");
            c.fillStyle = "#fff";
            c.font = "10px sans-serif";
            c.textAlign = "center";
            c.textBaseline = "middle";
            c.fillText(label, canvasPos.x, canvasPos.y);
            c.textAlign = "left";
            c.textBaseline = "alphabetic";
        });
    }
    
    function drawOverlay() {
        if (!ctx) return;
        const origin = getOrigin();

        // Draw Tracking Area and FOV (field of view) – design: blue rect + green dashed lines from SENSOR to far edge
        if (trackingArea) {
            const p1 = worldToCanvas(trackingArea.startX, trackingArea.startY);
            const p2 = worldToCanvas(trackingArea.endX, trackingArea.endY);
            const x = Math.min(p1.x, p2.x);
            const y = Math.min(p1.y, p2.y);
            const w = Math.abs(p2.x - p1.x);
            const h = Math.abs(p2.y - p1.y);

            // FOV: dashed lines from sensor (origin) to far corners of tracking area
            const farLeft = worldToCanvas(trackingArea.startX, trackingArea.endY);
            const farRight = worldToCanvas(trackingArea.endX, trackingArea.endY);
            ctx.strokeStyle = "rgba(34, 197, 94, 0.7)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(farLeft.x, farLeft.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(farRight.x, farRight.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Tracking area rectangle (blue)
            ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
            ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);
            ctx.setLineDash([]);

            ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
            ctx.font = "12px sans-serif";
            ctx.fillText("Tracking Area", x + 5, y + 15);
        }

        // Draw Zones (only active ones; undefined active treated as active for backward compat)
        zones.filter(z => z.active !== false).forEach((zone, index) => {
            if (!ctx) return;
            const p1 = worldToCanvas(zone.startX, zone.startY);
            const p2 = worldToCanvas(zone.endX, zone.endY);
            const x = Math.min(p1.x, p2.x);
            const y = Math.min(p1.y, p2.y);
            const w = Math.abs(p2.x - p1.x);
            const h = Math.abs(p2.y - p1.y);
            
            // Use zone color or design palette by zone number/index
            const zoneNum = 'zoneNumber' in zone && typeof zone.zoneNumber === 'number' ? zone.zoneNumber : index + 1;
            const zoneColors = getZoneColors(zoneNum);
            const strokeColor = zone.color || zoneColors.border;
            const fillColor = zoneColors.fill + "33";

            // Draw zone rectangle
            ctx.strokeStyle = strokeColor;
            ctx.fillStyle = fillColor;
            ctx.lineWidth = 2;
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);
            
            // Label
            ctx.fillStyle = strokeColor;
            ctx.font = "11px sans-serif";
            ctx.fillText(zone.name || `Zone ${index + 1}`, x + 5, y + 12);
        });
    }

    async function handleStart() {
        if (!isConnected) {
            error = "MQTT not connected. Please wait...";
            return;
        }

        previewState = "starting";
        dispatch("stateChange", { streaming: false });
        error = null;
        frameCount = 0;

        try {
            // Generate a unique request ID
            const requestId = crypto.randomUUID();

            // Create the request payload
            const requestPayload = {
                op: "sensor.preview.start",
                params: {
                    deviceId,
                    controllerId,
                    sensorId,
                    duration,
                },
                requestId,
                timestamp: new Date().toISOString(),
            };

            // Publish request
            const userSub = mqttStore.subject;
            if (!userSub) {
                throw new Error("User subject not available");
            }

            // Define more complete response type
            interface RpcResponse {
                requestId: string;
                error?: string;
                result?: {
                    flowId?: string;
                    result?: {
                        sessionId?: string;
                        expiresAt?: string;
                        flowId?: string;
                    };
                };
            }

            // Set up response listener before publishing
            const responsePromise = new Promise<RpcResponse>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    cleanup();
                    reject(new Error("Request timed out"));
                }, 10000);

                const cleanup = mqttStore.on(
                    `user/${userSub}/response`,
                    (msg) => {
                        const payload = msg.payload as RpcResponse | undefined;
                        if (payload?.requestId === requestId) {
                            clearTimeout(timeout);
                            cleanup();
                            if (payload.error) {
                                reject(new Error(payload.error));
                            } else {
                                resolve(payload);
                            }
                        }
                    },
                );
            });

            // Publish the request
            await mqttStore.publish(
                `user/${userSub}/requests`,
                requestPayload,
                { qos: 1 },
            );

            // Wait for response
            const response = await responsePromise;
            console.log(
                "[RadarPreview] Full response:",
                JSON.stringify(response, null, 2),
            );

            // RPC responses have double-nested result: response.result.result
            // flowId is at response.result.flowId
            // sessionId is at response.result.result.sessionId
            const rpcResult = response.result;
            sessionId = rpcResult?.result?.sessionId ?? null;
            flowId = rpcResult?.flowId || rpcResult?.result?.flowId || null;

            // Parse expiration time for countdown
            const expiresAtStr = rpcResult?.result?.expiresAt;
            if (expiresAtStr) {
                expiresAt = new Date(expiresAtStr);
                startCountdown();
            }

            console.log(
                "[RadarPreview] Started session:",
                sessionId,
                "flowId:",
                flowId,
            );

            // Subscribe to preview data notifications
            const notificationTopic = `user/${userSub}/notifications`;

            notificationCleanup = mqttStore.on(notificationTopic, (msg) => {
                const payload = msg.payload as { 
                    type?: string; 
                    flowId?: string;
                    timestamp?: number; 
                    frameNumber?: number; 
                    data?: { points?: Array<{ x: number; y: number; z: number; velocity?: number }> };
                    params?: { frameNumber?: number; data?: { points?: Array<{ x: number; y: number; z: number; velocity?: number }> } };
                };
                
                // Filter by type and flowId to ensure we only process data for this session
                if (payload?.type === "preview.data" && (!flowId || payload.flowId === flowId)) {
                    const frame: DataFrame = {
                        timestamp: payload.timestamp || Date.now(),
                        frameNumber: payload.frameNumber || payload.params?.frameNumber,
                        points: payload.data?.points || payload.params?.data?.points || [],
                    };
                    latestFrame = frame;
                    frameCount++;
                    dispatch("frame", { points: frame.points });
                }
            });

            previewState = "active";
            dispatch("stateChange", { streaming: true });
        } catch (err) {
            console.error("[RadarPreview] Failed to start:", err);
            error =
                err instanceof Error ? err.message : "Failed to start preview";
            previewState = "error";
            dispatch("stateChange", { streaming: false });
        }
    }

    async function handleStop() {
        console.log("[RadarPreview] Stopping session:", sessionId);

        if (!sessionId) {
            previewState = "idle";
            dispatch("stateChange", { streaming: false });
            return;
        }

        previewState = "stopping";
        dispatch("stateChange", { streaming: false });

        try {
            const userSub = mqttStore.subject;
            if (userSub) {
                const requestId = crypto.randomUUID();
                const requestPayload = {
                    op: "sensor.preview.stop",
                    params: { sessionId },
                    requestId,
                    timestamp: new Date().toISOString(),
                };
                console.log("[RadarPreview] Sending stop request:", requestId);
                await mqttStore.publish(
                    `user/${userSub}/requests`,
                    requestPayload,
                    { qos: 1 },
                );
                console.log("[RadarPreview] Stop request sent");
            }
        } catch (err) {
            console.error("[RadarPreview] Failed to stop:", err);
        }

        // Cleanup
        if (notificationCleanup) {
            notificationCleanup();
            notificationCleanup = null;
        }
        stopCountdown();
        expiresAt = null;
        sessionId = null;
        flowId = null;
        previewState = "idle";
        latestFrame = null;
        if (ctx) drawGrid();
        dispatch("frame", { points: [] });
        dispatch("stateChange", { streaming: false });
    }
</script>

<div class="radar-preview">
    <div class="radar-header">
        <h3>Radar Preview</h3>
        <div
            class="status"
            class:active={previewState === "active"}
            class:error={previewState === "error"}
        >
            {#if !isConnected}
                Disconnected
            {:else if previewState === "idle"}
                Ready
            {:else if previewState === "starting"}
                Connecting...
            {:else if previewState === "active"}
                Live • {frameCount} frames
            {:else if previewState === "stopping"}
                Stopping...
            {:else if previewState === "error"}
                Error
            {/if}
        </div>
    </div>

    <div class="canvas-container">
        <canvas bind:this={canvas} {width} {height}></canvas>
    </div>

    {#if error}
        <div class="error-message">{error}</div>
    {/if}

    <div class="controls">
        {#if previewState === "idle" || previewState === "error"}
            <Button
                on:click={handleStart}
                variant="default"
                disabled={!isConnected}
            >
                {isConnected ? "Start Preview" : "Waiting for MQTT..."}
            </Button>
        {:else if previewState === "active"}
            <Button on:click={handleStop} variant="destructive">
                Stop Preview
            </Button>
        {:else}
            <Button disabled>
                {previewState === "starting" ? "Starting..." : "Stopping..."}
            </Button>
        {/if}
    </div>

    {#if previewState === "active"}
        <div class="frame-info">
            {#if latestFrame}
                Points: {latestFrame.points.length} |
            {/if}
            {#if timeRemaining > 0}
                <span class="countdown"
                    >Time left: {formatTime(timeRemaining)}</span
                >
            {:else}
                Session ending...
            {/if}
        </div>
    {/if}
    
    <!-- Legend -->
    {#if previewState === "active" || previewState === "idle"}
        <div class="legend">
            <div class="legend-section">
                <div class="legend-title">Velocity Colors:</div>
                <div class="legend-items">
                    <div class="legend-item">
                        <span class="legend-dot" style="background: hsl(120, 50%, 60%);"></span>
                        <span>Moving Forward</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot" style="background: hsl(0, 50%, 60%);"></span>
                        <span>Moving Backward</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot" style="background: hsl(60, 50%, 60%);"></span>
                        <span>Stationary</span>
                    </div>
                </div>
            </div>
            {#if showOverlay && (trackingArea || zones.length > 0)}
                <div class="legend-section legend-overlay">
                    <div class="legend-title">Overlay:</div>
                    <div class="legend-items">
                        {#if trackingArea}
                            <div class="legend-item">
                                <span class="legend-dot" style="background: rgba(59, 130, 246, 0.6); border: 2px solid rgba(59, 130, 246, 0.9);"></span>
                                <span>Tracking Area</span>
                            </div>
                        {/if}
                        {#each zones as zone, index}
                            {@const zc = getZoneColors(index + 1)}
                            <div class="legend-item">
                                <span class="legend-dot" style="background: {zc.fill}; border: 1px solid {zc.border};"></span>
                                <span>{zone.name || `Zone ${index + 1}`}</span>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .radar-preview {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        background: var(--card, #1e1e2e);
        border-radius: 0.5rem;
        border: 1px solid var(--border, #333);
        max-width: 100%;
        min-width: 0;
    }

    .radar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .radar-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--foreground, #fff);
    }

    .status {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        background: var(--muted, #333);
        color: var(--muted-foreground, #999);
    }

    .status.active {
        background: rgba(74, 222, 128, 0.2);
        color: #4ade80;
    }

    .status.error {
        background: rgba(248, 113, 113, 0.2);
        color: #f87171;
    }

    .canvas-container {
        display: flex;
        justify-content: center;
        width: 100%;
        max-width: 100%;
    }

    canvas {
        border-radius: 0.25rem;
        background: #1a1a2e;
        width: 100%;
        height: auto;
        max-width: 100%;
        display: block;
        aspect-ratio: 1;
    }

    .controls {
        display: flex;
        justify-content: center;
    }

    .error-message {
        color: #f87171;
        font-size: 0.875rem;
        text-align: center;
    }

    .frame-info {
        font-size: 0.875rem;
        color: var(--muted-foreground, #999);
        text-align: center;
    }

    .frame-info .countdown {
        font-weight: 600;
        color: var(--primary, #4ade80);
    }
    
    .legend {
        display: flex;
        flex-direction: row;
        gap: 1.5rem;
        font-size: 0.75rem;
        color: var(--muted-foreground, #999);
        padding: 0.75rem;
        background: var(--muted, rgba(255, 255, 255, 0.05));
        border-radius: 0.25rem;
        margin-top: 0.5rem;
    }
    
    .legend-section {
        flex: 1;
        min-width: 0;
    }
    
    .legend-title {
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--foreground, #fff);
    }
    
    .legend-items {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .legend-overlay {
        padding-left: 1.5rem;
        border-left: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .legend-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    
    /* Responsive: stack legend on small screens */
    @media (max-width: 480px) {
        .legend {
            flex-direction: column;
            gap: 0.75rem;
        }
        .legend-overlay {
            padding-left: 0;
            padding-top: 0.75rem;
            border-left: none;
            border-top: 1px solid var(--border, rgba(255, 255, 255, 0.1));
        }
    }
</style>
