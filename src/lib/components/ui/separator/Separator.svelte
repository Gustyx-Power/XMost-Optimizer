<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
		orientation?: 'horizontal' | 'vertical';
		class?: string;
	}

	let {
		orientation = 'horizontal',
		class: className,
		...restProps
	}: SeparatorProps = $props();
</script>

<div
	role="separator"
	aria-orientation={orientation}
	class={cn(
		'shrink-0 bg-border-default',
		orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
		className
	)}
	{...restProps}
></div>
