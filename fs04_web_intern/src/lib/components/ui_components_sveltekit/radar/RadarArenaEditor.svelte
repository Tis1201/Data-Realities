<!-- src/lib/components/ui_components_sveltekit/radar/RadarArenaEditor.svelte -->
<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import Konva from 'konva';
    import { Button } from '$lib/components/ui/button';
    import { Plus, Trash2, RotateCcw } from 'lucide-svelte';
    import { clampBounds, normalizeBounds, validateBounds, RADAR_CONSTRAINTS } from './constraints';
    import { getZoneColors } from './zoneColors';

    const dispatch = createEventDispatcher<{
        arenaChange: { startX: number; startY: number; endX: number; endY: number };
        zonesChange: Array<{ id?: string; name: string; startX: number; startY: number; endX: number; endY: number }>;
    }>();

    // Props
    export let arena: { startX: number; startY: number; endX: number; endY: number } | null = null;
    export let zones: Array<{ id?: string; name: string; startX: number; startY: number; endX: number; endY: number }> = [];
    export let maxZones = 5;
    export let readonly = false;

    // Internal state
    let container: HTMLDivElement;
    let stage: Konva.Stage;
    let layer: Konva.Layer;
    let gridLayer: Konva.Layer;
    let transformer: Konva.Transformer;
    
    // Scale: 1 meter = 50 pixels
    const SCALE = 50;
    const GRID_SIZE = SCALE; // 1 meter grid
    
    // Colors
    const COLORS = {
        arena: '#3b82f6',
        arenaFill: 'rgba(59, 130, 246, 0.1)',
        zone: '#10b981',
        zoneFill: 'rgba(16, 185, 129, 0.2)',
        sensor: '#ef4444',
        grid: '#e5e7eb',
        gridMajor: '#d1d5db',
        axis: '#6b7280',
        text: '#374151'
    };

    let arenaRect: Konva.Rect | null = null;
    let zoneRects: Konva.Rect[] = [];
    let selectedZoneIndex: number | null = null;

    function worldToCanvas(x: number, y: number): { x: number; y: number } {
        const centerX = stage.width() / 2;
        const centerY = stage.height() / 2;
        return {
            x: centerX + x * SCALE,
            y: centerY - y * SCALE // Y is inverted in canvas
        };
    }

    function canvasToWorld(x: number, y: number): { x: number; y: number } {
        const centerX = stage.width() / 2;
        const centerY = stage.height() / 2;
        const worldX = (x - centerX) / SCALE;
        const worldY = (centerY - y) / SCALE; // Y is inverted
        // Apply constraints
        return {
            x: Math.max(RADAR_CONSTRAINTS.X_MIN, Math.min(RADAR_CONSTRAINTS.X_MAX, worldX)),
            y: Math.max(RADAR_CONSTRAINTS.Y_MIN, Math.min(RADAR_CONSTRAINTS.Y_MAX, worldY)),
        };
    }

    function drawGrid() {
        gridLayer.destroyChildren();
        
        const width = stage.width();
        const height = stage.height();
        const centerX = width / 2;
        const centerY = height / 2;

        // Draw minor grid lines
        for (let x = centerX % GRID_SIZE; x < width; x += GRID_SIZE) {
            gridLayer.add(new Konva.Line({
                points: [x, 0, x, height],
                stroke: COLORS.grid,
                strokeWidth: 1
            }));
        }
        for (let y = centerY % GRID_SIZE; y < height; y += GRID_SIZE) {
            gridLayer.add(new Konva.Line({
                points: [0, y, width, y],
                stroke: COLORS.grid,
                strokeWidth: 1
            }));
        }

        // Constraint boundaries (visual indicators)
        const xMinPos = worldToCanvas(RADAR_CONSTRAINTS.X_MIN, 0);
        const xMaxPos = worldToCanvas(RADAR_CONSTRAINTS.X_MAX, 0);
        const yMaxPos = worldToCanvas(0, RADAR_CONSTRAINTS.Y_MAX);

        // Left boundary (x = -4)
        gridLayer.add(new Konva.Line({
            points: [xMinPos.x, 0, xMinPos.x, height],
            stroke: '#fbbf24', // Amber-400
            strokeWidth: 2,
            dash: [5, 5]
        }));

        // Right boundary (x = 4)
        gridLayer.add(new Konva.Line({
            points: [xMaxPos.x, 0, xMaxPos.x, height],
            stroke: '#fbbf24', // Amber-400
            strokeWidth: 2,
            dash: [5, 5]
        }));

        // Bottom boundary (y = 7)
        gridLayer.add(new Konva.Line({
            points: [0, yMaxPos.y, width, yMaxPos.y],
            stroke: '#fbbf24', // Amber-400
            strokeWidth: 2,
            dash: [5, 5]
        }));

        // Draw axes
        gridLayer.add(new Konva.Line({
            points: [0, centerY, width, centerY],
            stroke: COLORS.axis,
            strokeWidth: 2
        }));
        gridLayer.add(new Konva.Line({
            points: [centerX, 0, centerX, height],
            stroke: COLORS.axis,
            strokeWidth: 2
        }));

        // Draw sensor origin marker
        gridLayer.add(new Konva.Circle({
            x: centerX,
            y: centerY,
            radius: 8,
            fill: COLORS.sensor,
            stroke: '#fff',
            strokeWidth: 2
        }));
        gridLayer.add(new Konva.Text({
            x: centerX + 12,
            y: centerY - 20,
            text: 'Sensor (0,0)',
            fontSize: 12,
            fill: COLORS.sensor,
            fontStyle: 'bold'
        }));

        // Draw axis labels
        for (let i = -10; i <= 10; i++) {
            if (i === 0) continue;
            const pos = worldToCanvas(i, 0);
            gridLayer.add(new Konva.Text({
                x: pos.x - 8,
                y: pos.y + 5,
                text: `${i}m`,
                fontSize: 10,
                fill: COLORS.text
            }));
        }
        for (let i = -10; i <= 10; i++) {
            if (i === 0) continue;
            const pos = worldToCanvas(0, i);
            gridLayer.add(new Konva.Text({
                x: pos.x + 5,
                y: pos.y - 5,
                text: `${i}m`,
                fontSize: 10,
                fill: COLORS.text
            }));
        }

        gridLayer.batchDraw();
    }

    function createArenaRect() {
        if (!arena) return;

        const start = worldToCanvas(arena.startX, arena.startY);
        const end = worldToCanvas(arena.endX, arena.endY);

        arenaRect = new Konva.Rect({
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y),
            stroke: COLORS.arena,
            strokeWidth: 3,
            fill: COLORS.arenaFill,
            draggable: !readonly,
            name: 'arena'
        });

        if (!readonly) {
            arenaRect.on('dragend', updateArenaFromRect);
            arenaRect.on('transformend', updateArenaFromRect);
            arenaRect.on('click tap', () => {
                transformer.nodes([arenaRect!]);
                selectedZoneIndex = null;
                layer.batchDraw();
            });
        }

        layer.add(arenaRect);
    }

    function updateArenaFromRect() {
        if (!arenaRect) return;

        const topLeft = canvasToWorld(arenaRect.x(), arenaRect.y());
        const bottomRight = canvasToWorld(
            arenaRect.x() + arenaRect.width() * arenaRect.scaleX(),
            arenaRect.y() + arenaRect.height() * arenaRect.scaleY()
        );

        // Reset scale after transform
        arenaRect.scaleX(1);
        arenaRect.scaleY(1);
        arenaRect.width(arenaRect.width() * arenaRect.scaleX());
        arenaRect.height(arenaRect.height() * arenaRect.scaleY());

        // Normalize and clamp bounds
        let bounds = normalizeBounds({
            startX: Math.round(topLeft.x * 10) / 10,
            startY: Math.round(bottomRight.y * 10) / 10, // Note: Y is flipped
            endX: Math.round(bottomRight.x * 10) / 10,
            endY: Math.round(topLeft.y * 10) / 10
        });
        bounds = clampBounds(bounds);

        dispatch('arenaChange', bounds);
    }

    function createZoneRects() {
        zoneRects.forEach(rect => rect.destroy());
        zoneRects = [];

        zones.forEach((zone, index) => {
            if (!arena) return;

            // Zone coordinates are relative to arena top-left (0,0)
            const arenaStart = worldToCanvas(arena.startX, arena.endY);
            const zoneColors = getZoneColors(index + 1);
            const fillWithAlpha = zoneColors.fill + '40';

            const rect = new Konva.Rect({
                x: arenaStart.x + zone.startX * SCALE,
                y: arenaStart.y + zone.startY * SCALE,
                width: (zone.endX - zone.startX) * SCALE,
                height: (zone.endY - zone.startY) * SCALE,
                stroke: zoneColors.border,
                strokeWidth: 2,
                fill: fillWithAlpha,
                draggable: !readonly,
                name: `zone-${index}`
            });

            // Add zone label
            const label = new Konva.Text({
                x: arenaStart.x + zone.startX * SCALE + 5,
                y: arenaStart.y + zone.startY * SCALE + 5,
                text: zone.name || `Zone ${index + 1}`,
                fontSize: 12,
                fill: zoneColors.border,
                fontStyle: 'bold'
            });

            if (!readonly) {
                rect.on('dragend', () => updateZoneFromRect(index, rect));
                rect.on('transformend', () => updateZoneFromRect(index, rect));
                rect.on('click tap', () => {
                    transformer.nodes([rect]);
                    selectedZoneIndex = index;
                    layer.batchDraw();
                });
            }

            layer.add(rect);
            layer.add(label);
            zoneRects.push(rect);
        });
    }

    function updateZoneFromRect(index: number, rect: Konva.Rect) {
        if (!arena) return;

        const arenaStart = worldToCanvas(arena.startX, arena.endY);
        
        // Convert to world coordinates
        const worldStart = canvasToWorld(rect.x(), rect.y());
        const worldEnd = canvasToWorld(
            rect.x() + rect.width() * rect.scaleX(),
            rect.y() + rect.height() * rect.scaleY()
        );

        // Reset scale
        rect.scaleX(1);
        rect.scaleY(1);

        // Normalize and clamp bounds
        let bounds = normalizeBounds({
            startX: Math.round(worldStart.x * 10) / 10,
            startY: Math.round(worldStart.y * 10) / 10,
            endX: Math.round(worldEnd.x * 10) / 10,
            endY: Math.round(worldEnd.y * 10) / 10
        });
        bounds = clampBounds(bounds);

        // Clamp to Arena Bounds if arena exists
        if (arena) {
            const arenaMinX = Math.min(arena.startX, arena.endX);
            const arenaMaxX = Math.max(arena.startX, arena.endX);
            const arenaMinY = Math.min(arena.startY, arena.endY);
            const arenaMaxY = Math.max(arena.startY, arena.endY);

            bounds.startX = Math.max(arenaMinX, Math.min(bounds.startX, arenaMaxX));
            bounds.startY = Math.max(arenaMinY, Math.min(bounds.startY, arenaMaxY));
            bounds.endX = Math.max(arenaMinX, Math.min(bounds.endX, arenaMaxX));
            bounds.endY = Math.max(arenaMinY, Math.min(bounds.endY, arenaMaxY));
        }

        const updatedZones = [...zones];
        updatedZones[index] = {
            ...updatedZones[index],
            startX: bounds.startX,
            startY: bounds.startY,
            endX: bounds.endX,
            endY: bounds.endY
        };

        dispatch('zonesChange', updatedZones);
    }

    function addZone() {
        if (zones.length >= maxZones || !arena) return;

        const newZone = {
            name: `Zone ${zones.length + 1}`,
            startX: 0,
            startY: 0,
            endX: 1,
            endY: 1
        };

        dispatch('zonesChange', [...zones, newZone]);
    }

    function removeSelectedZone() {
        if (selectedZoneIndex === null) return;

        const updatedZones = zones.filter((_, i) => i !== selectedZoneIndex);
        selectedZoneIndex = null;
        transformer.nodes([]);
        dispatch('zonesChange', updatedZones);
    }

    function resetView() {
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        stage.batchDraw();
    }

    function redraw() {
        if (!layer) return;
        
        layer.destroyChildren();
        
        // Add transformer
        transformer = new Konva.Transformer({
            rotateEnabled: false,
            keepRatio: false,
            enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']
        });
        layer.add(transformer);

        createArenaRect();
        createZoneRects();
        
        layer.batchDraw();
    }

    onMount(() => {
        const width = container.clientWidth || 800;
        const height = 500;

        stage = new Konva.Stage({
            container: container,
            width,
            height,
            draggable: true
        });

        gridLayer = new Konva.Layer();
        layer = new Konva.Layer();
        
        stage.add(gridLayer);
        stage.add(layer);

        // Add transformer
        transformer = new Konva.Transformer({
            rotateEnabled: false,
            keepRatio: false,
            enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']
        });
        layer.add(transformer);

        drawGrid();
        redraw();

        // Zoom with scroll wheel
        stage.on('wheel', (e) => {
            e.evt.preventDefault();
            const scaleBy = 1.1;
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale
            };

            const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
            const clampedScale = Math.max(0.3, Math.min(3, newScale));

            stage.scale({ x: clampedScale, y: clampedScale });

            const newPos = {
                x: pointer.x - mousePointTo.x * clampedScale,
                y: pointer.y - mousePointTo.y * clampedScale
            };
            stage.position(newPos);
        });

        // Click on empty space to deselect
        stage.on('click tap', (e) => {
            if (e.target === stage) {
                transformer.nodes([]);
                selectedZoneIndex = null;
                layer.batchDraw();
            }
        });

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
            const newWidth = container.clientWidth;
            stage.width(newWidth);
            drawGrid();
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            stage.destroy();
        };
    });

    // Reactive redraw when props change
    $: if (stage && layer) {
        redraw();
    }

    $: if (arena || zones) {
        if (stage && layer) {
            redraw();
        }
    }
