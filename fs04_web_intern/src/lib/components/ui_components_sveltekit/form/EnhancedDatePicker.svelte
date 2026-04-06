<script lang="ts">
    /**
     * A reusable enhanced date picker component that works well with sveltekit-superforms
     * and follows the project's UI standards.
     */
    import { createEventDispatcher, onMount } from 'svelte';
    import { format, isValid, addDays, addMonths, addYears, getMonth, getYear, getDaysInMonth, startOfMonth, getDay, parse, isBefore, startOfDay } from 'date-fns';
    import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Popover from '$lib/components/ui/popover';
    import { cn } from '$lib/utils/ui-utils';
    
    // Props
    export let form: any; // The form data
    export let field: string; // The field name in the form
    export let placeholder: string = 'Select date';
    export let format_string: string = 'yyyy-MM-dd';
    export let disabled: boolean = false;
    export let clearable: boolean = true;
    export let id: string = '';
    export let name: string = field;
    export let buttonClass: string = '';
    export let error: string | null = null; // Allow passing error directly
    export let showFutureDates: boolean = false; // Show future date options instead of past
    export let timelineOptions: 'past' | 'future' | 'both' = 'both'; // Which timeline options to show
    export let defaultTimeline: 'past' | 'future' = showFutureDates ? 'future' : 'past'; // Default timeline to show
    export let yearRange: number = 50; // Number of years before and after current year
    export let minDate: Date | null = null; // Minimum selectable date (dates before this will be disabled)
    
    // Get value from form; accept Date or string and normalize to Date
    let value: Date | null;
    $: {
        const raw = form[field];
        if (!raw) {
            value = null;
        } else if (raw instanceof Date) {
            value = raw;
        } else if (typeof raw === 'string') {
            // Try ISO then fallback to provided format_string
            const iso = new Date(raw);
            if (!isNaN(iso.getTime())) {
                value = iso;
            } else {
                try {
                    const parsed = parse(raw, format_string, new Date());
                    value = isValid(parsed) ? parsed : null;
                } catch {
                    value = null;
                }
            }
        } else {
            value = null;
        }
    }
    
    // Create a dispatcher for the change event
    const dispatch = createEventDispatcher<{
        change: { date: Date | null };
        clear: void;
    }>();
    
    // Active timeline state
    let activeTimeline = defaultTimeline;
    
    // Function for selecting preset dates
    function selectPresetDate(date: Date) {
        // Check if date is before minDate
        if (minDate && isBefore(startOfDay(date), startOfDay(minDate))) {
            return; // Don't allow selecting dates before minDate
        }
        value = date;
        // Store as formatted string so validators expecting string work
        form[field] = format(date, format_string);
        dispatch('change', { date });
        // Close the popover after selecting a preset date
        isOpen = false;
    }
    
    // Date preset options - filter out dates before minDate
    $: {
        const today = new Date();
        const pastOptions = [
            { label: 'Today', date: today },
            { label: 'Yesterday', date: addDays(today, -1) },
            { label: 'Last Week', date: addDays(today, -7) },
            { label: 'Last Month', date: addMonths(today, -1) }
        ];
        
        const futureOptions = [
            { label: 'Today', date: today },
            { label: 'Tomorrow', date: addDays(today, 1) },
            { label: 'Next Week', date: addDays(today, 7) },
            { label: 'Next Month', date: addMonths(today, 1) },
            { label: 'Next Year', date: addYears(today, 1) },
            { label: '2 Years', date: addYears(today, 2) }
        ];
        
        // Filter out dates before minDate
        const filterByMinDate = (options: Array<{ label: string; date: Date }>) => {
            if (!minDate) return options;
            return options.filter(opt => !isBefore(startOfDay(opt.date), startOfDay(minDate)));
        };
        
        pastDateOptions = filterByMinDate(pastOptions).map(opt => ({
            label: opt.label,
            action: () => selectPresetDate(opt.date)
        }));
        
        futureDateOptions = filterByMinDate(futureOptions).map(opt => ({
            label: opt.label,
            action: () => selectPresetDate(opt.date)
        }));
    }
    
    let pastDateOptions: Array<{ label: string; action: () => void }> = [];
    let futureDateOptions: Array<{ label: string; action: () => void }> = [];
    
    $: dateOptions = activeTimeline === 'past' ? pastDateOptions : futureDateOptions;
    
    // Calendar state
    let currentMonth = new Date();
    let calendarDays: Array<Date | null> = [];
    let isOpen = false;
    let showMonthYearSelector = false;
    let monthInputValue = '';
    let yearInputValue = '';
    
    // Generate years array for selector (current year ± yearRange)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: yearRange * 2 + 1 }, (_, i) => currentYear - yearRange + i);
    
    // Generate months array for selector
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    $: if (value) {
        const valueMonth = new Date(value.getFullYear(), value.getMonth(), 1);
        // If value is before minDate, start at minDate's month instead
        if (minDate && isBefore(startOfMonth(valueMonth), startOfMonth(minDate))) {
            currentMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        } else {
            currentMonth = valueMonth;
        }
    } else if (minDate) {
        // If no value but minDate exists, start at minDate's month
        currentMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    }
    
    $: {
        monthInputValue = format(currentMonth, 'MMMM');
        yearInputValue = format(currentMonth, 'yyyy');
    }
    
    $: monthLabel = format(currentMonth, 'MMMM yyyy');
    
    $: calendarDays = generateCalendarDays(currentMonth);
    
    // Set initial timeline based on props
    onMount(() => {
        activeTimeline = defaultTimeline;
    });
    
    function generateCalendarDays(month: Date): Array<Date | null> {
        const days: Array<Date | null> = [];
        const firstDayOfMonth = startOfMonth(month);
        const daysInMonth = getDaysInMonth(month);
        const dayOfWeek = getDay(firstDayOfMonth); // 0 = Sunday, 6 = Saturday
        
        // Add empty slots for days before the first day of the month
        for (let i = 0; i < dayOfWeek; i++) {
            days.push(null);
        }
        
        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(getYear(month), getMonth(month), i));
        }
        
        // Add empty slots to complete 6 rows (42 cells) for consistent height
        const totalCells = 42; // 6 rows × 7 days
        const remainingCells = totalCells - days.length;
        for (let i = 0; i < remainingCells; i++) {
            days.push(null);
        }
        
        return days;
    }
    
    function previousMonth() {
        const newMonth = addMonths(currentMonth, -1);
        // Don't allow navigating to months before minDate
        if (minDate && isBefore(startOfMonth(newMonth), startOfMonth(minDate))) {
            return;
        }
        currentMonth = newMonth;
    }
    
    function nextMonth() {
        currentMonth = addMonths(currentMonth, 1);
    }
    
    function selectDate(date: Date) {
        // Check if date is before minDate
        if (minDate && isBefore(startOfDay(date), startOfDay(minDate))) {
            return; // Don't allow selecting dates before minDate
        }
        value = date;
        // Store as formatted string so validators expecting string work
        form[field] = format(date, format_string);
        dispatch('change', { date });
        // Close the popover after selecting a date
        isOpen = false;
    }
    
    // Check if a date is disabled (before minDate)
    function isDateDisabled(date: Date): boolean {
        if (!minDate) return false;
        return isBefore(startOfDay(date), startOfDay(minDate));
    }
    
    // Check if previous month button should be disabled
    function isPreviousMonthDisabled(): boolean {
        if (!minDate) return false;
        const prevMonth = addMonths(currentMonth, -1);
        return isBefore(startOfMonth(prevMonth), startOfMonth(minDate));
    }
    
    function clearDate(e: MouseEvent) {
        e.stopPropagation();
        value = null;
        form[field] = ''; // Update form value as empty string
        dispatch('clear');
    }
    
    function formatDisplayDate(date: Date | null): string {
        if (!date || !isValid(date)) return placeholder;
        return format(date, 'MMM d, yyyy');
    }
    
    function isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() === today.getDate() && 
               date.getMonth() === today.getMonth() && 
               date.getFullYear() === today.getFullYear();
    }
    
    function isSameDay(date1: Date, date2: Date): boolean {
        return date1.getDate() === date2.getDate() && 
               date1.getMonth() === date2.getMonth() && 
               date1.getFullYear() === date2.getFullYear();
    }
    
    function setTimeline(timeline: 'past' | 'future') {
        activeTimeline = timeline;
    }
    
    function toggleMonthYearSelector() {
        showMonthYearSelector = !showMonthYearSelector;
    }
    
    function selectMonth(month: string) {
        const monthIndex = months.indexOf(month);
        if (monthIndex !== -1) {
            const newMonth = new Date(currentMonth.getFullYear(), monthIndex, 1);
            // Don't allow selecting months before minDate
            if (minDate && isBefore(startOfMonth(newMonth), startOfMonth(minDate))) {
                return;
            }
            currentMonth = newMonth;
        }
    }
    
    function selectYear(year: number) {
        const newMonth = new Date(year, currentMonth.getMonth(), 1);
        // Don't allow selecting years before minDate
        if (minDate && isBefore(startOfMonth(newMonth), startOfMonth(minDate))) {
            return;
        }
        currentMonth = newMonth;
    }
