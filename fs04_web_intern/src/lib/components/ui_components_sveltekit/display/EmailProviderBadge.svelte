<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	export let type: string = '';
	
	const typeColors = {
		smtp: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
		resend: "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100",
		sendgrid: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
		mailgun: "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100",
		ses: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
		postmark: "bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-100"
	};
	
	$: typeClass = typeColors[type.toLowerCase() as keyof typeof typeColors] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
	$: displayText = type ? type.toUpperCase() : '';
</script>

<Badge variant="outline" class={typeClass}>
	{displayText}
</Badge>
