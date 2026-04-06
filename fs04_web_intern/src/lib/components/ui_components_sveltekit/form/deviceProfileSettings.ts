// Device Profile Settings Configuration
export const availableSettings: any[] = [
    // Security Settings
    {
        key: 'kiosk_lock_mode',
        label: 'Kiosk Lock Mode',
        dataType: 'boolean',
        category: 'Security',
        defaultValue: 'disabled',
        description: 'Enable kiosk mode to lock the device interface'
    },
    {
        key: 'exit_lockdown_password',
        label: 'Exit Lockdown Password',
        dataType: 'password',
        category: 'Security',
        defaultValue: '',
        description: 'Password required to exit kiosk mode',
        dependsOn: 'kiosk_lock_mode'
    },
    
    // Display Settings
    {
        key: 'display_resolution',
        label: 'Display Resolution',
        dataType: 'select',
        category: 'Display',
        options: [
            { label: '640×480 (VGA)', value: '640x480' },
            { label: '800×600 (SVGA)', value: '800x600' },
            { label: '1024×768 (XGA)', value: '1024x768' },
            { label: '1280×720 (HD)', value: '1280x720' },
            { label: '1280×800 (WXGA)', value: '1280x800' },
            { label: '1280×1024 (SXGA)', value: '1280x1024' },
            { label: '1366×768 (HD)', value: '1366x768' },
            { label: '1440×900 (WXGA+)', value: '1440x900' },
            { label: '1600×900 (HD+)', value: '1600x900' },
            { label: '1600×1200 (UXGA)', value: '1600x1200' },
            { label: '1680×1050 (WSXGA+)', value: '1680x1050' },
            { label: '1920×1080 (Full HD)', value: '1920x1080' },
            { label: '1920×1200 (WUXGA)', value: '1920x1200' },
            { label: '2560×1440 (2K QHD)', value: '2560x1440' },
            { label: '2560×1600 (WQXGA)', value: '2560x1600' },
            { label: '3840×2160 (4K UHD)', value: '3840x2160' },
            { label: '5120×2880 (5K)', value: '5120x2880' },
            { label: '7680×4320 (8K UHD)', value: '7680x4320' }
        ],
        defaultValue: '1920x1080',
        description: 'Screen resolution for the device'
    },
    {
        key: 'screen_orientation',
        label: 'Screen Orientation',
        dataType: 'select',
        category: 'Display',
        options: [
            { label: 'Landscape', value: 'landscape' },
            { label: 'Portrait', value: 'portrait' },
            { label: 'Auto Rotate', value: 'auto' }
        ],
        defaultValue: 'landscape',
        description: 'Screen orientation preference'
    },
    {
        key: 'brightness_level',
        label: 'Brightness Level',
        dataType: 'range',
        category: 'Display',
        min: 10,
        max: 100,
        unit: '%',
        defaultValue: '75',
        description: 'Screen brightness level (10-100%)'
    },
    
    // Audio Settings
    {
        key: 'enable_audio',
        label: 'Enable Audio',
        dataType: 'boolean',
        category: 'Audio',
        defaultValue: 'enabled',
        description: 'Enable or disable audio output'
    },
    {
        key: 'volume_level',
        label: 'Volume Level',
        dataType: 'range',
        category: 'Audio',
        min: 0,
        max: 100,
        unit: '%',
        defaultValue: '75',
        description: 'Audio volume level (0-100%)',
        dependsOn: 'enable_audio'
    },

    // System Settings
    {
        key: 'timezone',
        label: 'Timezone',
        dataType: 'timezone',
        category: 'System',
        defaultValue: 'UTC',
        description: 'Device timezone setting'
    },
    {
        key: 'home_launcher',
        label: 'Home/Launcher',
        dataType: 'home_launcher',
        category: 'System',
        defaultValue: '',
        description: 'Default home screen launcher'
    },
    {
        key: 'kiosk_application',
        label: 'Kiosk Application',
        dataType: 'kiosk_app',
        category: 'System',
        defaultValue: '',
        description: 'Application to run in kiosk mode'
    },
    
    // Power Management Settings
    {
        key: 'power_management_schedule',
        label: 'Power Management Schedule',
        dataType: 'boolean',
        category: 'Power',
        defaultValue: 'disabled',
        description: 'Enable scheduled power on/off times'
    },
    {
        key: 'power_on_datetime',
        label: 'Power-On Date & Time',
        dataType: 'datetime',
        category: 'Power',
        defaultValue: '',
        description: 'Scheduled time to turn on the device',
        dependsOn: 'power_management_schedule'
    },
    {
        key: 'power_off_datetime',
        label: 'Power-Off Date & Time',
        dataType: 'datetime',
        category: 'Power',
        defaultValue: '',
        description: 'Scheduled time to turn off the device',
        dependsOn: 'power_management_schedule'
    },
    
    // Reboot Schedule
    {
        key: 'reboot_schedule_enabled',
        label: 'Reboot Schedule',
        dataType: 'boolean',
        category: 'Maintenance',
        defaultValue: 'disabled',
        description: 'Enable scheduled device reboots'
    },
    {
        key: 'reboot_schedule_frequency',
        label: 'Reboot Frequency',
        dataType: 'select',
        category: 'Maintenance',
        defaultValue: 'daily',
        description: 'How often to reboot the device',
        dependsOn: 'reboot_schedule_enabled',
        options: [
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' }
        ]
    },
    {
        key: 'reboot_schedule_day',
        label: 'Reboot Day',
        dataType: 'select',
        category: 'Maintenance',
        defaultValue: 'monday',
        description: 'Day of the week for scheduled reboot',
        dependsOn: 'reboot_schedule_frequency',
        options: [
            { label: 'Monday', value: 'monday' },
            { label: 'Tuesday', value: 'tuesday' },
            { label: 'Wednesday', value: 'wednesday' },
            { label: 'Thursday', value: 'thursday' },
            { label: 'Friday', value: 'friday' },
            { label: 'Saturday', value: 'saturday' },
            { label: 'Sunday', value: 'sunday' }
        ]
    },
    {
        key: 'reboot_schedule_time',
        label: 'Reboot Time',
        dataType: 'time',
        category: 'Maintenance',
        defaultValue: '02:00',
        description: 'Time for scheduled reboot',
        dependsOn: 'reboot_schedule_enabled'
    },
    
    // Download Schedule
    {
        key: 'download_schedule_enabled',
        label: 'Download Schedule',
        dataType: 'boolean',
        category: 'Maintenance',
        defaultValue: 'disabled',
        description: 'Enable scheduled content downloads'
    },
    {
        key: 'download_schedule_frequency',
        label: 'Download Frequency',
        dataType: 'select',
        category: 'Maintenance',
        defaultValue: 'daily',
        description: 'How often to download content',
        dependsOn: 'download_schedule_enabled',
        options: [
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' }
        ]
    },
    {
        key: 'download_schedule_day',
        label: 'Download Day',
        dataType: 'select',
        category: 'Maintenance',
        defaultValue: 'monday',
        description: 'Day of the week for scheduled downloads',
        dependsOn: 'download_schedule_frequency',
        options: [
            { label: 'Monday', value: 'monday' },
            { label: 'Tuesday', value: 'tuesday' },
            { label: 'Wednesday', value: 'wednesday' },
            { label: 'Thursday', value: 'thursday' },
            { label: 'Friday', value: 'friday' },
            { label: 'Saturday', value: 'saturday' },
            { label: 'Sunday', value: 'sunday' }
        ]
    },
    {
        key: 'download_schedule_time',
        label: 'Download Time',
        dataType: 'time',
        category: 'Maintenance',
        defaultValue: '03:00',
        description: 'Time for scheduled downloads',
        dependsOn: 'download_schedule_enabled'
    },
];

// Helper function to get settings by category
export function getSettingsByCategory(settings: any[]) {
    return settings.reduce((acc, setting) => {
        const category = setting.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(setting);
        return acc;
    }, {});
}

// Helper function to get dependent settings
export function getDependentSettings(settings: any[], parentKey: string) {
    return settings.filter(setting => setting.dependsOn === parentKey);
}

// Helper function to check if a setting should be visible
export function isSettingVisible(setting: any, allSettings: any[]) {
    if (!setting.dependsOn) return true;
    
    const parentSetting = allSettings.find(s => s.key === setting.dependsOn);
    return parentSetting?.enabled === true;
}
