<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import { Button } from "$lib/components/ui/button";
    import { Plus, Trash2, RotateCcw, Maximize2, ZoomIn, ZoomOut } from "lucide-svelte";
    import type Konva from "konva";
    import type { ZoneShape } from "./shapes/ZoneShape";
    import { RADAR_CONSTRAINTS, clampBounds, normalizeBounds } from "./constraints";
    import { getZoneColors, getZoneBorderColor } from "./zoneColors";

    const dispatch = createEventDispatcher<{
        arenaChange: {
            startX: number;
            startY: number;
            endX: number;
            endY: number;
        };
        zonesChange: Array<{
            id?: string;
            name: string;
            startX: number;
            startY: number;
            endX: number;
            endY: number;
            color?: string;
            zoneNumber?: number;
        }>;
    }>();

    // Props
    export let arena: {
        startX: number;
        startY: number;
        endX: number;
        endY: number;
    } | null = null;
    export let zones: Array<{
        id?: string;
        name: string;
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        color?: string;
        zoneNumber?: number;
        /** When false, zone is not drawn on the canvas (inactive). */
        active?: boolean;
    }> = [];
    export let maxZones = 5;
    export let readonly = false;

    // References
    let container: HTMLDivElement;
    let stage: Konva.Stage;
    let gridLayer: Konva.Layer;
    let mainLayer: Konva.Layer;

    // Dynamically loaded modules
    let KonvaLib: typeof Konva;
    let ZoneShapeClass: typeof ZoneShape;

    // Canvas sizing constants
    const PADDING = 60; // Padding around content in pixels
    const SENSOR_MARGIN = 40; // Extra margin for sensor dot at top
    const MIN_SCALE = 30; // Minimum pixels per meter
    const MAX_SCALE = 80; // Maximum pixels per meter
    const MIN_CANVAS_HEIGHT = 320; // Minimum canvas height for usability

    // Dynamic scale - computed based on arena and container
    let currentScale = 50; // Default scale
    let gridSize = currentScale; // Grid size matches scale

    // Computed bounds for the viewable area (cast to number to avoid literal type issues)
    const viewBoundsX = { min: RADAR_CONSTRAINTS.X_MIN as number, max: RADAR_CONSTRAINTS.X_MAX as number };
    const viewBoundsY = { min: RADAR_CONSTRAINTS.Y_MIN as number, max: RADAR_CONSTRAINTS.Y_MAX as number };
    const worldWidth = viewBoundsX.max - viewBoundsX.min; // 8 meters
    const worldHeight = viewBoundsY.max - viewBoundsY.min; // 7 meters

    interface WorldBounds {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    }

    function normalizeWorldBounds(b: WorldBounds): WorldBounds {
        return {
            minX: Math.min(b.minX, b.maxX),
            maxX: Math.max(b.minX, b.maxX),
            minY: Math.min(b.minY, b.maxY),
            maxY: Math.max(b.minY, b.maxY),
        };
    }

    function clampWorldBoundsToConstraints(b: WorldBounds): WorldBounds {
        return {
            minX: Math.max(viewBoundsX.min, b.minX),
            maxX: Math.min(viewBoundsX.max, b.maxX),
            minY: Math.max(viewBoundsY.min, b.minY),
            maxY: Math.min(viewBoundsY.max, b.maxY),
        };
    }

    function getContentBounds(): WorldBounds {
        // Default to full constraint bounds
        let bounds: WorldBounds = {
            minX: viewBoundsX.min,
            maxX: viewBoundsX.max,
            minY: viewBoundsY.min,
            maxY: viewBoundsY.max,
        };

        // Prefer tracking area if available
        if (arena) {
            bounds = {
                minX: Math.min(arena.startX, arena.endX),
                maxX: Math.max(arena.startX, arena.endX),
                minY: Math.min(arena.startY, arena.endY),
                maxY: Math.max(arena.startY, arena.endY),
            };
        }

        // Expand to include all zones (in case zones extend beyond tracking area due to edits)
        for (const z of zones) {
            bounds.minX = Math.min(bounds.minX, z.startX, z.endX);
            bounds.maxX = Math.max(bounds.maxX, z.startX, z.endX);
            bounds.minY = Math.min(bounds.minY, z.startY, z.endY);
            bounds.maxY = Math.max(bounds.maxY, z.startY, z.endY);
        }

        return clampWorldBoundsToConstraints(normalizeWorldBounds(bounds));
    }

    // Config – dark concept background to match design (#1A142A)
    const COLORS = {
        canvasBackground: "#1A142A",
        grid: "rgba(168, 85, 247, 0.25)",
        axis: "rgba(192, 132, 252, 0.5)",
        sensor: "#ef4444",
        arena: "#a78bfa", // Purple-400
        arenaFill: "rgba(168, 85, 247, 0.2)",
        labelText: "#94a3b8",
    };

    // State
    let arenaShape: ZoneShape | null = null;
    let zoneShapes: ZoneShape[] = [];

    // Context menu state
    let contextMenu = {
        visible: false,
        x: 0,
        y: 0,
        zoneIndex: -1,
        zoneName: "",
    };

    // Label edit state
    let labelEdit = {
        visible: false,
        x: 0,
        y: 0,
        zoneIndex: -1,
        value: "",
    };
    let labelInput: HTMLInputElement;

    let resizeObserver: ResizeObserver | null = null;

    function getContainerHeight(): number {
        // When using aspect-ratio + max-height, clientHeight can be 0 during initial layout.
        // Provide a sensible fallback.
        const h = container?.clientHeight ?? 0;
        return Math.max(MIN_CANVAS_HEIGHT, h || 0);
    }

    // Compute optimal scale to fit the constraint bounds in the container
    function computeOptimalScale(): number {
        if (!container) return 50;
        
        const containerWidth = container.clientWidth;
        const containerHeight = getContainerHeight();
        
        // Calculate scale to fit world bounds with padding
        const availableWidth = containerWidth - (PADDING * 2);
        const availableHeight = containerHeight - PADDING - SENSOR_MARGIN;
        
        const scaleX = availableWidth / worldWidth;
        const scaleY = availableHeight / worldHeight;
        
        // Use the smaller scale to ensure everything fits
        let scale = Math.min(scaleX, scaleY);
        
        // Clamp to min/max
        scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
        
        return scale;
    }

    function computeScaleToFitBounds(bounds: WorldBounds): number {
        if (!container) return 50;

        const containerWidth = container.clientWidth;
        const containerHeight = getContainerHeight();

        const availableWidth = containerWidth - (PADDING * 2);
        const availableHeight = containerHeight - PADDING - SENSOR_MARGIN;

        const width = Math.max(0.1, bounds.maxX - bounds.minX);
        const height = Math.max(0.1, bounds.maxY - bounds.minY);

        const scaleX = availableWidth / width;
        const scaleY = availableHeight / height;

        let scale = Math.min(scaleX, scaleY);
        scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
        return scale;
    }

    // Origin: Sensor at top-center, Y increases downward (forward direction)
    // X = 0 is at center, Y = 0 is at sensor position
    function getOrigin() {
        if (!stage) return { x: 0, y: 0 };
        const stageWidth = stage.width();
        return {
            x: stageWidth / 2,
            y: SENSOR_MARGIN, // Sensor position with margin from top
        };
    }

    // X-axis flipped: x positive = left, x negative = right (origin at center)
    function worldToCanvas(x: number, y: number) {
        const origin = getOrigin();
        return {
            x: origin.x - x * currentScale,
            y: origin.y + y * currentScale,
        };
    }

    function canvasToWorld(cx: number, cy: number) {
        const origin = getOrigin();
        return {
            x: (origin.x - cx) / currentScale,
            y: (cy - origin.y) / currentScale,
        };
    }

    // Fit view to current content (tracking area + zones)
    function fitToView() {
        if (!stage || !container) return;
        
        // Update stage size to match current container size (important for correct scaling)
        stage.size({ width: container.clientWidth, height: getContainerHeight() });
        
        // Fit to current content (tracking area + zones) instead of always fitting the full constraint box.
        const contentBounds = getContentBounds();
        currentScale = computeScaleToFitBounds(contentBounds);
        gridSize = currentScale;
        
        // Redraw all elements with new scale
        drawGrid();
        setupArena();
        setupZones();
        
        // Reset any stage-level transforms
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        stage.batchDraw();
    }
    
    // Reset view to show the entire constraint bounds (X: -4 to 4, Y: 0 to 7)
    function resetView() {
        if (!stage || !container) return;
        
        // Update stage size to match current container size
        stage.size({ width: container.clientWidth, height: getContainerHeight() });
        
        // Reset to full constraint bounds
        const fullBounds: WorldBounds = {
            minX: RADAR_CONSTRAINTS.X_MIN,
            maxX: RADAR_CONSTRAINTS.X_MAX,
            minY: RADAR_CONSTRAINTS.Y_MIN,
            maxY: RADAR_CONSTRAINTS.Y_MAX,
        };
        currentScale = computeScaleToFitBounds(fullBounds);
        gridSize = currentScale;
        
        // Redraw all elements with new scale
        drawGrid();
        setupArena();
        setupZones();
        
        // Reset any stage-level transforms
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        stage.batchDraw();
    }
    
    // Zoom in/out by adjusting scale
    const ZOOM_STEP = 10; // Scale change per zoom step
    
    function zoomIn() {
        if (!stage) return;
        const newScale = Math.min(currentScale + ZOOM_STEP, MAX_SCALE);
        if (newScale !== currentScale) {
            currentScale = newScale;
            gridSize = currentScale;
            drawGrid();
            setupArena();
            setupZones();
            stage.batchDraw();
        }
    }
    
    function zoomOut() {
        if (!stage) return;
        const newScale = Math.max(currentScale - ZOOM_STEP, MIN_SCALE);
        if (newScale !== currentScale) {
            currentScale = newScale;
            gridSize = currentScale;
            drawGrid();
            setupArena();
            setupZones();
            stage.batchDraw();
    }
    }
    
    // Get current zoom percentage for display
    $: zoomPercentage = Math.round((currentScale / MIN_SCALE) * 100);

    function drawGrid() {
        if (!gridLayer || !KonvaLib) return;
        gridLayer.destroyChildren();

        const width = stage.width();
        const height = stage.height();
        const origin = getOrigin();

        // Draw constraint boundary (visible area)
        const boundTopLeft = worldToCanvas(viewBoundsX.min, viewBoundsY.min);
        const boundBottomRight = worldToCanvas(viewBoundsX.max, viewBoundsY.max);
        
        // Constraint boundary background (dark concept)
        gridLayer.add(
            new KonvaLib.Rect({
                x: boundTopLeft.x,
                y: boundTopLeft.y,
                width: boundBottomRight.x - boundTopLeft.x,
                height: boundBottomRight.y - boundTopLeft.y,
                fill: COLORS.canvasBackground,
                stroke: COLORS.axis,
                strokeWidth: 2,
                dash: [8, 4],
            }),
        );

        // Vertical grid lines (1m intervals within bounds)
        for (let worldX = viewBoundsX.min; worldX <= viewBoundsX.max; worldX += 1) {
            const canvasX = worldToCanvas(worldX, 0).x;
            const isAxis = worldX === 0;
            gridLayer.add(
                new KonvaLib.Line({
                    points: [canvasX, boundTopLeft.y, canvasX, boundBottomRight.y],
                    stroke: isAxis ? COLORS.axis : COLORS.grid,
                    strokeWidth: isAxis ? 2 : 1,
                }),
            );
            // X-axis labels
            if (worldX % 2 === 0) {
            gridLayer.add(
                    new KonvaLib.Text({
                        x: canvasX - 8,
                        y: boundBottomRight.y + 5,
                        text: `${worldX}`,
                        fontSize: 10,
                        fill: COLORS.labelText,
                }),
            );
        }
        }

        // Horizontal grid lines (1m intervals within bounds)
        for (let worldY = viewBoundsY.min; worldY <= viewBoundsY.max; worldY += 1) {
            const canvasY = worldToCanvas(0, worldY).y;
            const isAxis = worldY === 0;
            gridLayer.add(
                new KonvaLib.Line({
                    points: [boundTopLeft.x, canvasY, boundBottomRight.x, canvasY],
                    stroke: isAxis ? COLORS.axis : COLORS.grid,
                    strokeWidth: isAxis ? 2 : 1,
                }),
            );
            // Y-axis labels
            if (worldY % 2 === 0) {
        gridLayer.add(
                    new KonvaLib.Text({
                        x: boundTopLeft.x - 20,
                        y: canvasY - 5,
                        text: `${worldY}`,
                        fontSize: 10,
                        fill: COLORS.labelText,
            }),
        );
            }
        }

        // Sensor indicator at origin (0, 0)
        gridLayer.add(
            new KonvaLib.Circle({
                x: origin.x,
                y: origin.y,
                radius: 10,
                fill: COLORS.sensor,
                stroke: "#fff",
                strokeWidth: 3,
                shadowColor: COLORS.sensor,
                shadowBlur: 10,
                shadowOpacity: 0.5,
            }),
        );

        // Sensor label
        gridLayer.add(
            new KonvaLib.Text({
                x: origin.x + 15,
                y: origin.y - 6,
                text: "Sensor",
                fontSize: 11,
                fill: COLORS.sensor,
                fontStyle: "bold",
            }),
        );

        // Corner coordinate labels (design: top-left, bottom-left, top-right)
        const cornerFontSize = 10;
        const cornerFill = COLORS.labelText;
        gridLayer.add(
            new KonvaLib.Text({
                x: boundTopLeft.x,
                y: boundTopLeft.y - 14,
                text: `(${viewBoundsX.min},${viewBoundsY.min})`,
                fontSize: cornerFontSize,
                fill: cornerFill,
            }),
        );
        gridLayer.add(
            new KonvaLib.Text({
                x: boundTopLeft.x,
                y: boundBottomRight.y + 4,
                text: `(${viewBoundsX.min},${viewBoundsY.max})`,
                fontSize: cornerFontSize,
                fill: cornerFill,
            }),
        );
        gridLayer.add(
            new KonvaLib.Text({
                x: boundBottomRight.x - 28,
                y: boundTopLeft.y - 14,
                text: `(${viewBoundsX.max},${viewBoundsY.min})`,
                fontSize: cornerFontSize,
                fill: cornerFill,
            }),
        );

        gridLayer.batchDraw();
    }

    function setupArena() {
        if (!arena || !KonvaLib || !ZoneShapeClass || !mainLayer) return;
        // Destroy old if exists
        if (arenaShape) {
            arenaShape.destroy();
            arenaShape = null;
        }

        // Arena is likely a rectangle defined by startX/Y endX/Y
        // We convert to x,y,w,h for the Shape
        const p1 = worldToCanvas(arena.startX, arena.startY);
        const p2 = worldToCanvas(arena.endX, arena.endY);

        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);

        arenaShape = new ZoneShapeClass({
            name: "Tracking Area",
            x,
            y,
            width: w,
            height: h,
            fill: COLORS.arenaFill,
            stroke: COLORS.arena,
            draggable: !readonly,
            resizeMode: "rect", // Force rectangular resize
            canvasToWorld,
            worldToCanvas,
            onUpdate: (u) => {
                // Convert back to world coords
                const tl = canvasToWorld(u.x, u.y);
                const br = canvasToWorld(u.x + u.width, u.y + u.height);
                // Normalize + clamp to constraints so save/reload matches exactly
                const bounds = clampBounds(
                    normalizeBounds({
                        startX: tl.x,
                        startY: tl.y,
                        endX: br.x,
                        endY: br.y,
                    }),
                );

                dispatch("arenaChange", {
                    startX: parseFloat(bounds.startX.toFixed(2)),
                    startY: parseFloat(bounds.startY.toFixed(2)),
                    endX: parseFloat(bounds.endX.toFixed(2)),
                    endY: parseFloat(bounds.endY.toFixed(2)),
                });
            },
        });

        mainLayer.add(arenaShape.group);
    }

    function setupZones() {
        if (!KonvaLib || !ZoneShapeClass) return;
        // Clear existing
        zoneShapes.forEach((z) => z.destroy());
        zoneShapes = [];

        zones.forEach((z, i) => {
            // Do not draw inactive zones on the canvas
            if (z.active === false) return;

            const p1 = worldToCanvas(z.startX, z.startY);
            const p2 = worldToCanvas(z.endX, z.endY);
            const x = Math.min(p1.x, p2.x);
            const y = Math.min(p1.y, p2.y);
            const w = Math.abs(p2.x - p1.x);
            const h = Math.abs(p2.y - p1.y);
            
            // Use zone color or design palette by zone number/index
            const zonePaletteColors = getZoneColors(z.zoneNumber ?? i + 1);
            const strokeColor = z.color || zonePaletteColors.border;
            const fillWithAlpha = zonePaletteColors.fill + "40";

            const shape = new ZoneShapeClass({
                id: z.id,
                name: z.name || `Zone ${i + 1}`,
                x,
                y,
                width: w,
                height: h,
                stroke: strokeColor,
                fill: fillWithAlpha,
                draggable: !readonly,
                resizeMode: "rect", // Rectangular resize - all zones are rectangles
                canvasToWorld,
                worldToCanvas,
                onContextMenu: (e) => {
                    showContextMenu(e, i, z.name || `Zone ${i + 1}`);
                },
                onUpdate: (u) => {
                    // Update this zone in the list
                    const updatedZones = [...zones];
                    const tl = canvasToWorld(u.x, u.y);
                    const br = canvasToWorld(u.x + u.width, u.y + u.height);

                    // Normalize + clamp to RADAR_CONSTRAINTS only (not tracking area)
                    const bounds = clampBounds(
                        normalizeBounds({
                            startX: tl.x,
                            startY: tl.y,
                            endX: br.x,
                            endY: br.y,
                        }),
                        );

                    updatedZones[i] = {
                        ...z,
                        startX: parseFloat(bounds.startX.toFixed(2)),
                        startY: parseFloat(bounds.startY.toFixed(2)),
                        endX: parseFloat(bounds.endX.toFixed(2)),
                        endY: parseFloat(bounds.endY.toFixed(2)),
                    };
                    dispatch("zonesChange", updatedZones);
                },
            });

            zoneShapes.push(shape);
            mainLayer.add(shape.group);
        });

        mainLayer.batchDraw();
    }

    function addZone() {
        if (zones.length >= maxZones) return;

        // Calculate next zone number based on existing zones
        const existingNumbers = zones.map(z => z.zoneNumber || 0);
        const nextNumber = Math.max(0, ...existingNumbers) + 1;
        
        // Get color from design palette by zone number
        const zoneColor = getZoneBorderColor(nextNumber);

        // Default new zone: 2m x 2m centered, positioned based on zone count
        const yOffset = 1 + (zones.length * 1.5); // Stack zones vertically
        const newZone = {
            name: `Zone ${nextNumber}`,
            zoneNumber: nextNumber,
            color: zoneColor,
            startX: -1,
            startY: Math.min(yOffset, viewBoundsY.max - 2), // Don't exceed bounds
            endX: 1,
            endY: Math.min(yOffset + 2, viewBoundsY.max),
        };
        dispatch("zonesChange", [...zones, newZone]);
    }

    function showContextMenu(e: Konva.KonvaEventObject<PointerEvent>, zoneIndex: number, zoneName: string) {
        const containerRect = container.getBoundingClientRect();
        contextMenu = {
            visible: true,
            x: e.evt.clientX - containerRect.left,
            y: e.evt.clientY - containerRect.top,
            zoneIndex,
            zoneName,
        };
    }

    function hideContextMenu() {
        contextMenu.visible = false;
    }

    function deleteZone(index: number) {
        const updatedZones = zones.filter((_, i) => i !== index);
        dispatch("zonesChange", updatedZones);
        hideContextMenu();
    }

    function startRenameZone(index: number) {
        labelEdit = {
            visible: true,
            x: contextMenu.x,
            y: contextMenu.y,
            zoneIndex: index,
            value: zones[index]?.name || "",
        };
        hideContextMenu();
        // Focus input after render
        setTimeout(() => labelInput?.focus(), 0);
    }

    function confirmRenameZone() {
        if (labelEdit.zoneIndex >= 0 && labelEdit.value.trim()) {
            const newName = labelEdit.value.trim();
            const updatedZones = [...zones];
            updatedZones[labelEdit.zoneIndex] = {
                ...updatedZones[labelEdit.zoneIndex],
                name: newName,
            };
            
            // Update the zone shape label directly for immediate visual feedback
            if (zoneShapes[labelEdit.zoneIndex]) {
                zoneShapes[labelEdit.zoneIndex].updateConfig({ name: newName });
            }
            
            dispatch("zonesChange", updatedZones);
        }
        labelEdit.visible = false;
    }

    function cancelRenameZone() {
        labelEdit.visible = false;
    }

    async function initKonva() {
        // Load modules dynamically to enable SSR
        const konvaModule = await import("konva");
        KonvaLib = konvaModule.default;

        const zoneShapeModule = await import("./shapes/ZoneShape");
        ZoneShapeClass = zoneShapeModule.ZoneShape;

        // Compute optimal scale before creating stage
        currentScale = computeOptimalScale();
        gridSize = currentScale;

        const initialHeight = getContainerHeight();
        stage = new KonvaLib.Stage({
            container: container,
            width: container.clientWidth,
            height: initialHeight,
        });

        gridLayer = new KonvaLib.Layer({ listening: false }); // Static
        mainLayer = new KonvaLib.Layer(); // Interactive

        stage.add(gridLayer);
        stage.add(mainLayer);

        // Stage-level context menu handling
        stage.on("contextmenu", (e) => {
            e.evt.preventDefault();
            if (e.target === stage) {
                hideContextMenu();
            }
        });

        // Initial draw
        drawGrid();
        setupArena();
        setupZones();
    }

    // Reactivity
    $: if (container && !stage) {
        initKonva();
    }

    $: if (stage && (arena || zones)) {
        // Ideally we diff changes, but redundant setup isn't too expensive for < 10 shapes
        // We just need to preserve selection if we had it (TODO)
        drawGrid(); // In case size changed
        // We only rebuild if data fundamentally changed from outside.
        // If we originated the change, we might want to skip full rebuild to keep drag state?
        // But for now, full rebuild ensures sync.
        // Note: this might interrupt dragging if parent updates props immediately on drag.
        // Usually 'onUpdate' updates local state, parent passes it back.
        // Svelte reactivity loop might be jittery if we don't guard.
        // For this demo, we assume 'onUpdate' is fast enough or debounced in parent.

        // Simple optimization: don't rebuild if we are currently dragging?
        if (!stage.isDragging()) {
            // setupArena();
            // setupZones();
            // Actually, doing this on every prop update will kill the drag.
            // We should only rebuild if the PROPS mismatch the internal state significantly,
            // or rely on the Shape to update itself?
            // Best practice: The Shape class handles specific updates.
            // For now, let's just trigger a redraw of the layer, but NOT destroy/recreate shapes
            // unless the IDs/count changed.
        }
    }

    // Better Reactivity: Watch specific props
    // Track previous arena values for comparison
    let prevArena: typeof arena = null;
    
    // Helper to check if any shape is currently being dragged
    function isAnyShapeDragging(): boolean {
        if (arenaShape?.group.isDragging()) return true;
        if (zoneShapes.some(s => s.group.isDragging())) return true;
        return false;
    }
    
    $: if (stage && arena) {
        // Only update arena shape properties if no shape is being dragged
        if (arenaShape && !isAnyShapeDragging()) {
            // Check if arena actually changed
            const arenaChanged = !prevArena || 
                prevArena.startX !== arena.startX ||
                prevArena.startY !== arena.startY ||
                prevArena.endX !== arena.endX ||
                prevArena.endY !== arena.endY;
            
            if (arenaChanged) {
                // Update the arena shape position and size using updateConfig for proper sync
                const p1 = worldToCanvas(arena.startX, arena.startY);
                const p2 = worldToCanvas(arena.endX, arena.endY);
                const x = Math.min(p1.x, p2.x);
                const y = Math.min(p1.y, p2.y);
                const w = Math.abs(p2.x - p1.x);
                const h = Math.abs(p2.y - p1.y);
                
                arenaShape.updateConfig({ x, y, width: w, height: h });
                prevArena = { ...arena };
            }
        } else if (!arenaShape) {
            setupArena();
            prevArena = arena ? { ...arena } : null;
        }
    }

    // Track previous zones for comparison
    let prevZonesLength = 0;
    let prevZonesJson = "";

    $: if (stage && zones) {
        const zonesJson = JSON.stringify(
            zones.map((z) => ({
                id: z.id,
                name: z.name,
                color: z.color,
                zoneNumber: z.zoneNumber,
                active: z.active,
                startX: z.startX,
                startY: z.startY,
                endX: z.endX,
                endY: z.endY,
            })),
        );
        
        if (zones.length !== prevZonesLength) {
            // Zone count changed - rebuild all zones (but not while dragging)
            if (!isAnyShapeDragging()) {
                setupZones();
            }
            prevZonesLength = zones.length;
            prevZonesJson = zonesJson;
        } else if (zonesJson !== prevZonesJson) {
            // Zone properties or active changed - rebuild so inactive zones are removed from canvas
            if (!isAnyShapeDragging()) {
                setupZones();
            }
            prevZonesJson = zonesJson;
        }
    }

    function handleResize(): void {
        if (!stage || !container) return;
        const width = container.clientWidth;
        const height = getContainerHeight();
        if (!width || !height) return;

        stage.size({ width, height });

        // Keep the view fit-to-content on resize (best UX for responsive dialog/layout).
        const contentBounds = getContentBounds();
        currentScale = computeScaleToFitBounds(contentBounds);
        gridSize = currentScale;

        drawGrid();
        setupArena();
        setupZones();
    }

    onMount(() => {
        // Use ResizeObserver so we respond to dialog/sidebar/layout changes, not only window.resize.
        resizeObserver = new ResizeObserver(() => handleResize());
        resizeObserver.observe(container);

        // Also run once after mount to ensure correct sizing.
        setTimeout(() => handleResize(), 0);

        return () => {
            resizeObserver?.disconnect();
            resizeObserver = null;
        };
    });
