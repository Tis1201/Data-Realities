<script lang="ts">
    export let code: string;
    export let language = 'json';
    export let copyable = true;
    export let className = '';
    export let wrapWords = true;
    export let showLineNumbers = true;

    function copyCode() {
        navigator.clipboard.writeText(code);
    }

    function getLines() {
        return code.split('\n').length;
    }
</script>

<div class="relative rounded-md border bg-muted w-full max-w-full">
    {#if copyable}
        <button 
            class="absolute right-2 top-2 p-1.5 text-muted-foreground hover:text-foreground rounded-md transition-colors"
            on:click={copyCode}
            aria-label="Copy code"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
        </button>
    {/if}

    {#if showLineNumbers}
        <div class="absolute left-0 top-0 h-full w-8 bg-muted/50 border-r border-border">
            {#each Array(getLines()).keys() as i}
                <span class="block h-6 text-right text-xs text-muted-foreground px-1">
                    {i + 1}
                </span>
            {/each}
        </div>
    {/if}

    <div class="relative w-full overflow-auto">
        <pre class="p-4 text-sm font-mono {wrapWords ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'} {className} {showLineNumbers ? 'pl-10' : ''}">
            {code}
        </pre>
    </div>
</div>
