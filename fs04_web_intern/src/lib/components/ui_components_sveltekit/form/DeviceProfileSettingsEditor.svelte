<script lang="ts">
    import { Plus, Trash } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
    import { Switch } from "$lib/components/ui/switch";
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { onMount } from 'svelte';

    export let settings: any[] = [];
    export let availableSettings: any[] = [];

    // Function to add a new setting
    function addSetting() {
        const newSetting = {
            key: '',
            value: '',
            dataType: 'string',
            label: '',
            category: 'General',
            order: settings.length
        };
        settings = [...settings, newSetting];
        console.log('[DeviceProfileSettingsEditor] addSetting:', newSetting, 'current settings:', settings);
    }

    // Function to remove a setting
    function removeSetting(index: number) {
        console.log('[DeviceProfileSettingsEditor] removeSetting index:', index, 'target:', settings[index]);
        settings = settings.filter((_, i) => i !== index);
        console.log('[DeviceProfileSettingsEditor] settings after remove:', settings);
    }

    // Function to update a setting
    function updateSetting(index: number, field: string, value: any) {
        console.log('[DeviceProfileSettingsEditor] updateSetting before:', { index, field, incomingValue: value, current: settings[index] });
        settings[index] = { ...settings[index], [field]: value };
        settings = [...settings]; // Trigger reactivity
        console.log('[DeviceProfileSettingsEditor] updateSetting after:', settings[index]);
    }

    onMount(() => {
        console.log('[DeviceProfileSettingsEditor] initial settings (onMount):', settings);
    });

    $: console.log('[DeviceProfileSettingsEditor] settings changed:', settings);
</script>

<Card>
    <CardHeader>
        <div class="flex items-center justify-between">
            <CardTitle>Profile Settings</CardTitle>
            <Button type="button" variant="outline" size="sm" on:click={addSetting}>
                <Plus class="w-4 h-4 mr-2" />
                Add Setting
            </Button>
        </div>
    </CardHeader>
    <CardContent>
        {#if settings && settings.length > 0}
            <!-- Group settings by category -->
            {#each ['Security', 'Display', 'Audio', 'Power', 'Maintenance'] as category}
                {@const categorySettings = settings.filter(s => s.category === category)}
                {#if categorySettings.length > 0}
                    <div class="mb-8">
                        <!-- Category Header -->
                        <div class="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200">
                            {#if category === 'Security'}
                                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                </svg>
                            {:else if category === 'Display'}
                                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                            {:else if category === 'Audio'}
                                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
                                </svg>
                            {:else if category === 'Power'}
                                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                            {:else if category === 'Maintenance'}
                                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                            {/if}
                            <h3 class="text-lg font-semibold text-gray-900">{category}</h3>
                        </div>
                        
                        <!-- Settings in this category -->
                        <div class="space-y-4">
                            {#each categorySettings as setting, index}
                                {@const globalIndex = settings.findIndex(s => s === setting)}
                                <div class="flex items-center justify-between py-3">
                                    <div class="flex-1">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <h4 class="font-medium text-gray-900">{setting.label}</h4>
                                                <p class="text-sm text-gray-500">
                                                    {#if setting.key === 'kiosk_lock_mode'}
                                                        Enable kiosk mode to lock down the device interface
                                                    {:else if setting.key === 'exit_lockdown_password'}
                                                        Password required to exit lockdown mode
                                                    {:else if setting.key === 'display_resolution'}
                                                        Set the display resolution for the device
                                                    {:else if setting.key === 'screen_orientation'}
                                                        Configure screen orientation (landscape or portrait)
                                                    {:else if setting.key === 'enable_audio'}
                                                        Enable or disable audio output on the device
                                                    {:else if setting.key === 'volume_level'}
                                                        Set the default volume level (0-100%)
                                                    {:else if setting.key === 'power_management_schedule'}
                                                        Configure automatic power management schedule
                                                    {:else if setting.key === 'reboot_schedule'}
                                                        Set automatic reboot schedule for maintenance
                                                    {:else if setting.key === 'download_schedule'}
                                                        Configure automatic download schedule
                                                    {:else}
                                                        Configure this setting for the device
                                                    {/if}
                                                </p>
                                            </div>
                                            <div class="flex items-center gap-3">
                                                <!-- Setting Control -->
                                                {#if setting.dataType === 'select' && (setting.key === 'kiosk_lock_mode' || setting.key === 'enable_audio' || setting.key === 'power_management_schedule' || setting.key === 'reboot_schedule' || setting.key === 'download_schedule')}
                                                    <!-- Toggle Switch for Enable/Disable settings -->
                                                    <div class="flex items-center">
                                                        <Switch
                                                            checked={setting.value === 'enabled'}
                                                            onCheckedChange={(checked) => updateSetting(globalIndex, 'value', checked ? 'enabled' : 'disabled')}
                                                        />
                                                    </div>
                                                {:else if setting.dataType === 'select' && setting.key === 'display_resolution'}
                                                    <!-- Dropdown for Display Resolution -->
                                                    <Select
                                                        value={setting.value}
                                                        onValueChange={(value) => updateSetting(globalIndex, 'value', value)}
                                                    >
                                                        <SelectTrigger class="w-48">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="1920x1080">1920x1080 (Full HD)</SelectItem>
                                                            <SelectItem value="1366x768">1366x768 (HD)</SelectItem>
                                                            <SelectItem value="1280x720">1280x720 (HD Ready)</SelectItem>
                                                            <SelectItem value="2560x1440">2560x1440 (2K)</SelectItem>
                                                            <SelectItem value="3840x2160">3840x2160 (4K)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                {:else if setting.dataType === 'select' && setting.key === 'screen_orientation'}
                                                    <!-- Dropdown for Screen Orientation -->
                                                    <Select
                                                        value={setting.value}
                                                        onValueChange={(value) => updateSetting(globalIndex, 'value', value)}
                                                    >
                                                        <SelectTrigger class="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="landscape">Landscape</SelectItem>
                                                            <SelectItem value="portrait">Portrait</SelectItem>
                                                            <SelectItem value="landscape">Landscape Flipped</SelectItem>
                                                            <SelectItem value="landscape">Portrait Flipped</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                {:else if setting.dataType === 'number'}
                                                    <!-- Number Input for Volume Level -->
                                                    <div class="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            value={setting.value}
                                                            min="0"
                                                            max="100"
                                                            class="w-20"
                                                            on:input={(e) => updateSetting(globalIndex, 'value', e.target?.value || '')}
                                                        />
                                                        <span class="text-sm text-gray-500">%</span>
                                                    </div>
                                                {:else if setting.dataType === 'password'}
                                                    <!-- Password Input -->
                                                    <Input
                                                        type="password"
                                                        value={setting.value}
                                                        placeholder="Enter password"
                                                        class="w-48"
                                                        on:input={(e) => updateSetting(globalIndex, 'value', e.target?.value || '')}
                                                    />
                                                {:else}
                                                    <!-- Default Text Input -->
                                                    <Input
                                                        type="text"
                                                        value={setting.value}
                                                        placeholder="Enter value"
                                                        class="w-48"
                                                        on:input={(e) => updateSetting(globalIndex, 'value', e.target?.value || '')}
                                                    />
                                                {/if}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    on:click={() => removeSetting(globalIndex)}
                                                    class="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash class="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            {/each}
        {:else}
            <div class="text-center py-8 text-muted-foreground">
                <p>No settings configured yet.</p>
                <p class="text-sm">Click "Add Setting" to start configuring your device profile.</p>
            </div>
        {/if}
    </CardContent>
</Card>
