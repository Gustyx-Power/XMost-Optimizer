<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface CardProps extends HTMLAttributes<HTMLDivElement> {
		class?: string;
		children: Snippet;
		variant?: 'default' | 'glass' | 'interactive';
	}

	let {
		class: className,
		children,
		variant = 'default',
		...restProps
	}: CardProps = $props();

	const variantClasses: Record<string, string> = {
		default: 'bg-bg-card border border-border-default rounded-[var(--radius-card)] shadow-[var(--shadow-card)]',
		glass: 'glass-card',
		interactive: 'glass-card transition-all duration-200 ease-[var(--ease-smooth)] hover:border-border-active hover:shadow-[var(--shadow-glow-cyan)] hover:-translate-y-0.5 cursor-pointer',
	};
</script>

<div class={cn(variantClasses[variant], className)} {...restProps}>
	{@render children()}
</div>