</script>

<div class="space-y-2">
    <div class="flex flex-wrap justify-between items-center px-1 gap-2">
        <div class="flex items-center gap-1 sm:gap-2 flex-wrap">
            <!-- Zoom controls -->
            <div class="flex items-center border rounded-md bg-white">
                <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 w-8 p-0"
                    on:click={zoomOut}
                    disabled={currentScale <= MIN_SCALE}
                    title="Zoom out"
                >
                    <ZoomOut class="w-4 h-4" />
                </Button>
                <span class="text-xs text-muted-foreground w-12 text-center font-mono">
                    {zoomPercentage}%
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 w-8 p-0"
                    on:click={zoomIn}
                    disabled={currentScale >= MAX_SCALE}
                    title="Zoom in"
                >
                    <ZoomIn class="w-4 h-4" />
                </Button>
            </div>
            
            <!-- View controls -->
            <Button
                variant="outline"
                size="sm"
                on:click={fitToView}
                title="Fit to content"
            >
                <Maximize2 class="w-4 h-4 sm:mr-1" />
                <span class="hidden sm:inline">Fit</span>
            </Button>
            <Button
                variant="outline"
                size="sm"
                on:click={resetView}
                title="Reset to full view"
            >
                <RotateCcw class="w-4 h-4 sm:mr-1" />
                <span class="hidden sm:inline">Reset</span>
            </Button>
            
            <!-- Add Zone – hidden per design -->
            <Button
                size="sm"
                on:click={addZone}
                disabled={zones.length >= maxZones}
                class="hidden"
            >
                <Plus class="w-4 h-4 sm:mr-2" />
                <span class="hidden sm:inline">Add Zone</span>
            </Button>
        </div>
    </div>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="relative rounded-lg overflow-hidden border border-slate-700 shadow-sm radar-visual-editor-dark" on:click={hideContextMenu}>
        <div
            bind:this={container}
            class="radar-visual-editor-canvas w-full min-h-[320px] max-h-[60vh] aspect-[8/7]"
        ></div>

        {#if !arena}
            <div
                class="absolute inset-0 flex items-center justify-center text-slate-400 pointer-events-none"
            >
                Please define Tracking Area first
            </div>
        {/if}

        {#if contextMenu.visible}
            <div
                class="absolute z-50 bg-white border border-slate-200 rounded-md shadow-lg py-1 min-w-[140px]"
                style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
            >
                <div class="px-3 py-1 text-xs text-slate-500 border-b">
                    {contextMenu.zoneName}
                </div>
                <button
                    class="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                    on:click|stopPropagation={() =>
                        startRenameZone(contextMenu.zoneIndex)}
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                    </svg>
                    Rename
                </button>
                <button
                    class="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                    on:click|stopPropagation={() =>
                        deleteZone(contextMenu.zoneIndex)}
                >
                    <Trash2 class="w-4 h-4" />
                    Delete
                </button>
            </div>
        {/if}

        {#if labelEdit.visible}
            <div
                class="absolute z-50 bg-white border border-slate-200 rounded-md shadow-lg p-2"
                style="left: {labelEdit.x}px; top: {labelEdit.y}px;"
            >
                <input
                    bind:this={labelInput}
                    bind:value={labelEdit.value}
                    class="px-2 py-1 text-sm border rounded w-32"
                    placeholder="Zone name"
                    on:keydown={(e) => {
                        if (e.key === "Enter") confirmRenameZone();
                        if (e.key === "Escape") cancelRenameZone();
                    }}
                    on:blur={confirmRenameZone}
                />
            </div>
        {/if}
    </div>

    <!-- Legend: Sensor Origin | Tracking Area | Zones only -->
    <div class="radar-visual-editor-legend">
        <span class="radar-legend-item">
            <span class="radar-legend-icon radar-legend-sensor" aria-hidden="true"></span>
            Sensor Origin
        </span>
        <span class="radar-legend-item">
            <span class="radar-legend-icon radar-legend-arena" aria-hidden="true"></span>
            Tracking Area
        </span>
        <span class="radar-legend-item">
            <span class="radar-legend-icon radar-legend-zone" aria-hidden="true"></span>
            Zones
        </span>
    </div>
</div>

<style>
    .radar-visual-editor-dark .radar-visual-editor-canvas {
        background: #1A142A;
    }

    .radar-visual-editor-legend {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem 1.5rem;
        padding: 0.25rem 0.125rem;
        font-size: 0.75rem;
        line-height: 1rem;
        color: #64748b;
    }

    .radar-legend-item {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
    }

    .radar-legend-icon {
        flex-shrink: 0;
        display: block;
    }

    .radar-legend-sensor {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ef4444;
    }

    .radar-legend-arena {
        width: 10px;
        height: 10px;
        border: 1.5px solid #a78bfa;
        border-radius: 1px;
        background: transparent;
    }

    .radar-legend-zone {
        width: 10px;
        height: 10px;
        border: 1.5px solid #3b82f6;
        border-radius: 1px;
        background: transparent;
    }
</style>
