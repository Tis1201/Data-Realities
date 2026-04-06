import Konva from 'konva';
import { clampCoordinate, RADAR_CONSTRAINTS } from '../constraints';

export interface ZoneShapeConfig {
    id?: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: string;
    stroke?: string;
    draggable?: boolean;
    resizeMode?: 'vertex' | 'rect'; // 'vertex' = arbitrary polygon, 'rect' = strict rectangle
    onUpdate?: (data: { x: number; y: number; width: number; height: number }) => void;
    onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>, shape: ZoneShape) => void;
    canvasToWorld?: (cx: number, cy: number) => { x: number; y: number };
    worldToCanvas?: (x: number, y: number) => { x: number; y: number };
}

export class ZoneShape {
    public group: Konva.Group;
    public config: ZoneShapeConfig;
    private line: Konva.Line = new Konva.Line();
    private handles: Konva.Circle[] = [];
    private label: Konva.Text = new Konva.Text({});

    constructor(config: ZoneShapeConfig) {
        this.config = config;
        this.group = new Konva.Group({
            x: config.x,
            y: config.y,
            draggable: config.draggable,
            name: config.id || config.name || 'zone'
        });

        this.createShapes();
        this.attachEvents();
    }

    private createShapes() {
        const { width, height, stroke, fill, name } = this.config;

        // Main Polygon (Rectangle)
        this.line = new Konva.Line({
            points: [0, 0, width, 0, width, height, 0, height],
            fill: fill || 'rgba(16, 185, 129, 0.2)',
            stroke: stroke || '#10b981',
            strokeWidth: 2,
            closed: true,
            name: 'zone-shape',
            hitStrokeWidth: 10, // Easier to click
        });

        this.group.add(this.line);

        // Label
        this.label = new Konva.Text({
            text: name,
            x: 5,
            y: 5,
            fontSize: 12,
            fill: '#000',
            listening: false
        });
        this.group.add(this.label);

        // Handles (Top-Left, Top-Right, Bottom-Right, Bottom-Left)
        const handlePositions = [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: width, y: height },
            { x: 0, y: height }
        ];

