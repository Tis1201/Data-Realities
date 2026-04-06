<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { format, addMonths, subMonths } from "date-fns";
  import { Calendar, X, ChevronLeft, ChevronRight } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Popover from "$lib/components/ui/popover";
  import { Separator } from "$lib/components/ui/separator";
  import { cn } from "$lib/utils/ui-utils";

  export let label: string = "Date Range";
  export let startParamName: string = "start_date";
  export let endParamName: string = "end_date";
  export let format_string: string = "yyyy-MM-dd";
  export let buttonClass: string = "";

  const dispatch = createEventDispatcher<{
    change: { startDate: Date | null; endDate: Date | null };
  }>();

  let isOpen = false;
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  // Selection state: 'start' = waiting for start date, 'end' = waiting for end date
  let selectionState: "start" | "end" = "start";

  // Calendar displays two consecutive months
  let firstMonth: Date = new Date();

  $: secondMonth = addMonths(firstMonth, 1);

  // Track if we've done initial URL sync
  let initializedFromUrl = false;

  // Initialize from URL parameters (only on first load)
  $: if (!initializedFromUrl && $page.url.searchParams) {
    const startParam = $page.url.searchParams.get(startParamName);
    const endParam = $page.url.searchParams.get(endParamName);

    if (startParam) {
      try {
        const d = new Date(startParam);
        if (!isNaN(d.getTime())) {
          startDate = d;
          // Set calendar to show the start date's month
          firstMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        }
      } catch (e) {}
    }

    if (endParam) {
      try {
        const d = new Date(endParam);
        if (!isNaN(d.getTime())) endDate = d;
      } catch (e) {}
    }

    // Set selection state based on what's loaded
    if (startDate && endDate) {
      selectionState = "start";
    } else if (startDate) {
      selectionState = "end";
    }

    initializedFromUrl = true;
  }

  // Predefined date ranges
  const presets = [
    { label: "Today", days: 0 },
    { label: "Last 7 Days", days: 7 },
    { label: "Last 30 Days", days: 30 },
    { label: "This Month", special: "thisMonth" },
    { label: "Last Month", special: "lastMonth" },
  ];

  function applyPreset(preset: (typeof presets)[0]) {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let start: Date;

    if (preset.special === "thisMonth") {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else if (preset.special === "lastMonth") {
      start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      end.setDate(0); // Last day of previous month
    } else {
      start = new Date();
      start.setDate(start.getDate() - (preset.days || 0));
    }
    start.setHours(0, 0, 0, 0);

    startDate = start;
    endDate = end;
    selectionState = "start";
    applyAndClose();
  }

  function handleDayClick(day: Date) {
    if (selectionState === "start") {
      // First click: set start date
      startDate = new Date(day);
      startDate.setHours(0, 0, 0, 0);
      endDate = null;
      selectionState = "end";
    } else {
      // Second click: set end date
      const clickedDate = new Date(day);

      if (clickedDate < startDate!) {
        // If clicked date is before start, swap them
        endDate = new Date(startDate!);
        endDate.setHours(23, 59, 59, 999);
        startDate = clickedDate;
        startDate.setHours(0, 0, 0, 0);
      } else {
        endDate = clickedDate;
        endDate.setHours(23, 59, 59, 999);
      }
      selectionState = "start";
    }
  }

  function clearSelection() {
    startDate = null;
    endDate = null;
    selectionState = "start";
  }

  function applyAndClose() {
    updateUrl();
    dispatch("change", { startDate, endDate });
    isOpen = false;
  }

  function clearAndClose() {
    clearSelection();
    updateUrl();
    dispatch("change", { startDate, endDate });
    isOpen = false;
  }

  function updateUrl() {
    const url = new URL(window.location.href);

    if (startDate) {
      url.searchParams.set(startParamName, format(startDate, format_string));
    } else {
      url.searchParams.delete(startParamName);
    }

    if (endDate) {
      url.searchParams.set(endParamName, format(endDate, format_string));
    } else {
      url.searchParams.delete(endParamName);
    }

    if (url.searchParams.has("page")) {
      url.searchParams.set("page", "1");
    }

    goto(url.toString(), { keepFocus: true, noScroll: true });
  }

  // Reactive display label - updates when dates change
  $: displayLabel = (() => {
    if (!startDate && !endDate) return label;

    if (startDate && endDate) {
      const startStr = format(startDate, "MMM d");
      const endStr = format(endDate, "MMM d, yyyy");
      if (format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd")) {
        return format(startDate, "MMM d, yyyy");
      }
      return `${startStr} - ${endStr}`;
    }

    if (startDate) {
      return `${format(startDate, "MMM d, yyyy")} → ...`;
    }

    return label;
  })();

  $: isFiltered = startDate !== null || endDate !== null;

  // Calendar helpers
  function generateCalendarDays(month: Date): Array<Date | null> {
    const days: Array<Date | null> = [];
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDayOfMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    );
    const firstDayOfWeek = firstDayOfMonth.getDay();

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push(new Date(month.getFullYear(), month.getMonth(), i));
    }

    return days;
  }

  function previousMonths() {
    firstMonth = subMonths(firstMonth, 1);
  }

  function nextMonths() {
    firstMonth = addMonths(firstMonth, 1);
  }

  function isStartDate(day: Date | null): boolean {
    if (!day || !startDate) return false;
    return day.toDateString() === startDate.toDateString();
  }

  function isEndDate(day: Date | null): boolean {
    if (!day || !endDate) return false;
    return day.toDateString() === endDate.toDateString();
  }

  function isInRange(day: Date | null): boolean {
    if (!day || !startDate || !endDate) return false;
    const dayTime = day.getTime();
    return dayTime > startDate.getTime() && dayTime < endDate.getTime();
  }

  function isToday(day: Date | null): boolean {
    if (!day) return false;
    return day.toDateString() === new Date().toDateString();
  }

  function isRangeStart(day: Date | null): boolean {
    return isStartDate(day) && endDate !== null;
  }

  function isRangeEnd(day: Date | null): boolean {
    return isEndDate(day) && startDate !== null;
  }

  $: firstMonthDays = generateCalendarDays(firstMonth);
  $: secondMonthDays = generateCalendarDays(secondMonth);
