<script lang="ts">
    /**
     * Reusable page header component with title and optional action button
     * The action button can be provided via a slot for maximum flexibility
     * Height is standardized regardless of whether an action button is present
     */
    
    // Props
    export let title: string;
</script>

<div class="flex justify-between items-center h-10 mb-4">
    <h2 class="text-3xl font-bold tracking-tight">{title}</h2>
    
    <div class="min-h-[40px] flex items-center">
        <slot name="action">
            <!-- Default empty action slot -->
        </slot>
    </div>
</div>

<!-- Support for default slot content -->
<slot></slot>
