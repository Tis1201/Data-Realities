<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	export let status: string = '';
	export let className: string = '';
	
	// Define color mappings for different status values
	const statusColors = {
		// Generic statuses
		'active': "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
		'inactive': "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
		'pending': "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
		'suspended': "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100",
		'deleted': "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
		'maintenance': "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100",
		
		// Bundle-specific statuses
		'draft': "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
		'published': "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
		'cancelled': "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
		'completed': "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
		'failed': "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
		
		// Sync statuses
		'synced': "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
		
		'default': "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
	};
	
	// Compute the CSS class based on the status
	$: statusLower = status?.toLowerCase() || '';
	$: statusClass = statusColors[statusLower as keyof typeof statusColors] || statusColors['default'];
	$: displayText = status ? status.toUpperCase() : '';
</script>

<Badge variant="outline" class="{statusClass} {className}">
	{displayText}
</Badge>