</script>

<Popover.Root bind:open={isOpen}>
  <Popover.Trigger asChild let:builder>
    <Button
      variant="outline"
      class={cn("flex items-center gap-2 relative", buttonClass)}
      builders={[builder]}
    >
      <Calendar class="h-4 w-4" />
      <span class="text-sm">{displayLabel}</span>
      {#if isFiltered}
        <div
          class="absolute -top-2 -right-2 rounded-full bg-primary min-w-[1.25rem] h-5 flex items-center justify-center text-xs text-primary-foreground"
        >
          1
        </div>
      {/if}
    </Button>
  </Popover.Trigger>

  <Popover.Content class="w-auto p-0" align="start">
    <div class="p-4">
      <!-- Selection hint -->
      <div class="text-center text-sm text-muted-foreground mb-3">
        {#if startDate && endDate}
          <span class="text-primary font-medium">Range selected</span> — click a date
          to start new selection
        {:else if selectionState === "end"}
          Now select end date
        {:else}
          Select start date
        {/if}
      </div>

      <!-- Quick presets -->
      <div class="flex flex-wrap gap-2 mb-4 justify-center">
        {#each presets as preset}
          <Button
            variant="outline"
            size="sm"
            on:click={() => applyPreset(preset)}
            class="text-xs h-7"
          >
            {preset.label}
          </Button>
        {/each}
      </div>

      <Separator class="my-3" />

      <!-- Dual Month Calendar View (Airline Style) -->
      <div class="flex gap-6">
        <!-- Navigation -->
        <div class="absolute top-[140px] left-4">
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7"
            on:click={previousMonths}
          >
            <ChevronLeft class="h-4 w-4" />
          </Button>
        </div>
        <div class="absolute top-[140px] right-4">
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7"
            on:click={nextMonths}
          >
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>

        <!-- First Month -->
        <div class="space-y-2">
          <div class="text-sm font-medium text-center">
            {format(firstMonth, "MMMM yyyy")}
          </div>
          <div class="grid grid-cols-7 gap-0 text-center text-xs">
            <div
              class="text-muted-foreground w-8 h-6 flex items-center justify-center"
            >
              S
            </div>
            <div
              class="text-muted-foreground w-8 h-6 flex items-center justify-center"
            >
              M
            </div>
            <div
              class="text-muted-foreground w-8 h-6 flex items-center justify-center"
            >
              T
            </div>
            <div
              class="text-muted-foreground w-8 h-6 flex items-center justify-center"
            >
              W
            </div>
            <div
              class="text-muted-foreground w-8 h-6 flex items-center justify-center"
            >
              T
            </div>
            <div
              class="text-muted-foreground w-8 h-6 flex items-center justify-center"
            >
              F
            </div>
            <div
              class="text-muted-foreground w-8 h-6 flex items-center justify-center"
            >
              S
            </div>
            {#each firstMonthDays as day}
              <button
                type="button"
                disabled={!day}
                class={cn(
                  "w-8 h-8 text-xs font-normal relative",
                  !day && "invisible",
                  // Start date styling
                  isStartDate(day) &&
                    "bg-primary text-primary-foreground rounded-l-full",
                  isStartDate(day) && !endDate && "rounded-full",
                  // End date styling
                  isEndDate(day) &&
                    "bg-primary text-primary-foreground rounded-r-full",
                  // In range styling
                  isInRange(day) && "bg-primary/20",
                  // Today indicator
                  isToday(day) &&
                    !isStartDate(day) &&
                    !isEndDate(day) &&
                    "font-bold text-primary",
                  // Default hover
                  day &&
                    !isStartDate(day) &&
                    !isEndDate(day) &&
                    !isInRange(day) &&
                    "hover:bg-accent rounded-full",
                )}
                on:click={() => day && handleDayClick(day)}
              >
                {day ? day.getDate() : ""}
              </button>
            {/each}
          </div>
        </div>

        <!-- Second Month -->
        <div class="space-y-2">
          <div class="text-sm font-medium text-center">
            {format(secondMonth, "MMMM yyyy")}
          </div>
          <div class="grid grid-cols-7 gap-0 text-center text-xs">
            <div
              class="text-muted-foreground w-8 h-6 flex items-center justify-center"
            >
              S
            </div>
            <div
              class="text-muted-foreground w-8 h-6 flex items-center justify-center"
            >
              M
            </div>
            <div
              class="text-muted-foreground w-8 h-6 flex items-center justify-center"
            >
              T
            </div>
            <div
              class="text-muted-foreground w-8 h-6 flex items-center justify-center"
            >
              W
            </div>
            <div
              class="text-muted-foreground w-8 h-6 flex items-center justify-center"
            >
              T
            </div>
            <div
              class="text-muted-foreground w-8 h-6 flex items-center justify-center"
            >
              F
            </div>
            <div
              class="text-muted-foreground w-8 h-6 flex items-center justify-center"
            >
              S
            </div>
            {#each secondMonthDays as day}
              <button
                type="button"
                disabled={!day}
                class={cn(
                  "w-8 h-8 text-xs font-normal relative",
                  !day && "invisible",
                  // Start date styling
                  isStartDate(day) &&
                    "bg-primary text-primary-foreground rounded-l-full",
                  isStartDate(day) && !endDate && "rounded-full",
                  // End date styling
                  isEndDate(day) &&
                    "bg-primary text-primary-foreground rounded-r-full",
                  // In range styling
                  isInRange(day) && "bg-primary/20",
                  // Today indicator
                  isToday(day) &&
                    !isStartDate(day) &&
                    !isEndDate(day) &&
                    "font-bold text-primary",
                  // Default hover
                  day &&
                    !isStartDate(day) &&
                    !isEndDate(day) &&
                    !isInRange(day) &&
                    "hover:bg-accent rounded-full",
                )}
                on:click={() => day && handleDayClick(day)}
              >
                {day ? day.getDate() : ""}
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Selected Range Display -->
      {#if startDate || endDate}
        <div class="mt-4 pt-3 border-t flex items-center justify-between">
          <div class="text-sm">
            {#if startDate && endDate}
              <span class="font-medium">{format(startDate, "MMM d, yyyy")}</span
              >
              <span class="mx-2 text-muted-foreground">→</span>
              <span class="font-medium">{format(endDate, "MMM d, yyyy")}</span>
            {:else if startDate}
              <span class="font-medium">{format(startDate, "MMM d, yyyy")}</span
              >
              <span class="mx-2 text-muted-foreground">→</span>
              <span class="text-muted-foreground">Select end date</span>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="flex justify-between items-center mt-4 pt-3 border-t">
        <Button
          variant="ghost"
          size="sm"
          class="h-8 text-xs text-muted-foreground"
          on:click={clearAndClose}
        >
          <X class="h-3 w-3 mr-1" />
          Clear
        </Button>
        <Button
          size="sm"
          class="h-8"
          disabled={!startDate || !endDate}
          on:click={applyAndClose}
        >
          Apply
        </Button>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