        handlePositions.forEach((pos, index) => {
            const handle = new Konva.Circle({
                x: pos.x,
                y: pos.y,
                radius: 6,
                fill: '#fff',
                stroke: '#666',
                strokeWidth: 1,
                draggable: this.config.draggable,
                name: `handle-${index}`
            });
            this.handles.push(handle);
            this.group.add(handle);
        });
    }

    private attachEvents() {
        // Context menu (right-click) - attach to both group and line for better hit detection
        const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
            e.evt.preventDefault();
            e.cancelBubble = true;
            if (this.config.onContextMenu) {
                this.config.onContextMenu(e, this);
            }
        };
        this.group.on('contextmenu', handleContextMenu);
        this.line.on('contextmenu', handleContextMenu);

        if (!this.config.draggable) return;

        this.group.on('dragmove', () => {
            // Constrain dragging so the WHOLE shape stays inside bounds (all 4 edges),
            // not just the group's top-left.
            if (!this.config.canvasToWorld || !this.config.worldToCanvas) return;

            const xs = this.handles.map(h => h.x());
            const ys = this.handles.map(h => h.y());
            const minX = Math.min(...xs);
            const minY = Math.min(...ys);
            const maxX = Math.max(...xs);
            const maxY = Math.max(...ys);

            // Canvas-space bounds of the shape (including negative local coords after resize)
            const canvasLeft = this.group.x() + minX;
            const canvasTop = this.group.y() + minY;
            const canvasRight = this.group.x() + maxX;
            const canvasBottom = this.group.y() + maxY;

            const tlWorld = this.config.canvasToWorld(canvasLeft, canvasTop);
            const brWorld = this.config.canvasToWorld(canvasRight, canvasBottom);

            const widthWorld = brWorld.x - tlWorld.x;
            const heightWorld = brWorld.y - tlWorld.y;

            // Clamp the top-left such that right/bottom remain within constraints
            const clampedWorldX = Math.max(
                RADAR_CONSTRAINTS.X_MIN,
                Math.min(tlWorld.x, RADAR_CONSTRAINTS.X_MAX - widthWorld),
            );
            const clampedWorldY = Math.max(
                RADAR_CONSTRAINTS.Y_MIN,
                Math.min(tlWorld.y, RADAR_CONSTRAINTS.Y_MAX - heightWorld),
            );

            const clampedCanvasTL = this.config.worldToCanvas(clampedWorldX, clampedWorldY);

            // Convert back to group position (group.x + minX = canvasLeft)
            this.group.x(clampedCanvasTL.x - minX);
            this.group.y(clampedCanvasTL.y - minY);
        });

        this.group.on('dragend', () => {
            // Use bounding-box based calculation to avoid wrong width/height after handle-resize
            this.updateDimensions();
        });

        // Handle dragging logic
        this.handles.forEach((handle, index) => {
            handle.on('dragmove', (e) => {
                e.cancelBubble = true; // Prevent group drag
                this.updateShapeFromHandles(index);
            });

            handle.on('dragend', () => {
                this.updateDimensions();
            });
        });
    }

    private updateShapeFromHandles(draggedHandleIndex?: number) {
        if (draggedHandleIndex === undefined) return;
        
            const handles = this.handles;
            const dragged = handles[draggedHandleIndex];

        // Get current world coordinates for constraint checking
        let draggedWorldX = dragged.x();
        let draggedWorldY = dragged.y();
        
        if (this.config.canvasToWorld) {
            const worldPos = this.config.canvasToWorld(
                this.group.x() + dragged.x(),
                this.group.y() + dragged.y()
            );
            draggedWorldX = worldPos.x;
            draggedWorldY = worldPos.y;
        }

        // Apply RADAR_CONSTRAINTS to world coordinates
        const constrainedWorldX = clampCoordinate(draggedWorldX, 'x');
        const constrainedWorldY = clampCoordinate(draggedWorldY, 'y');

        // Convert back to canvas coordinates if needed
        let constrainedCanvasX = dragged.x();
        let constrainedCanvasY = dragged.y();
        
        if (this.config.worldToCanvas && this.config.canvasToWorld) {
            const constrainedCanvas = this.config.worldToCanvas(constrainedWorldX, constrainedWorldY);
            constrainedCanvasX = constrainedCanvas.x - this.group.x();
            constrainedCanvasY = constrainedCanvas.y - this.group.y();
        }

        // Update the dragged handle to clamped position
        dragged.x(constrainedCanvasX);
        dragged.y(constrainedCanvasY);

        if (this.config.resizeMode === 'rect') {
            // Rectangular resizing: update ADJACENT handles to maintain rectangle
            // 0: TL, 1: TR, 2: BR, 3: BL
            // 0 & 1 share Y (top), 2 & 3 share Y (bottom)
            // 0 & 3 share X (left), 1 & 2 share X (right)

            if (draggedHandleIndex === 0) { // TL
                handles[1].y(constrainedCanvasY); // TR shares Y
                handles[3].x(constrainedCanvasX); // BL shares X
            } else if (draggedHandleIndex === 1) { // TR
                handles[0].y(constrainedCanvasY); // TL shares Y
                handles[2].x(constrainedCanvasX); // BR shares X
            } else if (draggedHandleIndex === 2) { // BR
                handles[3].y(constrainedCanvasY); // BL shares Y
                handles[1].x(constrainedCanvasX); // TR shares X
            } else if (draggedHandleIndex === 3) { // BL
                handles[2].y(constrainedCanvasY); // BR shares Y
                handles[0].x(constrainedCanvasX); // TL shares X
            }
        }
        // For free-form mode (no resizeMode or resizeMode !== 'rect'),
        // only the dragged handle moves - allowing polygon shapes

        const points: number[] = [];
        this.handles.forEach(handle => {
            points.push(handle.x(), handle.y());
        });
        this.line.points(points);

        // Keep label anchored to the current top-left of the shape (minX/minY),
        // so it moves correctly when resizing changes the local coordinate space.
        const xs = this.handles.map(h => h.x());
        const ys = this.handles.map(h => h.y());
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        this.label.position({ x: minX + 5, y: minY + 5 });

        // Optimize: use batchDraw from parent layer if possible, or request frame
        this.group.getLayer()?.batchDraw();
    }

    private updateDimensions() {
        // Calculate bounding box from current handle positions
        const xs = this.handles.map(h => h.x());
        const ys = this.handles.map(h => h.y());
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        const width = maxX - minX;
        const height = maxY - minY;
        
        // Calculate new group position (canvas coords of top-left)
        const newGroupX = this.group.x() + minX;
        const newGroupY = this.group.y() + minY;
        
        // Normalize: move group to new position and reset local coords to start at (0,0)
        // This prevents drift accumulation and keeps the shape a proper rectangle
        this.group.x(newGroupX);
        this.group.y(newGroupY);
        
        // Reset handles to normalized positions
        this.handles[0].position({ x: 0, y: 0 });           // TL
        this.handles[1].position({ x: width, y: 0 });       // TR
        this.handles[2].position({ x: width, y: height });  // BR
        this.handles[3].position({ x: 0, y: height });      // BL
        
        // Update line points to match
        this.line.points([0, 0, width, 0, width, height, 0, height]);
        
        // Reset label to top-left
        this.label.position({ x: 5, y: 5 });
        
        // Update stored config
        this.config.x = newGroupX;
        this.config.y = newGroupY;
        this.config.width = width;
        this.config.height = height;
        
        // Emit update
        if (this.config.onUpdate) {
            this.config.onUpdate({
                x: newGroupX,
                y: newGroupY,
                width: width,
                height: height
            });
        }
        
        this.group.getLayer()?.batchDraw();
    }

    public updateConfig(newConfig: Partial<ZoneShapeConfig>) {
        if (newConfig.x !== undefined) {
            this.config.x = newConfig.x;
            this.group.x(newConfig.x);
        }
        if (newConfig.y !== undefined) {
            this.config.y = newConfig.y;
            this.group.y(newConfig.y);
        }
        if (newConfig.width !== undefined || newConfig.height !== undefined) {
            const w = newConfig.width ?? this.config.width;
            const h = newConfig.height ?? this.config.height;
            this.config.width = w;
            this.config.height = h;
            // Keep it a rectangle: reset points and handles
            this.line.points([0, 0, w, 0, w, h, 0, h]);
            if (this.handles.length === 4) {
                this.handles[0].position({ x: 0, y: 0 });
                this.handles[1].position({ x: w, y: 0 });
                this.handles[2].position({ x: w, y: h });
                this.handles[3].position({ x: 0, y: h });
            }
            // Anchor label to top-left inside shape
            this.label.position({ x: 5, y: 5 });
        }
        if (newConfig.fill !== undefined) {
            this.config.fill = newConfig.fill;
            this.line.fill(newConfig.fill);
        }
        if (newConfig.name !== undefined) {
            this.config.name = newConfig.name;
            this.label.text(newConfig.name);
        }
        if (newConfig.stroke !== undefined) {
            this.config.stroke = newConfig.stroke;
            this.line.stroke(newConfig.stroke);
            // Update handles to match new color
            this.handles.forEach(h => h.stroke(newConfig.stroke!));
        }
        this.group.getLayer()?.batchDraw();
    }

    public getName(): string {
        return this.config.name;
    }

    public getId(): string | undefined {
        return this.config.id;
    }

    public destroy() {
        this.group.destroy();
    }
}
