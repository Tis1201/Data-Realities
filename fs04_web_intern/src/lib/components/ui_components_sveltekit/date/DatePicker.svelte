<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { format, isValid, parse, isToday, isYesterday, isSameMonth, isSameYear } from 'date-fns';
  import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { cn } from '$lib/utils/ui-utils';
  
  export let date: Date | null = null;
  export let format_string: string = 'yyyy-MM-dd';
  export let label: string = 'Date';
  export let placeholder: string = 'Select date';
  export let disabled: boolean = false;
  export let error: string = '';
  export let clearable: boolean = true;
  export let required: boolean = false;
  export let popoverClass: string = '';
  export let buttonClass: string = '';
  export let inputClass: string = '';
  export let labelClass: string = '';
  export let id: string = '';
  export let name: string = '';
  
  const dispatch = createEventDispatcher<{
    select: { date: Date | null };
    clear: void;
  }>();
  
  let isOpen = false;
  let calendarDays: Array<Date | null> = [];
  let currentMonth: Date = date || new Date();
  let inputValue = '';
  
  $: if (date) {
    inputValue = format(date, format_string);
  } else {
    inputValue = '';
  }
  
  $: currentMonthLabel = format(currentMonth, 'MMMM yyyy');
  
  function generateCalendarDays(month: Date): Array<Date | null> {
    const days: Array<Date | null> = [];
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push(new Date(month.getFullYear(), month.getMonth(), i));
    }
    
    // Add empty slots to complete the last week if needed
    const remainingSlots = 7 - (days.length % 7 || 7);
    if (remainingSlots < 7) {
      for (let i = 0; i < remainingSlots; i++) {
        days.push(null);
      }
    }
    
    return days;
  }
  
  $: calendarDays = generateCalendarDays(currentMonth);
  
  function previousMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  }
  
  function nextMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  function selectDate(day: Date | null) {
    if (!day) return;
    
    date = day;
    dispatch('select', { date: day });
    isOpen = false;
  }
  
  function clearDate() {
    date = null;
    inputValue = '';
    dispatch('clear');
  }
  
  function handleInputChange() {
    const parsedDate = parse(inputValue, format_string, new Date());
    
    if (isValid(parsedDate)) {
      date = parsedDate;
      currentMonth = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
      dispatch('select', { date: parsedDate });
    }
  }
  
  // Predefined date options
  const dateOptions = [
    { label: 'Today', action: () => selectDate(new Date()) },
    { label: 'Yesterday', action: () => selectDate(new Date(Date.now() - 86400000)) },
    { label: 'Last Week', action: () => selectDate(new Date(Date.now() - 7 * 86400000)) },
    { label: 'Last Month', action: () => selectDate(new Date(Date.now() - 30 * 86400000)) }
  ];
  
  function getDateButtonClass(day: Date | null) {
    if (!day) return 'invisible';
    
    let className = 'h-8 w-8 p-0 font-normal aria-selected:opacity-100';
    
    if (date && day.getDate() === date.getDate() && 
        day.getMonth() === date.getMonth() && 
        day.getFullYear() === date.getFullYear()) {
      className += ' bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground';
    } else if (isToday(day)) {
      className += ' bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground';
    } else {
      className += ' hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground';
    }
    
    return className;
  }
  
  function formatDisplayDate(date: Date | null): string {
    if (!date) return placeholder;
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else if (isSameYear(date, new Date())) {
      return format(date, 'MMM d');
    } else {
      return format(date, 'MMM d, yyyy');
    }
  }
</script>

<div class="date-picker">
  {#if label}
    <Label for={id} class={cn("mb-2 block", labelClass)} data-required={required}>
      {label}
      {#if required}
        <span class="text-destructive ml-1">*</span>
      {/if}
    </Label>
  {/if}
  
  <Popover bind:open={isOpen} placement="bottom-start">
    <PopoverTrigger asChild let:builder>
      <div class="relative">
        <Button
          {...builder}
          variant="outline"
          {disabled}
          class={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            buttonClass
          )}
          id={id}
        >
          <Calendar class="mr-2 h-4 w-4" />
          <span>{formatDisplayDate(date)}</span>
          
          {#if date && clearable}
            <button
              type="button"
              class="absolute right-8 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-accent"
              on:click|stopPropagation={clearDate}
              aria-label="Clear date"
            >
              <X class="h-4 w-4" />
            </button>
          {/if}
        </Button>
      </div>
    </PopoverTrigger>
    
    <PopoverContent class={cn("w-auto p-0", popoverClass)}>
      <div class="p-3">
        <div class="flex items-center justify-between">
          <Button variant="outline" size="icon" on:click={previousMonth}>
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <div class="font-medium">{currentMonthLabel}</div>
          <Button variant="outline" size="icon" on:click={nextMonth}>
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
        
        <div class="mt-4 grid grid-cols-7 gap-1 text-center text-sm">
          <div class="text-muted-foreground">S</div>
          <div class="text-muted-foreground">M</div>
          <div class="text-muted-foreground">T</div>
          <div class="text-muted-foreground">W</div>
          <div class="text-muted-foreground">T</div>
          <div class="text-muted-foreground">F</div>
          <div class="text-muted-foreground">S</div>
          
          {#each calendarDays as day}
            <div>
              <Button
                variant="ghost"
                disabled={!day}
                class={getDateButtonClass(day)}
                on:click={() => selectDate(day)}
              >
                {day ? day.getDate() : ''}
              </Button>
            </div>
          {/each}
        </div>
        
        <div class="mt-4 border-t pt-3">
          <div class="flex flex-wrap gap-2">
            {#each dateOptions as option}
              <Button 
                variant="outline" 
                size="sm" 
                on:click={option.action}
                class="flex-1"
              >
                {option.label}
              </Button>
            {/each}
          </div>
        </div>
        
        <div class="mt-3 flex items-center">
          <Input
            type="text"
            placeholder={format_string.toLowerCase()}
            bind:value={inputValue}
            on:blur={handleInputChange}
            on:keydown={(e) => e.key === 'Enter' && handleInputChange()}
            class={cn("flex-1", inputClass)}
            {name}
          />
        </div>
      </div>
    </PopoverContent>
  </Popover>
  
  {#if error}
    <p class="mt-1 text-sm text-destructive">{error}</p>
  {/if}
</div>

<style>
  /* Add any custom styles here */
  [data-required="true"]::after {
    content: "*";
    color: var(--destructive);
    margin-left: 0.25rem;
  }
</style>
