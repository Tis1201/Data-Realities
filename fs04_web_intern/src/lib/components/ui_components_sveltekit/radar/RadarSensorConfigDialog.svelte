<script lang="ts">
    import {
        Save,
        MapPin,
        Grid3x3,
        Eye,
        Plus,
        Pencil,
        Trash,
        Upload,
        CheckCircle2,
        AlertCircle,
        Clock,
    } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog";
    import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
    } from "$lib/components/ui/alert-dialog";
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/components/ui/tabs";
    import FormContainer from "$lib/components/ui_components_sveltekit/form/FormContainer.svelte";
    import FormRow from "$lib/components/ui_components_sveltekit/form/FormRow.svelte";
    import FormField from "$lib/components/ui_components_sveltekit/form/FormField.svelte";
    import RadarVisualEditor from "$lib/components/ui_components_sveltekit/radar/RadarVisualEditor.svelte";
    import { mqttStore } from "$lib/stores/mqtt-store";
    import { callUserRpc } from "$lib/client/mqtt/userRpc";
    import type { CoordinateBounds } from "./constraints";
    import { getZoneColors, getZoneBorderColor } from "$lib/components/ui_components_sveltekit/radar/zoneColors";

    // Type definitions
    interface Zone {
        id?: string;
        name: string;
        zoneNumber: number;
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        color?: string;
        description?: string;
        /** When false, zone is inactive. */
        active?: boolean;
    }

    interface TrackingArea {
        id?: string;
        name: string;
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        description?: string;
    }

    interface DwellBucket {
        id?: string;
        name: string;
        minDuration: number;
        maxDuration?: number;
        description?: string;
    }

    interface RadarConfig {
        trackingArea?: TrackingArea;
        zones?: Zone[];
        dwellBuckets?: DwellBucket[];
    }

    interface FormErrors {
        name?: string[];
        startX?: string[];
        startY?: string[];
        endX?: string[];
        endY?: string[];
        description?: string[];
        zoneNumber?: string[];
        color?: string[];
        minDuration?: string[];
        maxDuration?: string[];
        [key: string]: string[] | undefined;
    }

    interface FormState {
        submitting: boolean;
        errors: FormErrors;
        enhance: (form: HTMLFormElement) => { destroy: () => void };
    }

    interface LayoutData {
        arena: CoordinateBounds | null;
        zones: Array<{
            id?: string;
            name: string;
            startX: number;
            startY: number;
            endX: number;
            endY: number;
            color?: string;
            zoneNumber?: number;
            description?: string;
        }>;
    }

    // Props from parent
    export let open = false;
    export let config: RadarConfig | null = null;
    export let sensorName: string;
    export let sensorLocation: string = "";
    export let onSaveSensorInfo: (data: { name: string; location: string }) => void | Promise<void> = () => {};

    // Sensor info for MQTT operations
    export let sensorId: string = "";
    export let syncStatus: string = "SYNCED";
    export let isDeviceOnline: boolean = false;

    // Form Data Bindings (from SuperForms stores)
    export let trackingAreaForm: {
        name?: string;
        startX?: number;
        startY?: number;
        endX?: number;
        endY?: number;
        description?: string;
    };
    export let zoneForm: {
        name?: string;
        zoneNumber?: number;
        startX?: number;
        startY?: number;
        endX?: number;
        endY?: number;
        description?: string;
        color?: string;
    };
    export let dwellBucketForm: {
        name?: string;
        minDuration?: number;
        maxDuration?: number | null;
        description?: string;
        color?: string;
    };

    // Form States (submitting, errors, enhance)
    export let formStates: {
        trackingArea: FormState;
        zone: FormState;
        dwellBucket: FormState;
    };

    // Visual Editor State
    export let editorArena: CoordinateBounds | null = null;
    export let editorZones: Array<{
        id?: string;
        name: string;
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        color?: string;
        zoneNumber?: number;
        /** When false, zone is inactive. Preserved on Save Layout. */
        active?: boolean;
    }> = [];

    // Internal state
    let editSensorName = "";
    let editSensorLocation = "";
    let savingSensorInfo = false;
    let mainTab: "configuration" | "alert" = "configuration";
    let activeTab = "visual";
    let showZoneDialog = false;
    let editingZoneId: string | null = null;
    let zoneDialogForm = {
        name: "",
        zoneNumber: 1,
        color: getZoneBorderColor(1),
        description: "",
    };
    let isPushing = false;
    
    // Delete zone confirmation dialog state
    let showDeleteZoneDialog = false;
    let deleteZoneTarget: { index: number; name: string } | null = null;
    
    // Delete dwell bucket confirmation dialog state
    let showDeleteDwellBucketDialog = false;
    let deleteDwellBucketTarget: { id: string; name: string } | null = null;
    
    // Track if zones have been initialized from config (one-time copy)
    let zonesInitializedFromConfig = false;
    
    // Unsaved changes tracking
    let hasUnsavedChanges = false;
    let showUnsavedWarning = false;
    let pendingTab: string | null = null;
    
    // Track original state for comparison
    let originalArenaJson = "";
    let originalZonesJson = "";
    
    // Sync edit fields when dialog opens
    $: if (open && sensorName !== undefined) {
        editSensorName = sensorName;
        editSensorLocation = sensorLocation ?? "";
    }

    // Initialize editorZones from config when dialog opens (one-time copy)
    $: if (open && !zonesInitializedFromConfig) {
        if (editorZones.length === 0 && config?.zones && config.zones.length > 0) {
            editorZones = config.zones.map(z => ({
                id: z.id,
                name: z.name,
                startX: z.startX,
                startY: z.startY,
                endX: z.endX,
                endY: z.endY,
                color: z.color,
                zoneNumber: z.zoneNumber,
                active: z.active,
            }));
        }
        zonesInitializedFromConfig = true;
        originalArenaJson = JSON.stringify(editorArena);
        originalZonesJson = JSON.stringify(editorZones);
        hasUnsavedChanges = false;
    }
    
    // Reset initialization flag when dialog closes
    $: if (!open) {
        zonesInitializedFromConfig = false;
    }
    
    // Detect changes
    $: {
        const currentArenaJson = JSON.stringify(editorArena);
        const currentZonesJson = JSON.stringify(editorZones);
        hasUnsavedChanges = (currentArenaJson !== originalArenaJson) || 
                           (currentZonesJson !== originalZonesJson);
    }

    // Subscribe to MQTT status
    $: mqttStatus = $mqttStore.status;
    $: isMqttConnected = mqttStatus === "OPEN";
    
    // Handle tab change with unsaved changes check
    function handleTabChange(newTab: string): void {
        if (activeTab === "visual" && hasUnsavedChanges && newTab !== "visual") {
            pendingTab = newTab;
            showUnsavedWarning = true;
        } else {
            activeTab = newTab;
            // Sync form when switching to tracking tab
            if (newTab === "tracking") {
                syncEditorToForm();
            }
        }
    }
    
    // Sync editorArena to form (when switching from Visual Editor to Tracking tab)
    function syncEditorToForm(): void {
        if (editorArena) {
            trackingAreaForm.startX = editorArena.startX;
            trackingAreaForm.startY = editorArena.startY;
            trackingAreaForm.endX = editorArena.endX;
            trackingAreaForm.endY = editorArena.endY;
        }
    }
    
    function confirmDiscardChanges(): void {
        // Discard changes - reset to original
        if (originalArenaJson) {
            editorArena = JSON.parse(originalArenaJson);
        }
        if (originalZonesJson) {
            editorZones = JSON.parse(originalZonesJson);
        }
        hasUnsavedChanges = false;
        if (pendingTab) {
            activeTab = pendingTab;
            // Sync form when switching to tracking tab
            if (pendingTab === "tracking") {
                syncEditorToForm();
            }
            pendingTab = null;
        }
        showUnsavedWarning = false;
    }
    
    function cancelTabChange(): void {
        pendingTab = null;
        showUnsavedWarning = false;
    }
    
    async function saveAndSwitchTab(): Promise<void> {
        // Tracking Area is required
        if (!editorArena) {
            toast.error("Tracking Area is required. Please configure X Min, X Max, Y Min, and Y Max in the Tracking Area tab.");
            showUnsavedWarning = false;
            return;
        }
        const { validateBounds } = await import("$lib/components/ui_components_sveltekit/radar/constraints");
        const validation = validateBounds(editorArena);
        if (!validation.valid) {
            toast.error(`Invalid arena bounds: ${validation.errors.join(', ')}`);
            showUnsavedWarning = false;
            return;
        }
        if (editorZones && editorZones.length > 0) {
            const { validateBounds } = await import("$lib/components/ui_components_sveltekit/radar/constraints");
            for (const zone of editorZones) {
                const validation = validateBounds(zone);
                if (!validation.valid) {
                    toast.error(`Invalid zone "${zone.name}" bounds: ${validation.errors.join(', ')}`);
                    showUnsavedWarning = false;
                    return;
                }
            }
        }
        
        onSaveLayout({ arena: editorArena, zones: editorZones });
        
        // Update original state after save
        originalArenaJson = JSON.stringify(editorArena);
        originalZonesJson = JSON.stringify(editorZones);
        hasUnsavedChanges = false;
        
        if (pendingTab) {
            activeTab = pendingTab;
            pendingTab = null;
        }
        showUnsavedWarning = false;
    }

    // Dispatch events
    import { createEventDispatcher, tick } from "svelte";
    const dispatch = createEventDispatcher<{
        synced: void;
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

    // Push config to device via MQTT RPC. Use callUserRpc to avoid teardown/reconnect cycle (FIX_WEB_TIMEOUT).
    const PUSH_TIMEOUT_MS = 20000;

    async function handlePushToDevice(): Promise<void> {
        if (!sensorId) return;
        isPushing = true;
        try {
            const result = await callUserRpc<{
                result?: { synced?: boolean; syncStatus?: string; error?: string; appliedAt?: string };
                error?: string;
            }>("sensor.config.push", { sensorId }, { timeoutMs: PUSH_TIMEOUT_MS });

            const nestedResult = result?.result;
            const workerError = result?.error;

            if (workerError) {
                toast.error(typeof workerError === "string" ? workerError : "Push failed");
                syncStatus = "FAILED";
                return;
            }
            if (!nestedResult) {
                toast.error("Invalid response from server");
                syncStatus = "FAILED";
                return;
            }
            if (nestedResult.synced === true) {
                toast.success("Config pushed to device!");
                syncStatus = nestedResult.syncStatus || "SYNCED";
                await tick();
                dispatch("synced");
                return;
            }
            toast.error(nestedResult.error || "Push failed");
            syncStatus = nestedResult.syncStatus || "FAILED";
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Push failed";
            toast.error(msg);
            syncStatus = "FAILED";
        } finally {
            isPushing = false;
        }
    }

    function handleArenaChange(event: CustomEvent<CoordinateBounds>): void {
        editorArena = event.detail;
        // Sync to form
        if (trackingAreaForm) {
            trackingAreaForm.startX = event.detail.startX;
            trackingAreaForm.startY = event.detail.startY;
            trackingAreaForm.endX = event.detail.endX;
            trackingAreaForm.endY = event.detail.endY;
        }
    }
    
    // Sync form changes to Visual Editor (bidirectional sync)
    function syncFormToEditor(): void {
        if (trackingAreaForm.startX !== undefined && 
            trackingAreaForm.startY !== undefined && 
            trackingAreaForm.endX !== undefined && 
            trackingAreaForm.endY !== undefined) {
            editorArena = {
                startX: Number(trackingAreaForm.startX),
                startY: Number(trackingAreaForm.startY),
                endX: Number(trackingAreaForm.endX),
                endY: Number(trackingAreaForm.endY),
            };
        }
    }

    function handleZonesChange(event: CustomEvent<Array<{
        id?: string;
        name: string;
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        color?: string;
        zoneNumber?: number;
    }>>): void {
        editorZones = event.detail;
        dispatch("zonesChange", event.detail);
    }

    // Zone numbering logic - always use editorZones
    $: nextZoneNumber = editorZones.length > 0
        ? Math.max(0, ...editorZones.map((z) => z.zoneNumber || 0)) + 1
        : 1;

    function openCreateZone(): void {
        editingZoneId = null;
        const zoneCount = editorZones.length;
        zoneDialogForm = {
            name: "",
            zoneNumber: nextZoneNumber,
            color: getZoneBorderColor(zoneCount + 1),
            description: "",
        };
        showZoneDialog = true;
    }

    // Track which zone index we're editing (for local edits)
    let editingZoneIndex: number = -1;
    
    // Zone type for edit dialog - more flexible to handle both config.zones and editorZones
    interface EditableZone {
        id?: string;
        name: string;
        zoneNumber?: number;
        color?: string;
        description?: string;
        startX: number;
        startY: number;
        endX: number;
        endY: number;
    }
    
    function openEditZone(zone: EditableZone): void {
        // Find the zone index in editorZones
        editingZoneIndex = editorZones.findIndex(z => 
            (z.id && z.id === zone.id) || 
            (z.name === zone.name && z.zoneNumber === zone.zoneNumber)
        );
        editingZoneId = zone.id || null;
        zoneDialogForm = {
            name: zone.name,
            zoneNumber: zone.zoneNumber || nextZoneNumber,
            color: zone.color || getZoneBorderColor(zone.zoneNumber ?? editingZoneIndex + 1),
            description: zone.description || "",
        };
        showZoneDialog = true;
    }
    
    // Save zone changes to editorZones (local state, syncs with Visual Editor)
    function saveZoneChanges(): void {
        if (editingZoneIndex >= 0 && editingZoneIndex < editorZones.length) {
            // Update existing zone
            const updatedZones = [...editorZones];
            updatedZones[editingZoneIndex] = {
                ...updatedZones[editingZoneIndex],
                name: zoneDialogForm.name,
                zoneNumber: zoneDialogForm.zoneNumber,
                color: zoneDialogForm.color,
            };
            editorZones = updatedZones;
            dispatch("zonesChange", updatedZones);
            toast.success(`Zone "${zoneDialogForm.name}" updated`);
        } else {
            // Create new zone
            const newZone = {
                name: zoneDialogForm.name,
                zoneNumber: zoneDialogForm.zoneNumber,
                color: zoneDialogForm.color,
                startX: -1,
                startY: 1 + (editorZones.length * 1.5),
                endX: 1,
                endY: 3 + (editorZones.length * 1.5),
            };
            editorZones = [...editorZones, newZone];
            dispatch("zonesChange", editorZones);
            toast.success(`Zone "${zoneDialogForm.name}" created`);
        }
        showZoneDialog = false;
        editingZoneIndex = -1;
        editingZoneId = null;
    }
    
    // Delete zone from list - shows confirmation dialog
    function handleDeleteZoneFromList(index: number, zoneName: string): void {
        deleteZoneTarget = { index, name: zoneName };
        showDeleteZoneDialog = true;
    }
    
    // Confirm delete zone
    function confirmDeleteZone(): void {
        if (deleteZoneTarget) {
            const { index } = deleteZoneTarget;
            // Make a copy and remove the zone at index
            const updatedZones = [...editorZones];
            if (index >= 0 && index < updatedZones.length) {
                updatedZones.splice(index, 1);
                editorZones = updatedZones;
                dispatch("zonesChange", updatedZones);
                toast.success(`Zone "${deleteZoneTarget.name}" deleted`);
            }
        }
        showDeleteZoneDialog = false;
        deleteZoneTarget = null;
    }
    
    // Cancel delete zone
    function cancelDeleteZone(): void {
        showDeleteZoneDialog = false;
        deleteZoneTarget = null;
    }
    
    // Delete dwell bucket - shows confirmation dialog
    function handleDeleteDwellBucketFromList(id: string, name: string): void {
        deleteDwellBucketTarget = { id, name };
        showDeleteDwellBucketDialog = true;
    }
    
    // Confirm delete dwell bucket
    function confirmDeleteDwellBucket(): void {
        if (deleteDwellBucketTarget) {
            onDeleteDwellBucket(deleteDwellBucketTarget.id, deleteDwellBucketTarget.name);
            toast.success(`Dwell bucket "${deleteDwellBucketTarget.name}" deleted`);
        }
        showDeleteDwellBucketDialog = false;
        deleteDwellBucketTarget = null;
    }
    
    // Cancel delete dwell bucket
    function cancelDeleteDwellBucket(): void {
        showDeleteDwellBucketDialog = false;
        deleteDwellBucketTarget = null;
    }
    
    // Add zone from Zone List - syncs with Visual Editor
    function addZoneFromList(): void {
        const zoneCount = editorZones.length;
        const newZone = {
            name: `Zone ${nextZoneNumber}`,
            zoneNumber: nextZoneNumber,
            color: getZoneBorderColor(zoneCount + 1),
            startX: -1,
            startY: 1 + (zoneCount * 1.5),
            endX: 1,
            endY: 3 + (zoneCount * 1.5),
        };
        editorZones = [...editorZones, newZone];
        dispatch("zonesChange", editorZones);
    }

    // We need to proxy the delete actions up
    export let onDeleteZone: (id: string, name: string) => void;
    export let onDeleteDwellBucket: (id: string, name: string) => void;
    export let onSaveLayout: (data: LayoutData) => void;

    async function handleSaveSensorInfo(): Promise<void> {
        const name = (editSensorName || "").trim();
        if (!name) {
            toast.error("Sensor name is required.");
            return;
        }
        savingSensorInfo = true;
        try {
            await onSaveSensorInfo({ name, location: editSensorLocation?.trim() ?? "" });
        } finally {
            savingSensorInfo = false;
        }
    }
</script>

<Dialog bind:open>
    <DialogContent class="max-w-[95vw] w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden [&>button.absolute]:hidden">
        <!-- Header -->
        <div
            class="px-4 md:px-6 py-3 md:py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/20"
        >
            <div class="flex items-center gap-3 min-w-0">
                <div class="min-w-0">
                    <DialogTitle class="truncate">Edit Device</DialogTitle>
                    <DialogDescription class="hidden sm:block"
                        >Manage tracking area, zones, and dwell buckets.</DialogDescription
                    >
                </div>
                <!-- Sync Status Badge -->
                {#if syncStatus === "SYNCED"}
                    <Badge
                        variant="outline"
                        class="bg-green-100 text-green-700 border-green-300"
                    >
                        <CheckCircle2 class="h-3 w-3 mr-1" /> Synced
                    </Badge>
                {:else if syncStatus === "PENDING"}
                    <Badge
                        variant="outline"
                        class="bg-yellow-100 text-yellow-700 border-yellow-300"
                    >
                        <Clock class="h-3 w-3 mr-1" /> Pending
                    </Badge>
                {:else if syncStatus === "FAILED"}
                    <Badge
                        variant="outline"
                        class="bg-red-100 text-red-700 border-red-300"
                    >
                        <AlertCircle class="h-3 w-3 mr-1" /> Failed
                    </Badge>
                {/if}
            </div>
            <div class="flex flex-wrap items-center gap-2 justify-end">
                <Button variant="outline" size="sm" class="sm:size-default" on:click={() => (open = false)}
                    >Close</Button
                >
                <Button
                    size="sm"
                    class="sm:size-default {hasUnsavedChanges ? 'animate-pulse' : ''}"
                    on:click={async () => {
                        // Tracking Area is required
                        if (!editorArena) {
                            toast.error("Tracking Area is required. Please configure X Min, X Max, Y Min, and Y Max in the Tracking Area tab.");
                            return;
                        }
                        const { validateBounds } = await import("$lib/components/ui_components_sveltekit/radar/constraints");
                        const arenaValidation = validateBounds(editorArena);
                        if (!arenaValidation.valid) {
                            toast.error(`Invalid arena bounds: ${arenaValidation.errors.join(', ')}`);
                            return;
                        }
                        if (editorZones && editorZones.length > 0) {
                            const { validateBounds } = await import("$lib/components/ui_components_sveltekit/radar/constraints");
                            for (const zone of editorZones) {
                                const validation = validateBounds(zone);
                                if (!validation.valid) {
                                    toast.error(`Invalid zone "${zone.name}" bounds: ${validation.errors.join(', ')}`);
                                    return;
                                }
                            }
                        }
                        onSaveLayout({
                            arena: editorArena,
                            zones: editorZones,
                        });
                        // Reset unsaved changes tracking
                        originalArenaJson = JSON.stringify(editorArena);
                        originalZonesJson = JSON.stringify(editorZones);
                        hasUnsavedChanges = false;
                    }}
                >
                    <Save class="h-4 w-4 mr-2" /> 
                    {hasUnsavedChanges ? "Save Layout *" : "Save Layout"}
                </Button>
                <Button
                    variant="default"
                    class="bg-blue-600 hover:bg-blue-700"
                    on:click={handlePushToDevice}
                    disabled={isPushing || !sensorId || !isDeviceOnline}
                    title={!isDeviceOnline
                        ? "Device is offline - cannot push config"
                        : "Push config to device"}
                >
                    <Upload class="h-4 w-4 mr-2" />
                    {isPushing ? "Pushing..." : "Push to Device"}
                </Button>
            </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 overflow-auto p-4 md:p-6 bg-background">
            <!-- Top-level: Sensor Name + Location (per design) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 md:mb-6 pb-4 border-b">
                <div class="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div class="space-y-2">
                        <label for="edit-sensor-name" class="text-sm font-medium">Sensor Name *</label>
                        <Input
                            id="edit-sensor-name"
                            class="flex-1 w-full"
                            bind:value={editSensorName}
                            placeholder="Enter sensor name"
                        />
                    </div>
                    <div class="space-y-2">
                        <label for="edit-sensor-location" class="text-sm font-medium">Location</label>
                        <Input
                            id="edit-sensor-location"
                            class="flex-1 w-full"
                            bind:value={editSensorLocation}
                            placeholder="Enter location"
                        />
                    </div>
                    <Button
                        size="sm"
                        class="sm:size-default"
                        on:click={handleSaveSensorInfo}
                        disabled={savingSensorInfo}
                    >
                        {savingSensorInfo ? "Saving…" : "Save"}
                    </Button>
                </div>
            </div>
            <!-- Tabs: Configuration | Alert (per design) -->
            <Tabs value={mainTab} class="w-full h-full flex flex-col">
                <TabsList class="mb-4 md:mb-6 w-full sm:w-fit flex-wrap h-auto gap-1">
                    <TabsTrigger
                        value="configuration"
                        on:click={() => (mainTab = "configuration")}
                        data-state={mainTab === "configuration" ? "active" : "inactive"}
                        class="flex-1 sm:flex-none"
                    >
                        Configuration
                    </TabsTrigger>
                    <TabsTrigger
                        value="alert"
                        on:click={() => (mainTab = "alert")}
                        data-state={mainTab === "alert" ? "active" : "inactive"}
                        class="flex-1 sm:flex-none"
                    >
                        Alert
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="configuration" class="mt-0 flex flex-col flex-1 min-h-0">
                    <Tabs value={activeTab} class="w-full h-full flex flex-col flex-1 min-h-0">
                <TabsList class="mb-4 md:mb-6 w-full sm:w-fit flex-wrap h-auto gap-1">
                    <TabsTrigger 
                        value="visual"
                        on:click={() => handleTabChange("visual")}
                        data-state={activeTab === "visual" ? "active" : "inactive"}
                        class="flex-1 sm:flex-none"
                    >
                        <Eye class="h-4 w-4 sm:mr-2" />
                        <span class="hidden sm:inline">Visual Editor</span>
                        {#if hasUnsavedChanges && activeTab === "visual"}
                            <span class="ml-1 w-2 h-2 bg-amber-500 rounded-full" title="Unsaved changes"></span>
                        {/if}
                    </TabsTrigger>
                    <TabsTrigger 
                        value="tracking"
                        on:click={() => handleTabChange("tracking")}
                        data-state={activeTab === "tracking" ? "active" : "inactive"}
                        class="flex-1 sm:flex-none"
                    >
                        <MapPin class="h-4 w-4 sm:mr-2" />
                        <span class="hidden sm:inline">Tracking Area</span>
                        {#if hasUnsavedChanges}
                            <span class="w-2 h-2 rounded-full bg-yellow-500 ml-1" title="Unsaved changes"></span>
                        {/if}
                    </TabsTrigger>
                    <TabsTrigger 
                        value="zones"
                        on:click={() => handleTabChange("zones")}
                        data-state={activeTab === "zones" ? "active" : "inactive"}
                        class="flex-1 sm:flex-none"
                    >
                        <Grid3x3 class="h-4 w-4 sm:mr-2" />
                        <span class="hidden sm:inline">Zones List</span>
                        {#if hasUnsavedChanges}
                            <span class="w-2 h-2 rounded-full bg-yellow-500 ml-1" title="Unsaved changes"></span>
                        {/if}
                    </TabsTrigger>
                    <TabsTrigger 
                        value="dwell"
                        on:click={() => handleTabChange("dwell")}
                        data-state={activeTab === "dwell" ? "active" : "inactive"}
                        class="flex-1 sm:flex-none"
                    >
                        <div class="h-4 w-4 sm:mr-2 flex items-center justify-center font-bold text-xs">
                            DB
                        </div>
                        <span class="hidden sm:inline">Dwell Buckets</span>
                    </TabsTrigger>
                </TabsList>

                <!-- Visual Editor Tab -->
                <TabsContent
                    value="visual"
                    class="flex-1 space-y-3"
                >
                    <RadarVisualEditor
                        arena={editorArena}
                        zones={editorZones}
                        maxZones={5}
                        on:arenaChange={handleArenaChange}
                        on:zonesChange={handleZonesChange}
                    />
                    <div class="bg-amber-50 border border-amber-200 rounded-md px-4 py-2 text-sm text-amber-800">
                        <strong>Note:</strong> Visual changes are local. Click <strong>Save Layout</strong> in the header to persist them to the database.
                    </div>
                </TabsContent>

                <!-- Tracking Area Form Tab -->
                <TabsContent value="tracking" class="max-w-2xl">
                    <div class="border rounded-lg p-6">
                        <h3 class="text-lg font-medium mb-4">
                            Tracking Area Configuration
                        </h3>
                        
                        <!-- Info banner explaining sync behavior -->
                        <div class="bg-blue-50 border border-blue-200 rounded-md px-4 py-2 text-sm text-blue-800 mb-4">
                            <strong>Tip:</strong> Changes here sync with Visual Editor. Click <strong>Save Layout</strong> in header to persist.
                        </div>
                        
                        <div class="space-y-4">
                            <FormRow columns={2}>
                                <FormField
                                    id="ta_name"
                                    label="Area Name"
                                    required
                                >
                                    <Input
                                        name="name"
                                        bind:value={trackingAreaForm.name}
                                        placeholder="e.g. Main Hall"
                                    />
                                </FormField>
                            </FormRow>

                            <div class="bg-muted/30 p-4 rounded">
                                <h4 class="text-sm font-semibold mb-3">
                                    Dimensions (Meters)
                                </h4>
                                <FormRow columns={2}>
                                    <FormField
                                        id="ta_startX"
                                        label="Start X"
                                        required
                                    >
                                        <Input
                                            name="startX"
                                            type="number"
                                            step="0.1"
                                            min="-4"
                                            max="4"
                                            required
                                            bind:value={trackingAreaForm.startX}
                                            on:input={() => syncFormToEditor()}
                                        />
                                    </FormField>
                                    <FormField
                                        id="ta_startY"
                                        label="Start Y"
                                        required
                                    >
                                        <Input
                                            name="startY"
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="7"
                                            required
                                            bind:value={trackingAreaForm.startY}
                                            on:input={() => syncFormToEditor()}
                                        />
                                    </FormField>
                                </FormRow>
                                <FormRow columns={2}>
                                    <FormField
                                        id="ta_endX"
                                        label="End X"
                                        required
                                    >
                                        <Input
                                            name="endX"
                                            type="number"
                                            step="0.1"
                                            min="-4"
                                            max="4"
                                            required
                                            bind:value={trackingAreaForm.endX}
                                            on:input={() => syncFormToEditor()}
                                        />
                                    </FormField>
                                    <FormField
                                        id="ta_endY"
                                        label="End Y"
                                        required
                                    >
                                        <Input
                                            name="endY"
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="7"
                                            required
                                            bind:value={trackingAreaForm.endY}
                                            on:input={() => syncFormToEditor()}
                                        />
                                    </FormField>
                                </FormRow>
                            </div>
                            
                            <!-- Current values preview -->
                            <div class="text-xs text-muted-foreground font-mono bg-muted/20 p-2 rounded">
                                Current: ({trackingAreaForm.startX ?? 0}, {trackingAreaForm.startY ?? 0}) → ({trackingAreaForm.endX ?? 0}, {trackingAreaForm.endY ?? 0})
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <!-- Zones List Tab -->
                <TabsContent value="zones">
                    <!-- Always use editorZones directly for display (initialized from config when dialog opens) -->
                    <div class="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {#if !config?.trackingArea && !editorArena}
                            <div
                                class="col-span-full text-center py-10 text-muted-foreground"
                            >
                                Configure Tracking Area first.
                            </div>
                        {:else if editorZones.length === 0}
                            <div
                                class="col-span-full text-center py-10 border-2 border-dashed rounded-lg"
                            >
                                <p class="mb-4">No zones configured.</p>
                                <Button on:click={addZoneFromList}
                                    ><Plus class="h-4 w-4 mr-2" /> Add Zone</Button
                                >
                            </div>
                        {:else}
                            {#each editorZones as zone, zoneIndex (zone.id || zone.name + zoneIndex)}
                                <div
                                    class="border rounded-lg p-3 sm:p-4 bg-card shadow-sm flex flex-col justify-between min-h-[100px]"
                                >
                                    <div>
                                        <div class="flex items-center justify-between mb-2 gap-2">
                                            <div class="flex items-center gap-2 min-w-0 flex-1">
                                                <span
                                                    class="zone-icon flex-shrink-0 rounded"
                                                    style="width: 24px; height: 24px; background-color: {getZoneColors(zone.zoneNumber ?? zoneIndex + 1).fill}; border: 1px solid {getZoneColors(zone.zoneNumber ?? zoneIndex + 1).border};"
                                                ></span>
                                                <span class="font-medium truncate">{zone.name}</span>
                                            </div>
                                            <Badge variant="outline" class="flex-shrink-0">#{zone.zoneNumber}</Badge>
                                        </div>
                                        <p class="text-xs text-muted-foreground font-mono">
                                            ({zone.startX.toFixed(1)}, {zone.startY.toFixed(1)}) → ({zone.endX.toFixed(1)}, {zone.endY.toFixed(1)})
                                        </p>
                                    </div>
                                    <div class="flex justify-end gap-1 mt-3 pt-2 border-t">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            on:click={() => openEditZone(zone)}
                                            title="Edit zone"
                                        >
                                            <Pencil class="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            class="text-destructive hover:bg-destructive/10"
                                            on:click={() => handleDeleteZoneFromList(zoneIndex, zone.name)}
                                            title="Delete zone"
                                        >
                                            <Trash class="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            {/each}
                            {#if editorZones.length < 5}
                                <button
                                    class="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground hover:border-primary transition-colors"
                                    on:click={addZoneFromList}
                                >
                                    <Plus class="h-8 w-8 mb-2" />
                                    <span>Add Zone</span>
                                </button>
                            {/if}
                        {/if}
                    </div>
                </TabsContent>

                <!-- Dwell Buckets Tab -->
                <TabsContent value="dwell" class="max-w-2xl">
                    <div class="space-y-6">
                        <!-- List -->
                        <div class="border rounded-lg divide-y">
                            <div class="p-4 font-medium bg-muted/20">
                                Configured Buckets
                            </div>
                            {#if !config?.dwellBuckets?.length}
                                <div
                                    class="p-8 text-center text-muted-foreground"
                                >
                                    No dwell buckets defined.
                                </div>
                            {:else}
                                {#each config.dwellBuckets as bucket (bucket.id || bucket.name)}
                                    <div
                                        class="p-4 flex items-center justify-between"
                                    >
                                        <div>
                                            <p class="font-medium">
                                                {bucket.name}
                                            </p>
                                            <p
                                                class="text-xs text-muted-foreground"
                                            >
                                                {bucket.minDuration}s - {bucket.maxDuration
                                                    ? bucket.maxDuration + "s"
                                                    : "∞"}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            class="text-destructive"
                                            on:click={() =>
                                                handleDeleteDwellBucketFromList(
                                                    bucket.id || '',
                                                    bucket.name,
                                                )}
                                            title="Delete dwell bucket"
                                            ><Trash class="h-4 w-4" /></Button
                                        >
                                    </div>
                                {/each}
                            {/if}
                        </div>

                        <!-- Create Form -->
                        <div class="border rounded-lg p-6">
                            <h4 class="font-medium mb-4">Add New Bucket</h4>
                            <FormContainer
                                method="POST"
                                action="?/createDwellBucket"
                                enhance={formStates.dwellBucket.enhance}
                                novalidate
                            >
                                <FormRow columns={2}>
                                    <FormField
                                        id="db_name"
                                        label="Name"
                                        error={formStates.dwellBucket.errors
                                            .name}
                                        required
                                    >
                                        <Input
                                            name="name"
                                            bind:value={dwellBucketForm.name}
                                            placeholder="e.g. Browsing"
                                        />
                                    </FormField>
                                    <FormField
                                        id="db_color"
                                        label="Color"
                                        error={formStates.dwellBucket.errors
                                            .color}
                                    >
                                        <Input
                                            name="color"
                                            type="color"
                                            bind:value={dwellBucketForm.color}
                                            class="h-10 w-full"
                                        />
                                    </FormField>
                                </FormRow>
                                <FormRow columns={2}>
                                    <FormField
                                        id="db_min"
                                        label="Min Duration (s)"
                                        error={formStates.dwellBucket.errors
                                            .minDuration}
                                        required
                                    >
                                        <Input
                                            name="minDuration"
                                            type="number"
                                            min="0"
                                            bind:value={
                                                dwellBucketForm.minDuration
                                            }
                                        />
                                    </FormField>
                                    <FormField
                                        id="db_max"
                                        label="Max Duration (s)"
                                        error={formStates.dwellBucket.errors
                                            .maxDuration}
                                    >
                                        <Input
                                            name="maxDuration"
                                            type="number"
                                            min="0"
                                            bind:value={
                                                dwellBucketForm.maxDuration
                                            }
                                            placeholder="Leave empty for ∞"
                                        />
                                    </FormField>
                                </FormRow>
                                <div class="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={formStates.dwellBucket
                                            .submitting}>Add Bucket</Button
                                    >
                                </div>
                            </FormContainer>
                        </div>
                    </div>
                </TabsContent>
                    </Tabs>
                </TabsContent>
                <TabsContent value="alert" class="mt-0 py-4">
                    <p class="text-muted-foreground text-sm">Alert rules and notification channels will appear here when available.</p>
                </TabsContent>
            </Tabs>
        </div>
    </DialogContent>
</Dialog>

<!-- Nested Zone Dialog - Local editing (syncs with Visual Editor) -->
<Dialog bind:open={showZoneDialog}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>
                {editingZoneIndex >= 0 ? "Edit Zone" : "Create Zone"}
            </DialogTitle>
            <DialogDescription>
                {editingZoneIndex >= 0 
                    ? "Update zone properties. Changes sync with Visual Editor."
                    : "Create a new zone. It will appear in Visual Editor."}
            </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 mt-4">
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label for="zone_name" class="text-sm font-medium">Name *</label>
                    <Input
                        id="zone_name"
                        bind:value={zoneDialogForm.name}
                        placeholder="e.g. Living Room"
                    />
                </div>
                <div class="space-y-2">
                    <label for="zone_number" class="text-sm font-medium">Number *</label>
                    <Input
                        id="zone_number"
                        type="number"
                        bind:value={zoneDialogForm.zoneNumber}
                        min="1"
                        max="10"
                    />
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label for="zone_color" class="text-sm font-medium">Color</label>
                    <div class="flex items-center gap-2">
                        <Input
                            id="zone_color"
                            type="color"
                            bind:value={zoneDialogForm.color}
                            class="h-10 w-16"
                        />
                        <span class="text-xs text-muted-foreground">{zoneDialogForm.color}</span>
                    </div>
                </div>
                <div></div>
            </div>
            
            <div class="space-y-2">
                <label for="zone_desc" class="text-sm font-medium">Description</label>
                <Textarea
                    id="zone_desc"
                    bind:value={zoneDialogForm.description}
                    placeholder="Optional description..."
                    rows={2}
                />
            </div>
            
            <div class="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" on:click={() => { showZoneDialog = false; editingZoneIndex = -1; }}>
                    Cancel
                </Button>
                <Button 
                    on:click={saveZoneChanges}
                    disabled={!zoneDialogForm.name.trim()}
                >
                    {editingZoneIndex >= 0 ? "Update Zone" : "Create Zone"}
                </Button>
            </div>
        </div>
    </DialogContent>
</Dialog>

<!-- Unsaved Changes Warning Dialog -->
<Dialog bind:open={showUnsavedWarning}>
    <DialogContent class="max-w-md">
        <DialogHeader>
            <DialogTitle class="flex items-center gap-2 text-amber-600">
                <AlertCircle class="h-5 w-5" />
                Unsaved Changes
            </DialogTitle>
            <DialogDescription>
                You have unsaved changes in the Visual Editor. What would you like to do?
            </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-3 mt-4">
            <Button 
                on:click={saveAndSwitchTab}
                class="w-full"
            >
                <Save class="h-4 w-4 mr-2" />
                Save Changes & Continue
            </Button>
            <Button 
                variant="outline"
                on:click={confirmDiscardChanges}
                class="w-full text-destructive border-destructive hover:bg-destructive/10"
            >
                <Trash class="h-4 w-4 mr-2" />
                Discard Changes
            </Button>
            <Button 
                variant="ghost"
                on:click={cancelTabChange}
                class="w-full"
            >
                Cancel
            </Button>
        </div>
    </DialogContent>
</Dialog>

<!-- Delete Zone Confirmation Dialog -->
<AlertDialog bind:open={showDeleteZoneDialog}>
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Delete Zone</AlertDialogTitle>
            <AlertDialogDescription>
                Are you sure you want to delete zone "<strong>{deleteZoneTarget?.name || ''}</strong>"? 
                This action cannot be undone.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel on:click={cancelDeleteZone}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                on:click={confirmDeleteZone}
                class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                Delete
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>

<!-- Delete Dwell Bucket Confirmation Dialog -->
<AlertDialog bind:open={showDeleteDwellBucketDialog}>
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Delete Dwell Bucket</AlertDialogTitle>
            <AlertDialogDescription>
                Are you sure you want to delete dwell bucket "<strong>{deleteDwellBucketTarget?.name || ''}</strong>"? 
                This action cannot be undone.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel on:click={cancelDeleteDwellBucket}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                on:click={confirmDeleteDwellBucket}
                class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                Delete
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