</script>

<div class="space-y-3">
    {#if !readonly}
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                on:click={addZone}
                disabled={zones.length >= maxZones || !arena}
            >
                <Plus class="h-4 w-4 mr-1" />
                Add Zone ({zones.length}/{maxZones})
            </Button>
            {#if selectedZoneIndex !== null}
            <Button 
                variant="destructive" 
                size="sm" 
                on:click={removeSelectedZone}
            >
                <Trash2 class="h-4 w-4 mr-1" />
                Remove Zone
            </Button>
            {/if}
        </div>
        <Button variant="ghost" size="sm" on:click={resetView}>
            <RotateCcw class="h-4 w-4 mr-1" />
            Reset View
        </Button>
    </div>
    {/if}

    <div 
        class="border rounded-lg bg-white overflow-hidden" 
        style="height: 500px; touch-action: none;"
        bind:this={container}
    ></div>

    <div class="flex items-center gap-4 text-xs text-muted-foreground">
        <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Sensor Origin (0,0)</span>
        </div>
        <div class="flex items-center gap-1">
            <div class="w-3 h-3 border-2 border-blue-500 bg-blue-100"></div>
            <span>Tracking Area</span>
        </div>
        <div class="flex items-center gap-1">
            <div class="w-3 h-3 border-2 border-green-500 bg-green-100"></div>
            <span>Zones</span>
        </div>
        <span class="ml-auto">Scroll to zoom • Drag to pan • Click to select • Constraints: X: [-4, 4], Y: [0, 7]</span>
    </div>
</div>
