<script lang="ts">
    import { Badge } from '$lib/components/ui/badge';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
    import type { JwtSigningKey } from '@prisma/client';
    
    export let key: JwtSigningKey | undefined;
    export let keyType: 'FACTORY' | 'TOKEN' | 'LINK';
    export let title: string;
    export let description: string;
    export let tokenCount: string | undefined = undefined;
    export let badgeColor: {
        bg: string;
        text: string;
        border?: string;
    } = {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200'
    };
    
    // Calculate key age in days
    $: keyAge = key ? Math.floor((new Date() - new Date(key.createdAt)) / (1000 * 60 * 60 * 24)) : 0;
    
    // Get badge color based on key type
    $: badgeColorClass = {
        FACTORY: 'bg-green-50 text-green-700',
        TOKEN: 'bg-blue-50 text-blue-700',
        LINK: 'bg-purple-50 text-purple-700'
    }[keyType] || 'bg-gray-50 text-gray-700';
</script>

<Card class="w-full">
    <CardHeader>
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <slot name="icon"></slot>
                <CardTitle>{title}</CardTitle>
            </div>
            {#if key}
                <Badge variant="outline" class="{badgeColor.bg} {badgeColor.text} {badgeColor.border || ''}">Active</Badge>
            {:else}
                <Badge variant="outline" class="bg-amber-50 text-amber-700 border-amber-200">Not Created</Badge>
            {/if}
        </div>
        <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
        {#if key}
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm font-medium">Key ID</p>
                        <p class="text-sm text-muted-foreground">{key.keyId}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium mb-1">Algorithm</p>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            {key.algorithm || 'RS256'}
                        </span>
                    </div>
                    <div>
                        <p class="text-sm font-medium">Created</p>
                        <p class="text-sm text-muted-foreground">{new Date(key.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium">Last Rotated</p>
                        <p class="text-sm text-muted-foreground">
                            {key.rotatedAt ? new Date(key.rotatedAt).toLocaleString() : 'Never'}
                        </p>
                    </div>
                </div>
                
                {#if tokenCount}
                    <div class="mt-3">
                        <div class="flex items-center justify-between">
                            <p class="text-xs text-gray-500">Tokens Signed</p>
                            <span class="text-xs px-2 py-0.5 rounded-full {badgeColorClass}">
                                Last 30 days
                            </span>
                        </div>
                        <div class="flex items-end gap-1 mt-1">
                            <span class="text-lg font-semibold">{tokenCount}</span>
                            <span class="text-xs text-gray-500 mb-1">tokens</span>
                        </div>
                    </div>
                {/if}
                
                <slot name="actions"></slot>
                
                <slot name="messages"></slot>
            </div>
        {:else}
            <div class="space-y-4">
                <p class="text-sm text-muted-foreground">No {keyType.toLowerCase()} key has been created yet.</p>
                <slot name="create-form"></slot>
            </div>
        {/if}
    </CardContent>
</Card>