</script>

<div class="w-full">
    <Popover.Root bind:open={isOpen}>
        <Popover.Trigger class="w-full">
            <Button
                variant="outline"
                {disabled}
                class={cn(
                    "w-full justify-start text-left font-normal h-10",
                    !value && "text-muted-foreground",
                    error && "border-destructive",
                    buttonClass
                )}
                id={id || field}
            >
                <CalendarIcon class="mr-2 h-4 w-4" />
                <span>{formatDisplayDate(value)}</span>
                
                {#if value && clearable}
                    <span 
                        class="ml-auto pl-2"
                        on:click|stopPropagation={clearDate}
                        aria-label="Clear date"
                    >
                        <X class="h-4 w-4" />
                    </span>
                {/if}
            </Button>
        </Popover.Trigger>
        
        <Popover.Content class="w-[280px] p-0 z-50" side="bottom" align="start" sideOffset={4}>
            <div class="p-2">
                
                <!-- Calendar header with month/year selector -->
                <div class="flex items-center justify-between mb-1">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        class="h-7 w-7" 
                        on:click={previousMonth}
                        disabled={isPreviousMonthDisabled()}
                    >
                        <ChevronLeft class="h-4 w-4" />
                    </Button>
                    
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        class="h-7 text-xs font-medium px-2 flex items-center gap-1"
                        on:click={toggleMonthYearSelector}
                    >
                        {monthLabel}
                        <ChevronsUpDown class="h-3 w-3 opacity-50" />
                    </Button>
                    
                    <Button variant="outline" size="icon" class="h-7 w-7" on:click={nextMonth}>
                        <ChevronRight class="h-4 w-4" />
                    </Button>
                </div>
                
                <!-- Month/Year selector -->
                {#if showMonthYearSelector}
                    <div class="grid grid-cols-2 gap-2 mb-2">
                        <div class="flex flex-col">
                            <div class="text-xs text-muted-foreground mb-1">Month</div>
                            <div class="h-[150px] overflow-y-auto border rounded-md p-1">
                                {#each months as month}
                                    {@const monthIndex = months.indexOf(month)}
                                    {@const testMonth = new Date(currentMonth.getFullYear(), monthIndex, 1)}
                                    {@const monthDisabled = minDate && isBefore(startOfMonth(testMonth), startOfMonth(minDate))}
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        class={cn(
                                            "w-full justify-start text-xs h-6 mb-1",
                                            monthInputValue === month && "bg-accent text-accent-foreground",
                                            monthDisabled && "opacity-50 cursor-not-allowed"
                                        )}
                                        on:click={() => !monthDisabled && selectMonth(month)}
                                        disabled={monthDisabled}
                                    >
                                        {month}
                                    </Button>
                                {/each}
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <div class="text-xs text-muted-foreground mb-1">Year</div>
                            <div class="h-[150px] overflow-y-auto border rounded-md p-1">
                                {#each years as year}
                                    {@const testMonth = new Date(year, currentMonth.getMonth(), 1)}
                                    {@const yearDisabled = minDate && isBefore(startOfMonth(testMonth), startOfMonth(minDate))}
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        class={cn(
                                            "w-full justify-start text-xs h-6 mb-1",
                                            yearInputValue === year.toString() && "bg-accent text-accent-foreground",
                                            yearDisabled && "opacity-50 cursor-not-allowed"
                                        )}
                                        on:click={() => !yearDisabled && selectYear(year)}
                                        disabled={yearDisabled}
                                    >
                                        {year}
                                    </Button>
                                {/each}
                            </div>
                        </div>
                    </div>
                {:else}
                    <!-- Calendar grid -->
                    <div class="grid grid-cols-7 gap-1 text-center text-xs mt-1">
                        <!-- Weekday headers -->
                        <div class="text-muted-foreground">S</div>
                        <div class="text-muted-foreground">M</div>
                        <div class="text-muted-foreground">T</div>
                        <div class="text-muted-foreground">W</div>
                        <div class="text-muted-foreground">T</div>
                        <div class="text-muted-foreground">F</div>
                        <div class="text-muted-foreground">S</div>
                        
                        <!-- Calendar days -->
                        {#each calendarDays as day}
                            <div>
                                {#if day}
                                    {@const dateDisabled = isDateDisabled(day)}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        class={cn(
                                            "h-7 w-7 p-0 text-xs font-normal",
                                            dateDisabled && "opacity-50 cursor-not-allowed",
                                            isToday(day) && !dateDisabled && "bg-accent text-accent-foreground",
                                            value && isSameDay(day, value) && !dateDisabled && "bg-primary text-primary-foreground",
                                            !isToday(day) && (!value || !isSameDay(day, value)) && !dateDisabled && "hover:bg-accent hover:text-accent-foreground"
                                        )}
                                        on:click={() => !dateDisabled && selectDate(day)}
                                        disabled={dateDisabled}
                                    >
                                        {day.getDate()}
                                    </Button>
                                {:else}
                                    <div class="h-7 w-7"></div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
                
                <!-- Date presets tabs -->
                {#if timelineOptions !== 'future' && timelineOptions !== 'past'}
                    <div class="mt-2 border-t pt-2">
                        <div class="flex justify-between mb-1">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                class={cn("text-xs px-2 py-1", activeTimeline === 'past' && "bg-accent text-accent-foreground")} 
                                on:click={() => setTimeline('past')}
                            >
                                Past
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                class={cn("text-xs px-2 py-1", activeTimeline === 'future' && "bg-accent text-accent-foreground")} 
                                on:click={() => setTimeline('future')}
                            >
                                Future
                            </Button>
                        </div>
                        
                        <div class="flex flex-wrap gap-1">
                            {#each dateOptions as option}
                                <Button variant="outline" size="sm" class="text-xs h-6 px-2" on:click={option.action}>
                                    {option.label}
                                </Button>
                            {/each}
                        </div>
                    </div>
                {:else}
                    <div class="mt-2 border-t pt-2">
                        <div class="flex flex-wrap gap-1">
                            {#each dateOptions as option}
                                <Button variant="outline" size="sm" class="text-xs h-6 px-2" on:click={option.action}>
                                    {option.label}
                                </Button>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </Popover.Content>
    </Popover.Root>
    
    <!-- Hidden input for form submission -->
    <input type="hidden" {name} value={value ? format(value, format_string) : ''} />
</div>
