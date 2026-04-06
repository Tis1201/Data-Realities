<!-- SettingsMatrix.svelte -->
<script lang="ts">
    // @ts-nocheck
    import { Input } from "$lib/components/ui/input";
    import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
    import { Label } from "$lib/components/ui/label";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { Eye, EyeOff } from "lucide-svelte";
    import { onMount } from "svelte";
    import { timezoneOptionsForSelect } from '$lib/utils/timezoneOptions';
    
    // If you have a Switch component, import it and set USE_SWITCH = true
    // import { Switch } from "$lib/components/ui/switch";
    const USE_SWITCH = false;
    
    interface Setting {
      key: string;
      label: string;
      dataType: string; // 'boolean' | 'select' | 'range' | 'password' | 'date' | 'time' | 'datetime' | ...
      value: any;       // current configured value
      enabled: boolean; // for boolean parents (or treat as "apply this")
      description?: string;
      dependsOn?: string;
      options?: Array<{label: string, value: string}>;
      min?: number;
      max?: number;
      unit?: string;
    }
    
    export let settings: Setting[] = [];
    // Legacy support for availableSettings
    export let availableSettings: Setting[] = [];
    
    // Validation errors
    let validationErrors: Record<string, string> = {};
    
    // Common option lists (tweak to your needs)
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const orientations = ["Landscape","Portrait","Landscape Flipped", "Portrait Flipped"];

    const timezoneOptions = timezoneOptionsForSelect;
    
    const homeLauncherOptions = [

    ];
    
    const kioskAppOptions = [

    ];
    
    const resolutionOptions = [
      // Standard resolutions
      { label: "640×480 (VGA)", value: "640x480" },
      { label: "800×600 (SVGA)", value: "800x600" },
      { label: "1024×768 (XGA)", value: "1024x768" },
      { label: "1152×864 (XGA+)", value: "1152x864" },
      { label: "1280×720 (HD)", value: "1280x720" },
      { label: "1280×800 (WXGA)", value: "1280x800" },
      { label: "1280×960 (SXGA-)", value: "1280x960" },
      { label: "1280×1024 (SXGA)", value: "1280x1024" },
      { label: "1360×768 (HD)", value: "1360x768" },
      { label: "1366×768 (HD)", value: "1366x768" },
      { label: "1400×1050 (SXGA+)", value: "1400x1050" },
      { label: "1440×900 (WXGA+)", value: "1440x900" },
      { label: "1600×900 (HD+)", value: "1600x900" },
      { label: "1600×1200 (UXGA)", value: "1600x1200" },
      { label: "1680×1050 (WSXGA+)", value: "1680x1050" },
      { label: "1920×1080 (Full HD)", value: "1920x1080" },
      { label: "1920×1200 (WUXGA)", value: "1920x1200" },
      { label: "2048×1152 (QWXGA)", value: "2048x1152" },
      { label: "2560×1440 (2K QHD)", value: "2560x1440" },
      { label: "2560×1600 (WQXGA)", value: "2560x1600" },
      { label: "2880×1800 (Retina)", value: "2880x1800" },
      { label: "3200×1800 (QHD+)", value: "3200x1800" },
      { label: "3840×2160 (4K UHD)", value: "3840x2160" },
      { label: "4096×2160 (4K DCI)", value: "4096x2160" },
      { label: "5120×2880 (5K)", value: "5120x2880" },
      { label: "7680×4320 (8K UHD)", value: "7680x4320" }
    ];
    
    let revealPwd: Record<string, boolean> = {};
    let editingHours: Record<string, string | undefined> = {};
    let editingMinutes: Record<string, string | undefined> = {};
    let timezoneSearch: Record<string, string> = {};
    let timezoneOpen: Record<string, boolean> = {};
    let resolutionSearch: Record<string, string> = {};
    let resolutionOpen: Record<string, boolean> = {};
    let homeLauncherSearch: Record<string, string> = {};
    let homeLauncherOpen: Record<string, boolean> = {};
    let kioskAppSearch: Record<string, string> = {};
    let kioskAppOpen: Record<string, boolean> = {};
    
    // Reactive filtered lists for each setting key
    let filteredTimezones: Record<string, typeof timezoneOptions> = {};
    let filteredKioskApps: Record<string, typeof kioskAppPackages> = {};
    let filteredHomeLaunchers: Record<string, typeof homeLauncherPackages> = {};
    
    // API data for dynamic options
    let homeLauncherPackages: Array<{label: string, value: string}> = [];
    let kioskAppPackages: Array<{label: string, value: string}> = [];
    
    // Fetch packages on component mount
    onMount(() => {
      fetchAllPackages();
    });
    
    // Track if we've already initialized to prevent reactive loops
    let hasInitialized = false;
    
    // Initialize settings from availableSettings if empty or if settings don't have proper structure
    // This runs ONCE when the component receives data from parent
    $: if (availableSettings.length > 0 && !hasInitialized) {
        // Check if we need to initialize settings
        const needsInitialization = settings.length === 0 || 
            settings.some(s => s.enabled === undefined || s.dataType === undefined);
        
        if (needsInitialization) {
            // Store reference to existing values from server
            const existingValues = new Map(settings.map(s => [s.key, s.value]));
            
            settings = availableSettings.map((setting, index) => {
                // Use server value if exists, otherwise use default
                const serverValue = existingValues.get(setting.key);
                
                // For kiosk_app and home_launcher, always default to empty string if no server value
                // This ensures these fields are empty by default, not "Chrome" or "Default"
                let value: string;
                if (setting.dataType === 'kiosk_app' || setting.dataType === 'home_launcher') {
                    // Only use server value if it's not empty/null/undefined
                    value = (serverValue && serverValue.trim() !== '') ? serverValue : '';
                } else {
                    // For other settings, use server value or default
                    value = serverValue !== undefined ? serverValue : (setting.defaultValue || '');
                }
                
                const newSetting = {
                    key: setting.key,
                    value: value,
                    dataType: setting.dataType,
                    label: setting.label,
                    category: setting.category,
                    order: index,
                    enabled: setting.dataType === 'boolean' ? true : false,
                    description: setting.description,
                    dependsOn: setting.dependsOn,
                    options: setting.options,
                    min: setting.min,
                    max: setting.max,
                    unit: setting.unit
                };
                
                return newSetting;
            });
            hasInitialized = true;
        }
    }
    
    // Initialize search values only when dropdown opens, not from setting values
    // This prevents auto-filling the search when user clears the input
    
    // helpers
    function fmtReported(val: any, s: Setting) {
      if (s.dataType === "password" && val) return "•".repeat(5);
      if (s.dataType === "boolean") return val ? "Enabled" : "Disabled";
      if (s.dataType === "range" && s.unit) return `${val ?? ""} ${s.unit}`;
      return val ?? "Not set";
    }
    function isRange(s: Setting) {
      const k = s.key.toLowerCase();
      return s.dataType === "range" || k.includes("volume") || k.includes("brightness");
    }
    function isOrientation(s: Setting) {
      const k = s.key.toLowerCase();
      return k.includes("orientation");
    }
    function isTimezone(s: Setting) {
      const k = s.key.toLowerCase();
      return k.includes("timezone");
    }
    function isResolution(s: Setting) {
      const k = s.key.toLowerCase();
      return k.includes("resolution") || k.includes("display_resolution");
    }
    function isHomeLauncher(s: Setting) {
      const k = s.key.toLowerCase();
      return k.includes("home") || k.includes("launcher") || s.dataType === "home_launcher";
    }
    function isKioskApp(s: Setting) {
      const k = s.key.toLowerCase();
      return k.includes("kiosk") && k.includes("app") || s.dataType === "kiosk_app";
    }
    function isScheduledReboot(s: Setting) {
      const k = s.key.toLowerCase();
      return k.includes("scheduled") && k.includes("reboot");
    }
    function toHHMM(val: string | null | undefined) {
      if (!val) return "";
      const d = new Date(`1970-01-01T${val.length===5?val:val.slice(11,16) || "00:00"}:00Z`);
      return d.toISOString().slice(11,16);
    }
    
    function getTimeHours(val: string | null | undefined) {
      if (!val) return "12";
      // Handle format like "12:00 AM" or "14:30" (24-hour)
      if (val.includes(' ')) {
        const [time, ampm] = val.split(' ');
        const [hours] = time.split(':');
        let h = parseInt(hours);
        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 0) h = 12;
        if (ampm === 'AM' && h === 12) h = 12;
        return h > 12 ? (h - 12).toString() : h.toString();
      }
      // Handle 24-hour format
      const [hours] = val.split(':');
      let h = parseInt(hours);
      if (h === 0) return "12";
      if (h > 12) return (h - 12).toString();
      return h.toString();
    }
    
    function getTimeMinutes(val: string | null | undefined) {
      if (!val) return "00";
      const timePart = val.includes(' ') ? val.split(' ')[0] : val;
      const [, minutes] = timePart.split(':');
      return minutes || "00";
    }
    
    function getTimeAMPM(val: string | null | undefined) {
      if (!val) return "AM";
      if (val.includes(' ')) {
        return val.split(' ')[1] || "AM";
      }
      // Convert 24-hour to 12-hour
      const [hours] = val.split(':');
      const h = parseInt(hours);
      return h >= 12 ? "PM" : "AM";
    }
    
    function clampTimeInput(value: string, min: number, max: number, fallback: string) {
      const digits = (value ?? '').replace(/[^\d]/g, '');
      if (!digits) return fallback.padStart(2, '0');
      const parsed = parseInt(digits, 10);
      if (isNaN(parsed)) return fallback.padStart(2, '0');
      const clamped = Math.min(Math.max(parsed, min), max);
      return String(clamped).padStart(2, '0');
    }
    
    function getHoursDisplay(setting: Setting) {
      const base = getTimeHours(setting.value)?.padStart(2, '0') || '12';
      return editingHours[setting.key] ?? base;
    }
    
    function getMinutesDisplay(setting: Setting) {
      const base = getTimeMinutes(setting.value)?.padStart(2, '0') || '00';
      return editingMinutes[setting.key] ?? base;
    }
    
    function setEditingHours(key: string, value: string | null) {
      if (value === null || value === undefined) {
        const { [key]: _, ...rest } = editingHours;
        editingHours = rest;
      } else {
        editingHours = { ...editingHours, [key]: value };
      }
    }
    
    function setEditingMinutes(key: string, value: string | null) {
      if (value === null || value === undefined) {
        const { [key]: _, ...rest } = editingMinutes;
        editingMinutes = rest;
      } else {
        editingMinutes = { ...editingMinutes, [key]: value };
      }
    }
    
    function updateSetting(key: string, patch: Partial<Setting>) {
      settings = settings.map(s => s.key === key ? { ...s, ...patch } : s);
      // Clear validation error for this field when it's updated
      if (validationErrors[key]) {
        delete validationErrors[key];
        validationErrors = { ...validationErrors };
      }
    }
    
    // Validate settings before form submission
    export function validateSettings(): boolean {
      const errors: Record<string, string> = {};
      
      // Check if reboot schedule is enabled
      const rebootScheduleEnabled = settings.find(s => s.key === 'reboot_schedule_enabled');
      if (rebootScheduleEnabled && rebootScheduleEnabled.value === 'enabled') {
        // Validate reboot frequency
        const rebootFrequency = settings.find(s => s.key === 'reboot_schedule_frequency');
        if (!rebootFrequency?.value || rebootFrequency.value === '') {
          errors['reboot_schedule_frequency'] = 'Reboot Frequency is required when scheduled reboots are enabled';
        }
        
        // Validate reboot time
        const rebootTime = settings.find(s => s.key === 'reboot_schedule_time');
        if (!rebootTime?.value || rebootTime.value === '') {
          errors['reboot_schedule_time'] = 'Reboot Time is required when scheduled reboots are enabled';
        }
        
        // If frequency is weekly, check for reboot day
        if (rebootFrequency?.value === 'weekly') {
          const rebootDay = settings.find(s => s.key === 'reboot_schedule_day');
          if (!rebootDay?.value || rebootDay.value === '') {
            errors['reboot_schedule_day'] = 'Reboot Day is required when frequency is set to weekly';
          }
        }
      }
      
      // Check if download schedule is enabled
      const downloadScheduleEnabled = settings.find(s => s.key === 'download_schedule_enabled');
      if (downloadScheduleEnabled && downloadScheduleEnabled.value === 'enabled') {
        // Validate download frequency
        const downloadFrequency = settings.find(s => s.key === 'download_schedule_frequency');
        if (!downloadFrequency?.value || downloadFrequency.value === '') {
          errors['download_schedule_frequency'] = 'Download Frequency is required when scheduled downloads are enabled';
        }
        
        // Validate download time
        const downloadTime = settings.find(s => s.key === 'download_schedule_time');
        if (!downloadTime?.value || downloadTime.value === '') {
          errors['download_schedule_time'] = 'Download Time is required when scheduled downloads are enabled';
        }
        
        // If frequency is weekly or monthly, check for download day
        if (downloadFrequency?.value === 'weekly' || downloadFrequency?.value === 'monthly') {
          const downloadDay = settings.find(s => s.key === 'download_schedule_day');
          if (!downloadDay?.value || downloadDay.value === '') {
            errors['download_schedule_day'] = downloadFrequency.value === 'weekly'
              ? 'Download Day is required when frequency is set to weekly'
              : 'Download Day is required when frequency is set to monthly';
          }
        }
      }
      
      validationErrors = errors;
      return Object.keys(errors).length === 0;
    }
    
    function isSettingVisible(setting: Setting) {
      if (!setting.dependsOn) return true;
      const parentSetting = settings.find(s => s.key === setting.dependsOn);
      if (!parentSetting) return false;
      
      // For boolean settings, check the value (enabled/disabled)
      if (parentSetting.dataType === 'boolean') {
        return parentSetting.value === 'enabled' || parentSetting.value === true;
      }
      
      // For day settings (day-of-week for weekly, day-of-month for monthly)
      if (setting.key.includes('_day') && parentSetting.key.includes('_frequency')) {
        return parentSetting.value === 'weekly' || parentSetting.value === 'monthly';
      }
      
      // For other settings, check if they're enabled
      return parentSetting.enabled === true;
    }
    
    function getFilteredTimezones(settingKey: string) {
      const searchTerm = (timezoneSearch[settingKey] || '').trim();
      if (!searchTerm) {
        filteredTimezones[settingKey] = timezoneOptions;
        filteredTimezones = { ...filteredTimezones }; // Force reactivity when clearing search
        return timezoneOptions;
      }
      
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = timezoneOptions.filter(option => {
        const valueLower = option.value.toLowerCase();
        const labelLower = option.label.toLowerCase();
        const valueMatch = valueLower.includes(lowerSearch);
        const labelMatch = labelLower.includes(lowerSearch);
        // Also check if search matches the timezone abbreviation (e.g., "CET" in "Europe/Warsaw (CET/CEST)")
        const abbrevMatch = option.label.match(/\(([^)]+)\)/)?.[1]?.toLowerCase().includes(lowerSearch);
        return valueMatch || labelMatch || abbrevMatch;
      });
      
      filteredTimezones[settingKey] = filtered;
      filteredTimezones = { ...filteredTimezones }; // Force reactivity
      return filtered;
    }
    
    
    function getFilteredResolutions(settingKey: string) {
      const searchTerm = (resolutionSearch[settingKey] || '').trim();
      if (!searchTerm) return resolutionOptions;
      
      const lowerSearch = searchTerm.toLowerCase();
      return resolutionOptions.filter(option => 
        option.value.toLowerCase().includes(lowerSearch) ||
        option.label.toLowerCase().includes(lowerSearch)
      );
    }
    
    function getFilteredHomeLauncherPackages(settingKey: string) {
      const searchTerm = (homeLauncherSearch[settingKey] || '').trim();
      if (!searchTerm) {
        filteredHomeLaunchers[settingKey] = homeLauncherPackages;
        return homeLauncherPackages;
      }
      
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = homeLauncherPackages.filter(option => 
        option.value.toLowerCase().includes(lowerSearch) ||
        option.label.toLowerCase().includes(lowerSearch)
      );
      
      filteredHomeLaunchers[settingKey] = filtered;
      filteredHomeLaunchers = { ...filteredHomeLaunchers }; // Force reactivity
      return filtered;
    }
    
    function getFilteredKioskAppPackages(settingKey: string) {
      const searchTerm = (kioskAppSearch[settingKey] || '').trim();
      if (!searchTerm) {
        filteredKioskApps[settingKey] = kioskAppPackages;
        return kioskAppPackages;
      }
      
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = kioskAppPackages.filter(option => 
        option.value.toLowerCase().includes(lowerSearch) ||
        option.label.toLowerCase().includes(lowerSearch)
      );
      
      filteredKioskApps[settingKey] = filtered;
      filteredKioskApps = { ...filteredKioskApps }; // Force reactivity
      return filtered;
    }

    function capitalizeFirstLetter(str) {
      if (!str || typeof str !== 'string' || str.length === 0) {
        return str;
      }
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    // Get display name for package-based settings (kiosk app, home launcher)
    function getPackageDisplayName(packageName: string | null | undefined, setting: Setting): string {
      if (!packageName) return 'Not set';
      
      // Check if it's a kiosk app or home launcher setting
      if (isKioskApp(setting) || isHomeLauncher(setting)) {
        // Find the package in the list
        const allPackages = isKioskApp(setting) ? kioskAppPackages : homeLauncherPackages;
        const found = allPackages.find(pkg => pkg.value === packageName);
        if (found) {
          // Return just the display name part (before the parentheses)
          const displayName = found.label.split(' (')[0];
          return displayName || packageName;
        }
      }
      
      // Fallback to capitalized value
      return capitalizeFirstLetter(packageName);
    }
    
    // Fetch all package names from API
    async function fetchAllPackages() {
      try {
        const response = await fetch('/api/v2/resources/packages/all');
        const data = await response.json();
        
        if (data.success || data.data) {
          const allPackages = data.data?.packages || [];
          
          // Map all packages to the format needed for both home launcher and kiosk app
          const packageList = allPackages.map((pkg: any) => ({
            label: pkg.displayName ? `${pkg.displayName} (${pkg.packageName})` : pkg.packageName,
            value: pkg.packageName
          }));
          
          // Use the same list for both home launchers and kiosk apps
          homeLauncherPackages = packageList;
          kioskAppPackages = packageList;
          
          // Initialize search fields with display names for existing values
          settings.forEach(s => {
            if (s.value && (isKioskApp(s) || isHomeLauncher(s))) {
              const displayName = getPackageDisplayName(s.value, s);
              if (displayName && displayName !== 'Not set' && displayName !== capitalizeFirstLetter(s.value)) {
                if (isKioskApp(s)) {
                  kioskAppSearch[s.key] = displayName;
                } else if (isHomeLauncher(s)) {
                  homeLauncherSearch[s.key] = displayName;
                }
              }
            }
          });
          
          // Force reactivity
          kioskAppSearch = { ...kioskAppSearch };
          homeLauncherSearch = { ...homeLauncherSearch };
        } else {
          console.error('Failed to fetch packages:', data.message);
          homeLauncherPackages = [];
          kioskAppPackages = [];
        }
      } catch (error) {
        console.error('Failed to fetch packages:', error);
        homeLauncherPackages = [];
        kioskAppPackages = [];
      }
    }

    const freqOptions = [
      { label: "Daily", value: "daily" },
      { label: "Weekly", value: "weekly" },
      { label: "Monthly", value: "monthly" }
    ];

    /** Day of month (1-31) for Monthly frequency */
    const dayOfMonthOptions = Array.from({ length: 31 }, (_, i) => {
      const n = i + 1;
      const mod10 = n % 10;
      const mod100 = n % 100;

      const suffix =
        mod100 >= 11 && mod100 <= 13
          ? 'th'
          : mod10 === 1
          ? 'st'
          : mod10 === 2
          ? 'nd'
          : mod10 === 3
          ? 'rd'
          : 'th';

      return { label: `${n}${suffix}`, value: String(n) };
    });

    function getSelectOptions(s: Setting) {
      // Prefer server-provided options if present
      if (s?.options && s.options.length) return s.options;

      const k = (s.key || "").toLowerCase();

      if (k.includes("reboot_schedule_frequency")) return freqOptions;
      if (k.includes("download_schedule_frequency")) return freqOptions;
      return [];
    }

    function getOptionsForDaySetting(s: Setting): { label: string; value: string }[] {
      const freqKey = s.key?.includes('reboot') ? 'reboot_schedule_frequency' : 'download_schedule_frequency';
      const freqSetting = settings.find((x: { key: string }) => x.key === freqKey);
      const freq = (freqSetting?.value ?? 'daily') as string;
      if (freq === 'monthly') return dayOfMonthOptions;
      return (s?.options ?? []).map((o: { label: string; value: string }) => ({ label: o.label, value: String(o.value) }));
    }

    function normalizeOptions(s) {
      const k = (s.key || "").toLowerCase();
      const isDaySetting = k === 'reboot_schedule_day' || k === 'download_schedule_day';
      const opts = isDaySetting ? getOptionsForDaySetting(s) : ((s?.options && s.options.length ? s.options : getSelectOptions(s)) ?? []);
      return Array.isArray(opts) ? opts.map((o: { label: string; value: string }) => ({ label: o.label, value: String(o.value) })) : [];
    }

    function toSelectValue(val) {
      if (val === undefined || val === null) return "";
      return String(val);
    }
    </script>
    
    <div class="overflow-hidden rounded-xl ring-1 ring-gray-200 bg-white">
      <div class="grid grid-cols-[1.4fr,1.2fr,1.2fr] items-center bg-gray-50 text-gray-700 text-sm font-medium px-4 py-3 border-b border-gray-200">
        <div>Settings</div>
        <div>Reported</div>
        <div>Configure</div>
      </div>
    
      {#each settings as s, i}
        {#if isSettingVisible(s)}
          <div class="grid grid-cols-[1.4fr,1.2fr,1.2fr] items-start px-4 py-3 border-b border-gray-100 hover:bg-gray-50/60 {s.dependsOn ? 'ml-6 bg-gray-50 border-l-4 border-l-blue-200' : ''} {validationErrors[s.key] ? 'bg-red-50/30 border-l-4 border-l-red-400' : ''}">
          <!-- Setting label -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-3">
              {#if s.dependsOn}
                <span class="text-xs text-blue-600 font-medium">↳</span>
              {/if}
              <Label class="text-[0.95rem] text-gray-900">{s.label}</Label>
              {#if s.description}
                <span class="text-[11px] text-gray-500">{s.description}</span>
              {/if}
            </div>
            {#if validationErrors[s.key]}
              <span class="text-xs text-red-600 font-medium ml-5">⚠ {validationErrors[s.key]}</span>
            {/if}
          </div>
    
          <div class="flex items-center gap-3 text-gray-500">
            {isKioskApp(s) || isHomeLauncher(s) ? getPackageDisplayName(s.value, s) : capitalizeFirstLetter(s.value)}
          </div>

          <!-- Configure -->
          <div class="flex items-center gap-3 justify-start">
            {#if s.dataType === "boolean" || isScheduledReboot(s)}
              <!-- Boolean and "apply" toggles use switch/checkbox -->
              {#if USE_SWITCH}
                <!-- <Switch checked={s.value === 'enabled' || s.value === true} onCheckedChange={() => updateSetting(s.key, { value: s.value === 'enabled' || s.value === true ? 'disabled' : 'enabled' })} /> -->
              {:else}
                <div class="flex items-center gap-2">
                  <Checkbox 
                    checked={s.value === 'enabled' || s.value === true} 
                    onCheckedChange={() => {
                      updateSetting(s.key, { value: s.value === 'enabled' || s.value === true ? 'disabled' : 'enabled' });
                    }} 
                  />
                  <span class="text-sm text-gray-700">{s.value === 'enabled' || s.value === true ? "Enabled" : "Disabled"}</span>
                </div>
              {/if}
            {:else}
              <!-- Right-side editor block - only show for non-boolean settings -->
              <!-- <div class="flex-1 flex items-center justify-start"> -->
              <div class="flex items-center gap-2">
              {#if isRange(s)}
                {@const rangeMin = Number(s.min ?? 0)}
                {@const rangeMax = Number(s.max ?? 100)}
                {@const rangeValue = Number(s.value ?? rangeMin)}
                {@const rangeProgress = Math.min(Math.max(((rangeValue - rangeMin) / Math.max(rangeMax - rangeMin, 1)) * 100, 0), 100)}
                <!-- Slider + number -->
                <div class="flex items-center gap-3 w-full max-w-sm">
                  <input
                    type="range"
                    min={rangeMin}
                    max={rangeMax}
                    value={rangeValue}
                    on:input={(e) => updateSetting(s.key, { value: e.target?.value ?? s.value })}
                    class="range-input flex-1"
                    style={`--range-progress: ${rangeProgress}%;`}
                  />
                  <Input
                    type="number"
                    min={rangeMin}
                    max={rangeMax}
                    value={rangeValue}
                    on:input={(e) => updateSetting(s.key, { value: e.target?.value ?? s.value })}
                    class="w-20 text-right ring-1 ring-gray-200 focus:ring-gray-300"
                  />
                </div>
    
              {:else if isOrientation(s)}
                <!-- Segmented control -->
                <div class="inline-flex rounded-lg ring-1 ring-gray-200 overflow-hidden">
                  {#each orientations as opt}
                    <button
                      type="button"
                      class="px-3 py-1.5 text-sm hover:bg-gray-50 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700"
                      data-active={(s.value || "").toLowerCase() === opt.toLowerCase()}
                      on:click={() => updateSetting(s.key, { value: opt })}
                    >
                      {opt}
                    </button>
                  {/each}
                </div>
    
              {:else if isTimezone(s)}
                <div class="relative w-80">
                  <Input
                    type="text"
                    value={timezoneSearch[s.key] || ''}
                    on:input={(e) => {
                      const value = e.target?.value || '';
                      timezoneSearch[s.key] = value;
                      timezoneSearch = { ...timezoneSearch }; // Force reactivity
                      // Update filtered list immediately
                      getFilteredTimezones(s.key);
                      if (value.trim()) {
                        timezoneOpen[s.key] = true;
                      }
                    }}
                    on:focus={() => {
                      // Clear search when focusing if there's a current value, to allow fresh search
                      if (s.value && !timezoneSearch[s.key]) {
                        timezoneSearch[s.key] = '';
                        timezoneSearch = { ...timezoneSearch };
                      }
                      timezoneOpen[s.key] = true;
                    }}
                    placeholder={s.value ? `Current: ${s.value}` : "Search timezone..."}
                    class="w-full ring-blue-300 focus:ring-blue-500 focus:ring-2  placeholder:text-blue-500"
                  />
                  
                  {#if timezoneOpen[s.key]}
                    <div class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {#each filteredTimezones[s.key] || getFilteredTimezones(s.key) as option}
                        <button
                          type="button"
                          class="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          on:click={() => {
                            updateSetting(s.key, { value: option.value });
                            timezoneSearch[s.key] = option.value;
                            timezoneSearch = { ...timezoneSearch }; // Force reactivity
                            timezoneOpen[s.key] = false;
                          }}
                        >
                          <div class="flex flex-col">
                            <span class="font-medium text-sm">{option.value}</span>
                            <span class="text-xs text-gray-500">{option.label}</span>
                          </div>
                        </button>
                      {/each}
                      {#if (filteredTimezones[s.key] || getFilteredTimezones(s.key)).length === 0}
                        <div class="px-3 py-2 text-sm text-gray-500">No timezones found</div>
                      {/if}
                    </div>
                  {/if}
                  
                  <!-- Click outside to close -->
                  {#if timezoneOpen[s.key]}
                    <div 
                      class="fixed inset-0 z-40" 
                      role="button"
                      tabindex="-1"
                      on:click={() => timezoneOpen[s.key] = false}
                      on:keydown={(e) => e.key === 'Escape' && (timezoneOpen[s.key] = false)}
                    ></div>
                  {/if}
                </div>
    
              {:else if isResolution(s)}
                <div class="relative w-80">
                  <Input
                    type="text"
                    value={resolutionSearch[s.key] || ''}
                    on:input={(e) => {
                      const value = e.target?.value || '';
                      resolutionSearch[s.key] = value;
                      resolutionSearch = { ...resolutionSearch }; // Force reactivity
                      if (value.trim()) {
                        resolutionOpen[s.key] = true;
                      }
                    }}
                    on:focus={() => {
                      if (s.value && !resolutionSearch[s.key]) {
                        resolutionSearch[s.key] = '';
                        resolutionSearch = { ...resolutionSearch };
                      }
                      resolutionOpen[s.key] = true;
                    }}
                    placeholder={s.value ? `Current: ${s.value}` : "Search resolution..."}
                    class="w-full ring-blue-300 focus:ring-blue-500 focus:ring-2  placeholder:text-blue-500"
                  />
                  
                  {#if resolutionOpen[s.key]}
                    <div class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {#each getFilteredResolutions(s.key) as option}
                        <button
                          type="button"
                          class="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          on:click={() => {
                            updateSetting(s.key, { value: option.value });
                            resolutionSearch[s.key] = option.value;
                            resolutionSearch = { ...resolutionSearch }; // Force reactivity
                            resolutionOpen[s.key] = false;
                          }}
                        >
                          <div class="flex flex-col">
                            <span class="font-medium text-sm">{option.value}</span>
                            <span class="text-xs text-gray-500">{option.label}</span>
                          </div>
                        </button>
                      {/each}
                      {#if getFilteredResolutions(s.key).length === 0}
                        <div class="px-3 py-2 text-sm text-gray-500">No resolutions found</div>
                      {/if}
                    </div>
                  {/if}
                  
                  <!-- Click outside to close -->
                  {#if resolutionOpen[s.key]}
                    <div 
                      class="fixed inset-0 z-40" 
                      role="button"
                      tabindex="-1"
                      on:click={() => resolutionOpen[s.key] = false}
                      on:keydown={(e) => e.key === 'Escape' && (resolutionOpen[s.key] = false)}
                    ></div>
                  {/if}
                </div>

              {:else if s.dataType === "select"}
                {#each [normalizeOptions(s)] as options ( `${s.key}:${String(s.value ?? '')}:${options.length}` )}
                  <Select
                          selected={{ value: String(s.value ?? ''), label: options.find(o => o.value === String(s.value))?.label || String(s.value) }}
                          onSelectedChange={(selected) => {
                            if (selected?.value !== undefined) {
                              updateSetting(s.key, { value: selected.value });
                            }
                          }}
                  >
                    <SelectTrigger class="w-64 ring-1 ring-gray-200 focus:ring-gray-300">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>

                    <SelectContent portal>
                      {#each options as option (option.value)}
                        <SelectItem value={String(option.value)}>{option.label}</SelectItem>
                      {/each}
                    </SelectContent>
                  </Select>
                {/each}

              {:else if isHomeLauncher(s)}
                <div class="relative w-80">
                  <Input
                    type="text"
                    value={homeLauncherSearch[s.key] || ''}
                    on:input={(e) => {
                      const value = e.target?.value || '';
                      homeLauncherSearch[s.key] = value;
                      homeLauncherSearch = { ...homeLauncherSearch }; // Force reactivity
                      // Update filtered list immediately
                      getFilteredHomeLauncherPackages(s.key);
                      if (value.trim()) {
                        homeLauncherOpen[s.key] = true;
                      }
                    }}
                    on:focus={() => {
                      if (s.value && !homeLauncherSearch[s.key]) {
                        homeLauncherSearch[s.key] = '';
                        homeLauncherSearch = { ...homeLauncherSearch };
                      }
                      homeLauncherOpen[s.key] = true;
                    }}
                    placeholder={s.value ? `Current: ${getPackageDisplayName(s.value, s)}` : "Search home/launcher..."}
                    class="w-full ring-blue-300 focus:ring-blue-500 focus:ring-2  placeholder:text-blue-500"
                  />
                  
                  {#if homeLauncherOpen[s.key]}
                    <div class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {#each filteredHomeLaunchers[s.key] || getFilteredHomeLauncherPackages(s.key) as option}
                        <button
                          type="button"
                          class="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          on:click={() => {
                            updateSetting(s.key, { value: option.value });
                            // Show display name in search field, not package name
                            const displayName = option.label.split(' (')[0];
                            homeLauncherSearch[s.key] = displayName;
                            homeLauncherSearch = { ...homeLauncherSearch }; // Force reactivity
                            homeLauncherOpen[s.key] = false;
                          }}
                        >
                          <div class="flex flex-col">
                            <span class="font-medium text-sm">{option.label.split(' (')[0]}</span>
                            <span class="text-xs text-gray-500">{option.value}</span>
                          </div>
                        </button>
                      {/each}
                      {#if (filteredHomeLaunchers[s.key] || getFilteredHomeLauncherPackages(s.key)).length === 0}
                        <div class="px-3 py-2 text-sm text-gray-500">No packages found</div>
                      {/if}
                    </div>
                  {/if}
                  
                  <!-- Click outside to close -->
                  {#if homeLauncherOpen[s.key]}
                    <div 
                      class="fixed inset-0 z-40" 
                      role="button"
                      tabindex="-1"
                      on:click={() => homeLauncherOpen[s.key] = false}
                      on:keydown={(e) => e.key === 'Escape' && (homeLauncherOpen[s.key] = false)}
                    ></div>
                  {/if}
                </div>

              {:else if isKioskApp(s)}
                <div class="relative w-80">
                  <Input
                    type="text"
                    value={kioskAppSearch[s.key] || ''}
                    on:input={(e) => {
                      const value = e.target?.value || '';
                      kioskAppSearch[s.key] = value;
                      kioskAppSearch = { ...kioskAppSearch }; // Force reactivity
                      // Update filtered list immediately
                      getFilteredKioskAppPackages(s.key);
                      if (value.trim()) {
                        kioskAppOpen[s.key] = true;
                      }
                    }}
                    on:focus={() => {
                      if (s.value && !kioskAppSearch[s.key]) {
                        kioskAppSearch[s.key] = '';
                        kioskAppSearch = { ...kioskAppSearch };
                      }
                      kioskAppOpen[s.key] = true;
                    }}
                    placeholder={s.value ? `Current: ${getPackageDisplayName(s.value, s)}` : "Search kiosk application..."}
                    class="w-full ring-blue-300 focus:ring-blue-500 focus:ring-2  placeholder:text-blue-500"
                  />
                  
                  {#if kioskAppOpen[s.key]}
                    <div class="absolute z-50 w-full bottom-full mb-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {#each filteredKioskApps[s.key] || getFilteredKioskAppPackages(s.key) as option}
                        <button
                          type="button"
                          class="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          on:click={() => {
                            updateSetting(s.key, { value: option.value });
                            // Show display name in search field, not package name
                            const displayName = option.label.split(' (')[0];
                            kioskAppSearch[s.key] = displayName;
                            kioskAppSearch = { ...kioskAppSearch }; // Force reactivity
                            kioskAppOpen[s.key] = false;
                          }}
                        >
                          <div class="flex flex-col">
                            <span class="font-medium text-sm">{option.label.split(' (')[0]}</span>
                            <span class="text-xs text-gray-500">{option.value}</span>
                          </div>
                        </button>
                      {/each}
                      {#if (filteredKioskApps[s.key] || getFilteredKioskAppPackages(s.key)).length === 0}
                        <div class="px-3 py-2 text-sm text-gray-500">No packages found</div>
                      {/if}
                    </div>
                  {/if}
                  
                  <!-- Click outside to close -->
                  {#if kioskAppOpen[s.key]}
                    <div 
                      class="fixed inset-0 z-40" 
                      role="button"
                      tabindex="-1"
                      on:click={() => kioskAppOpen[s.key] = false}
                      on:keydown={(e) => e.key === 'Escape' && (kioskAppOpen[s.key] = false)}
                    ></div>
                  {/if}
                </div>
    
              {:else if s.dataType === "password"}
                <div class="relative w-64">
                  <Input
                    type={revealPwd[s.key] ? "text" : "password"}
                    value={s.value}
                    on:input={(e) => updateSetting(s.key, { value: e.target?.value ?? s.value })}
                    class="w-full ring-1 ring-gray-200 focus:ring-gray-300 pr-9"
                  />
                  <button
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    on:click={() => (revealPwd[s.key] = !revealPwd[s.key])}
                  >
                    {#if revealPwd[s.key]}<EyeOff class="w-4 h-4" />{:else}<Eye class="w-4 h-4" />{/if}
                  </button>
                </div>
    
              {:else if s.dataType === "datetime"}
                <Input
                  type="datetime-local"
                  value={s.value ? s.value : ""}
                  on:input={(e) => updateSetting(s.key, { value: e.target?.value })}
                  class="w-64 ring-1 ring-gray-200 focus:ring-gray-300"
                />
    
              {:else if s.dataType === "date"}
                <Input
                  type="date"
                  value={s.value ? s.value : ""}
                  on:input={(e) => updateSetting(s.key, { value: e.target?.value })}
                  class="w-48 ring-1 ring-gray-200 focus:ring-gray-300"
                />
    
              {:else if s.dataType === "time"}
                <div class="flex items-center gap-2">
                  <!-- Hours -->
                  <div class="flex flex-col items-center">
                    <label for={`${s.key}-hours`} class="text-xs text-gray-500 mb-1">HH</label>
                    <Input
                      id={`${s.key}-hours`}
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      maxlength="2"
                      value={getHoursDisplay(s)}
                      on:focus={() => {
                        setEditingHours(s.key, getHoursDisplay(s));
                      }}
                      on:input={(e) => {
                        const raw = (e.target?.value ?? '').replace(/[^\d]/g, '').slice(0, 2);
                        e.target.value = raw;
                        setEditingHours(s.key, raw);
                        if (!raw) return;
                        if (raw.length < 2) return;
                        const normalized = clampTimeInput(raw, 1, 12, getTimeHours(s.value) || '12');
                        setEditingHours(s.key, normalized);
                        const minutes = clampTimeInput(editingMinutes[s.key] ?? (getTimeMinutes(s.value) || '00'), 0, 59, '00');
                        const ampm = getTimeAMPM(s.value);
                        updateSetting(s.key, { value: `${normalized}:${minutes} ${ampm}` });
                        e.target.value = normalized;
                      }}
                      on:blur={(e) => {
                        const normalized = clampTimeInput(editingHours[s.key] ?? (e.target?.value || ''), 1, 12, getTimeHours(s.value) || '12');
                        const minutes = clampTimeInput(editingMinutes[s.key] ?? (getTimeMinutes(s.value) || '00'), 0, 59, '00');
                        const ampm = getTimeAMPM(s.value);
                        updateSetting(s.key, { value: `${normalized}:${minutes} ${ampm}` });
                        setEditingHours(s.key, null);
                        e.target.value = normalized;
                      }}
                      class="w-20 text-center text-base font-semibold ring-1 ring-gray-200 focus:ring-blue-500 h-12"
                    />
                  </div>
                  
                  <!-- Colon separator -->
                  <span class="text-2xl font-bold text-gray-500 mt-5">:</span>
                  
                  <!-- Minutes -->
                  <div class="flex flex-col items-center">
                    <label for={`${s.key}-minutes`} class="text-xs text-gray-500 mb-1">MM</label>
                    <Input
                      id={`${s.key}-minutes`}
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      maxlength="2"
                      value={getMinutesDisplay(s)}
                      on:focus={() => {
                        setEditingMinutes(s.key, getMinutesDisplay(s));
                      }}
                      on:input={(e) => {
                        const raw = (e.target?.value ?? '').replace(/[^\d]/g, '').slice(0, 2);
                        e.target.value = raw;
                        setEditingMinutes(s.key, raw);
                        if (!raw) return;
                        if (raw.length < 2) return;
                        const normalized = clampTimeInput(raw, 0, 59, getTimeMinutes(s.value) || '00');
                        setEditingMinutes(s.key, normalized);
                        const hours = clampTimeInput(editingHours[s.key] ?? (getTimeHours(s.value) || '12'), 1, 12, '12');
                        const ampm = getTimeAMPM(s.value);
                        updateSetting(s.key, { value: `${hours}:${normalized} ${ampm}` });
                        e.target.value = normalized;
                      }}
                      on:blur={(e) => {
                        const normalized = clampTimeInput(editingMinutes[s.key] ?? (e.target?.value || ''), 0, 59, getTimeMinutes(s.value) || '00');
                        const hours = clampTimeInput(editingHours[s.key] ?? (getTimeHours(s.value) || '12'), 1, 12, '12');
                        const ampm = getTimeAMPM(s.value);
                        updateSetting(s.key, { value: `${hours}:${normalized} ${ampm}` });
                        setEditingMinutes(s.key, null);
                        e.target.value = normalized;
                      }}
                      class="w-20 text-center text-base font-semibold ring-1 ring-gray-200 focus:ring-blue-500 h-12"
                    />
                  </div>
                  
                  <!-- AM/PM -->
                  <div class="flex flex-col items-center">
                    <label for={`${s.key}-ampm`} class="text-xs text-gray-500 mb-1">AM/PM</label>
                    <Select 
                      selected={{ value: getTimeAMPM(s.value), label: getTimeAMPM(s.value) }}
                      onSelectedChange={(selected) => {
                        if (selected?.value) {
                          const ampm = selected.value;
                          const hours = getTimeHours(s.value);
                          const minutes = getTimeMinutes(s.value);
                          updateSetting(s.key, { value: `${hours.padStart(2, '0')}:${minutes} ${ampm}` });
                        }
                      }}
                    >
                      <SelectTrigger id={`${s.key}-ampm`} class="w-20 h-12 text-base ring-1 ring-gray-200 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
    
              {:else}
                <Input
                  type="text"
                  value={s.value ?? ""}
                  on:input={(e) => updateSetting(s.key, { value: e.target?.value ?? "" })}
                  class="w-64 ring-1 ring-gray-200 focus:ring-gray-300"
                  placeholder="Enter value"
                />
              {/if}
            </div>
            {/if}
          </div>
          </div>
        {/if}
      {/each}
    </div>
    
<style>
/* table look without <table>: we’re using CSS grid for easier control widths */

:global(.range-input) {
  -webkit-appearance: none;
  appearance: none;
  height: 0.4rem;
  border-radius: 9999px;
  background: linear-gradient(
    to right,
    #2563eb var(--range-progress, 50%),
    #e5e7eb var(--range-progress, 50%)
  );
  outline: none;
  cursor: pointer;
}

:global(.range-input::-webkit-slider-runnable-track) {
  height: 0.4rem;
  background: transparent;
}

:global(.range-input::-webkit-slider-thumb) {
  -webkit-appearance: none;
  appearance: none;
  height: 1rem;
  width: 1rem;
  border-radius: 9999px;
  background: #2563eb;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  margin-top: -0.3rem;
}

:global(.range-input::-moz-range-track) {
  height: 0.4rem;
  background: transparent;
}

:global(.range-input::-moz-range-thumb) {
  height: 1rem;
  width: 1rem;
  border-radius: 9999px;
  background: #2563eb;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
</style>
