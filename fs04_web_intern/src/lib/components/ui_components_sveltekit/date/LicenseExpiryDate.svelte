<script lang="ts">
    import * as Tooltip from "$lib/components/ui/tooltip/index.js";
    import * as HoverCard from "$lib/components/ui/hover-card/index.js";
    import CalendarDays from "lucide-svelte/icons/calendar-days";
    import InfoIcon from "lucide-svelte/icons/info";
    import AlertCircle from "lucide-svelte/icons/alert-circle";
    import Clock from "lucide-svelte/icons/clock";
    
    export let date: Date | string | null;
    export let showTooltip = true;
    export let useHoverCard = false;
    export let iconSize = 14; // Size of the info icon in pixels
    
    // Safely convert string to Date if needed
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
    
    // Calculate relative time with "X Days Left" format
    function getRelativeTimeString(date: Date): string {
        const now = new Date();
        const diffInMs = date.getTime() - now.getTime();
        
        // Check if date is in the future
        const isFuture = diffInMs > 0;
        
        // If expired, just show "Expired" with days ago
        if (!isFuture) {
            // Use absolute difference for calculations
            const absDiffInMs = Math.abs(diffInMs);
            const diffInDays = Math.floor(absDiffInMs / (1000 * 60 * 60 * 24));
            return `Expired (${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago)`;
        }
        
        // For future dates, calculate time remaining
        const diffInSecs = Math.floor(diffInMs / 1000);
        const diffInMins = Math.floor(diffInSecs / 60);
        const diffInHours = Math.floor(diffInMins / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        const diffInMonths = Math.floor(diffInDays / 30);
        const diffInYears = Math.floor(diffInDays / 365);
        
        if (diffInDays === 0) {
            return 'Expires today';
        } else if (diffInDays === 1) {
            return '1 Day Left';
        } else if (diffInDays < 30) {
            return `${diffInDays} Days Left`;
        } else if (diffInMonths < 12) {
            return `${diffInMonths} ${diffInMonths === 1 ? 'Month' : 'Months'} Left`;
        } else {
            if (diffInMonths % 12 > 0) {
                return `${diffInYears} ${diffInYears === 1 ? 'Year' : 'Years'}, ${diffInMonths % 12} ${diffInMonths % 12 === 1 ? 'Month' : 'Months'} Left`;
            }
            return `${diffInYears} ${diffInYears === 1 ? 'Year' : 'Years'} Left`;
        }
    }
    
    const formattedDate = dateObj ? getRelativeTimeString(dateObj) : "Never";
    const tooltipDate = dateObj ? fullDateFormat.format(dateObj) : "No expiration date";
    
    // Format date for display in hover card
    const expiresDate = dateObj ? calendarFormat.format(dateObj) : "Never";
    
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
                                This license never expires
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
            <p>{tooltipDate}</p>
        </Tooltip.Content>
    </Tooltip.Root>
{/if}
