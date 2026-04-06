<script lang="ts">
    import * as Tooltip from "$lib/components/ui/tooltip/index.js";
    import * as HoverCard from "$lib/components/ui/hover-card/index.js";
    import CalendarDays from "lucide-svelte/icons/calendar-days";
    import InfoIcon from "lucide-svelte/icons/info";
    
    export let date: Date | string;
    export let format: "relative" | "calendar" | "full" = "relative";
    export let showTooltip = true;
    export let useHoverCard = false;
    export let iconSize = 14; // Size of the info icon in pixels
    export let className = ""; // Add className prop with default empty string
    
    // Safely convert string to Date if needed
    // First check if date is valid
    const isValidDate = (date: Date | string): boolean => {
        if (!date) return false;
        const d = date instanceof Date ? date : new Date(date);
        return !isNaN(d.getTime());
    };
    
    const dateObj = isValidDate(date) ? (date instanceof Date ? date : new Date(date)) : new Date();
    
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
        // Use average days per month (30.44) for more accurate calculation
        // Use Math.round for months to handle edge cases better (e.g., 364 days = ~12 months)
        const diffInMonths = Math.round(diffInDays / 30.44);
        const diffInYears = Math.floor(diffInDays / 365.25);
        
        if (diffInSecs < 60) {
            if (!isFuture) {
                return diffInSecs <= 5 ? 'just now' : `${diffInSecs} seconds ago`;
            } else {
                return diffInSecs <= 5 ? 'in a moment' : `in ${diffInSecs} seconds`;
            }
        } else if (diffInMins < 60) {
            return isFuture 
                ? `in ${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'}` 
                : `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
        } else if (diffInHours < 24) {
            return isFuture 
                ? `in ${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'}` 
                : `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
        } else if (diffInDays < 30) {
            return isFuture 
                ? `in ${diffInDays} ${diffInDays === 1 ? 'day' : 'days'}` 
                : `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
        } else if (diffInMonths < 12 || diffInYears === 0) {
            // Show months if less than 12 months OR if years would be 0
            // This ensures dates close to 1 year show "12 months" instead of "0 years"
            return isFuture 
                ? `in ${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'}` 
                : `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
        } else {
            return isFuture 
                ? `in ${diffInYears} ${diffInYears === 1 ? 'year' : 'years'}` 
                : `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
        }
    }
    
    // Get the formatted date based on the selected format
    function getFormattedDate(): string {
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
    const tooltipDate = fullDateFormat.format(dateObj);
    
    // Format date for display in hover card
    const createdDate = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(dateObj);
</script>

{#if !showTooltip}
    <span class="{className}">{formattedDate}</span>
{:else if useHoverCard}
    <HoverCard.Root>
        <HoverCard.Trigger>
            <span class="inline-flex items-center group">
                <span class="{className}">{formattedDate}</span>
                <InfoIcon 
                    class="ml-1 text-muted-foreground group-hover:text-primary transition-colors duration-200" 
                    size={iconSize} 
                />
            </span>
        </HoverCard.Trigger>
        <HoverCard.Content class="w-80">
            <div class="flex justify-between space-x-4">
                <div class="space-y-1">
                    <h4 class="text-sm font-semibold">Date & Time</h4>
                    <p class="text-sm">{tooltipDate}</p>
                    <div class="flex items-center pt-2">
                        <CalendarDays class="mr-2 h-4 w-4 opacity-70" />
                        <span class="text-muted-foreground text-xs">
                            Created on {createdDate}
                        </span>
                    </div>
                </div>
            </div>
        </HoverCard.Content>
    </HoverCard.Root>
{:else}
    <Tooltip.Root>
        <Tooltip.Trigger>
            <span class="inline-flex items-center group">
                <span class="{className}">{formattedDate}</span>
                <InfoIcon 
                    class="ml-1 text-muted-foreground group-hover:text-primary transition-colors duration-200" 
                    size={iconSize} 
                />
            </span>
        </Tooltip.Trigger>
        <Tooltip.Content>
            <p>{tooltipDate}</p>
        </Tooltip.Content>
    </Tooltip.Root>
{/if}
