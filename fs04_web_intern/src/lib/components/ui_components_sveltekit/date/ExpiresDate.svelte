<script lang="ts">
    import * as Tooltip from "$lib/components/ui/tooltip/index.js";
    import * as HoverCard from "$lib/components/ui/hover-card/index.js";
    import CalendarDays from "lucide-svelte/icons/calendar-days";
    import InfoIcon from "lucide-svelte/icons/info";
    import AlertCircle from "lucide-svelte/icons/alert-circle";
    import Clock from "lucide-svelte/icons/clock";
    
    export let date: Date | string | null;
    export let format: "relative" | "calendar" | "full" = "relative";
    export let showTooltip = true;
    export let useHoverCard = false;
    export let iconSize = 14; // Size of the info icon in pixels
    
    // Safely convert string to Date if needed
    // First check if date is valid
    const isValidDate = (date: Date | string | null): boolean => {
        if (!date) return false;
        const d = date instanceof Date ? date : new Date(date);
        return !isNaN(d.getTime());
    };
    
    const dateObj = isValidDate(date) ? (date instanceof Date ? date : new Date(date)) : null;
    
    // Format for tooltip (full date and time)
    const fullDateFormat = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    });
    
    // Format for calendar date (day, month, year)
    const calendarFormat = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Calculate relative time (e.g., "2 hours ago" or "in 2 hours")
    function getRelativeTimeString(date: Date): string {
        const now = new Date();
        const diffInMs = date.getTime() - now.getTime();
        
        // Check if date is in the future
        const isFuture = diffInMs > 0;
        
        // Use absolute difference for calculations
        const absDiffInMs = Math.abs(diffInMs);
        const diffInSecs = Math.floor(absDiffInMs / 1000);
        const diffInMins = Math.floor(diffInSecs / 60);
        const diffInHours = Math.floor(diffInMins / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        const diffInMonths = Math.floor(diffInDays / 30);
        const diffInYears = Math.floor(diffInDays / 365);
        
        if (diffInSecs < 60) {
            if (!isFuture) {
                return diffInSecs <= 5 ? 'expired just now' : `expired ${diffInSecs} seconds ago`;
            } else {
                return diffInSecs <= 5 ? 'expires in a moment' : `expires in ${diffInSecs} seconds`;
            }
        } else if (diffInMins < 60) {
            return isFuture 
                ? `expires in ${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'}` 
                : `expired ${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
        } else if (diffInHours < 24) {
            return isFuture 
                ? `expires in ${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'}` 
                : `expired ${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
        } else if (diffInDays < 30) {
            return isFuture 
                ? `expires in ${diffInDays} ${diffInDays === 1 ? 'day' : 'days'}` 
                : `expired ${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
        } else if (diffInMonths < 12) {
            return isFuture 
                ? `expires in ${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'}` 
                : `expired ${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
        } else {
            return isFuture 
                ? `expires in ${diffInYears} ${diffInYears === 1 ? 'year' : 'years'}` 
                : `expired ${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
        }
    }
    
    // Get the formatted date based on the selected format
    function getFormattedDate(): string {
        if (!dateObj) return "Never";
        
        switch (format) {
            case "relative":
                return getRelativeTimeString(dateObj);
            case "calendar":
                return calendarFormat.format(dateObj);
            case "full":
                return fullDateFormat.format(dateObj);
            default:
                return getRelativeTimeString(dateObj);
        }
    }
    
    const formattedDate = getFormattedDate();
    const tooltipDate = dateObj ? fullDateFormat.format(dateObj) : "No expiration date";
    
    // Format date for display in hover card
    const expiresDate = dateObj ? new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(dateObj) : "Never";
    
    // Check if expired
    const isExpired = dateObj ? dateObj.getTime() < new Date().getTime() : false;
    
    // Determine text color based on expiration status
    let textColorClass = "";
    if (!dateObj) {
        textColorClass = "text-muted-foreground";
    } else if (isExpired) {
        textColorClass = "text-destructive";
    } else {
        const now = new Date();
        const diffInDays = Math.floor((dateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffInDays < 7) {
            textColorClass = "text-warning";
        } else {
            textColorClass = "text-success";
        }
    }
</script>

{#if !showTooltip}
    <span class={textColorClass}>{formattedDate}</span>
{:else if useHoverCard}
    <HoverCard.Root>
        <HoverCard.Trigger>
            <span class="inline-flex items-center group">
                <span class={textColorClass}>{formattedDate}</span>
                <InfoIcon 
                    class="ml-1 text-muted-foreground group-hover:text-primary transition-colors duration-200" 
                    size={iconSize} 
                />
            </span>
        </HoverCard.Trigger>
        <HoverCard.Content class="w-80">
            <div class="flex justify-between space-x-4">
                <div class="space-y-1">
                    <h4 class="text-sm font-semibold">Expiration Details</h4>
                    <p class="text-sm">{tooltipDate}</p>
                    <div class="flex items-center pt-2">
                        {#if !dateObj}
                            <Clock class="mr-2 h-4 w-4 opacity-70" />
                            <span class="text-muted-foreground text-xs">
                                This API key never expires
                            </span>
                        {:else if isExpired}
                            <AlertCircle class="mr-2 h-4 w-4 text-destructive" />
                            <span class="text-destructive text-xs">
                                Expired on {expiresDate}
                            </span>
                        {:else}
                            <CalendarDays class="mr-2 h-4 w-4 opacity-70" />
                            <span class="text-muted-foreground text-xs">
                                Expires on {expiresDate}
                            </span>
                        {/if}
                    </div>
                </div>
            </div>
        </HoverCard.Content>
    </HoverCard.Root>
{:else}
    <Tooltip.Root>
        <Tooltip.Trigger>
            <span class="inline-flex items-center group">
                <span class={textColorClass}>{formattedDate}</span>
                <InfoIcon 
                    class="ml-1 text-muted-foreground group-hover:text-primary transition-colors duration-200" 
                    size={iconSize} 
                />
            </span>
        </Tooltip.Trigger>
        <Tooltip.Content>
            {#if !dateObj}
                <p>This API key never expires</p>
            {:else if isExpired}
                <p>Expired on {expiresDate}</p>
            {:else}
                <p>Expires on {expiresDate}</p>
            {/if}
        </Tooltip.Content>
    </Tooltip.Root>
{/if}
