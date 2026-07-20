<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

	interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
		variant?: BadgeVariant;
		class?: string;
		children: Snippet;
	}

	const variantClasses: Record<BadgeVariant, string> = {
		default: 'bg-bg-card text-text-secondary border-border-default',
		success: 'bg-accent-emerald/15 text-accent-emerald border-accent-emerald/30',
		warning: 'bg-accent-amber/15 text-accent-amber border-accent-amber/30',
		danger: 'bg-accent-red/15 text-accent-red border-accent-red/30',
		info: 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30',
		outline: 'bg-transparent text-text-secondary border-border-default',
	};

	let {
		variant = 'default',
		class: className,
		children,
		...restProps
	}: BadgeProps = $props();
</script>

<span
	class={cn(
		'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
		variantClasses[variant],
		className
	)}
	{...restProps}
>
	{@render children()}
</span>
