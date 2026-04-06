<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { format, isValid, parse, isAfter, isBefore, isEqual } from 'date-fns';
  import { Calendar, X } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Separator } from '$lib/components/ui/separator';
  import { cn } from '$lib/utils/ui-utils';
  import DatePicker from './DatePicker.svelte';
  
  export let startDate: Date | null = null;
  export let endDate: Date | null = null;
  export let format_string: string = 'yyyy-MM-dd';
  export let label: string = 'Date Range';
  export let placeholder: string = 'Select date range';
  export let disabled: boolean = false;
  export let error: string = '';
  export let clearable: boolean = true;
  export let required: boolean = false;
  export let popoverClass: string = '';
  export let buttonClass: string = '';
  export let id: string = '';
  
  const dispatch = createEventDispatcher<{
    change: { startDate: Date | null; endDate: Date | null };
    clear: void;
  }>();
  
  let isOpen = false;
  
  // Predefined date ranges
  const dateRanges = [
    { 
      label: 'Today', 
      action: () => {
        const today = new Date();
        setDateRange(today, today);
      }
    },
    { 
      label: 'Yesterday', 
      action: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setDateRange(yesterday, yesterday);
      }
    },
    { 
      label: 'Last 7 Days', 
      action: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        setDateRange(start, end);
      }
    },
    { 
      label: 'Last 30 Days', 
      action: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        setDateRange(start, end);
      }
    },
    { 
      label: 'This Month', 
      action: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date();
        setDateRange(start, end);
      }
    },
    { 
      label: 'Last Month', 
      action: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        setDateRange(start, end);
      }
    },
    { 
      label: 'This Year', 
      action: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date();
        setDateRange(start, end);
      }
    }
  ];
  
  function setDateRange(start: Date | null, end: Date | null) {
    startDate = start;
    endDate = end;
    dispatch('change', { startDate, endDate });
    isOpen = false;
  }
  
  function handleStartDateSelect(event: CustomEvent<{ date: Date | null }>) {
    startDate = event.detail.date;
    
    // If start date is after end date, adjust end date
    if (startDate && endDate && isAfter(startDate, endDate)) {
      endDate = startDate;
    }
    
    dispatch('change', { startDate, endDate });
  }
  
  function handleEndDateSelect(event: CustomEvent<{ date: Date | null }>) {
    endDate = event.detail.date;
    
    // If end date is before start date, adjust start date
    if (endDate && startDate && isBefore(endDate, startDate)) {
      startDate = endDate;
    }
    
    dispatch('change', { startDate, endDate });
  }
  
  function clearDateRange() {
    startDate = null;
    endDate = null;
    dispatch('clear');
  }
  
  function formatDisplayDateRange(): string {
    if (!startDate && !endDate) return placeholder;
    
    if (startDate && endDate) {
      if (isEqual(startDate, endDate)) {
        return format(startDate, format_string);
      }
      return `${format(startDate, format_string)} - ${format(endDate, format_string)}`;
    }
    
    if (startDate) {
      return `${format(startDate, format_string)} - ...`;
    }
    
    if (endDate) {
      return `... - ${format(endDate, format_string)}`;
    }
    
    return placeholder;
  }
</script>

<div class="date-range-picker">
  {#if label}
    <div class="mb-2 block text-sm font-medium" data-required={required}>
      {label}
      {#if required}
        <span class="text-destructive ml-1">*</span>
      {/if}
    </div>
  {/if}
  
  <Popover bind:open={isOpen}>
    <PopoverTrigger asChild let:builder>
      <div class="relative">
        <Button
          {...builder}
          variant="outline"
          {disabled}
          class={cn(
            "w-full justify-start text-left font-normal",
            !startDate && !endDate && "text-muted-foreground",
            buttonClass
          )}
          id={id}
        >
          <Calendar class="mr-2 h-4 w-4" />
          <span>{formatDisplayDateRange()}</span>
          
          {#if (startDate || endDate) && clearable}
            <button
              type="button"
              class="absolute right-8 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-accent"
              on:click|stopPropagation={clearDateRange}
              aria-label="Clear date range"
            >
              <X class="h-4 w-4" />
            </button>
          {/if}
        </Button>
      </div>
    </PopoverTrigger>
    
    <PopoverContent class={cn("w-auto p-0", popoverClass)} align="start">
      <div class="p-3">
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <DatePicker 
              label="Start Date"
              date={startDate}
              {format_string}
              on:select={handleStartDateSelect}
              on:clear={() => {
                startDate = null;
                dispatch('change', { startDate, endDate });
              }}
              clearable={true}
              buttonClass="w-full"
            />
          </div>
          
          <div>
            <DatePicker 
              label="End Date"
              date={endDate}
              {format_string}
              on:select={handleEndDateSelect}
              on:clear={() => {
                endDate = null;
                dispatch('change', { startDate, endDate });
              }}
              clearable={true}
              buttonClass="w-full"
            />
          </div>
        </div>
        
        <div class="mt-4">
          <Separator />
          <div class="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            {#each dateRanges as range}
              <Button 
                variant="outline" 
                size="sm" 
                on:click={range.action}
                class="w-full"
              >
                {range.label}
              </Button>
            {/each}
          </div>
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
