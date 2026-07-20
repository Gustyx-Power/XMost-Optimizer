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

	// Material Design 3 Card styling: borderless, tonal backgrounds, extreme rounded corners
	const variantClasses: Record<string, string> = {
		default: 'bg-bg-card rounded-[var(--radius-card)] shadow-[var(--shadow-card)]',
		glass: 'bg-bg-card/90 backdrop-blur-md rounded-[var(--radius-card)] shadow-[var(--shadow-card)]',
		interactive: 'bg-bg-card rounded-[var(--radius-card)] shadow-[var(--shadow-card)] transition-all duration-200 ease-[var(--ease-smooth)] hover:bg-bg-card-hover hover:scale-[1.01] cursor-pointer',
	};
</script>

<div class={cn(variantClasses[variant], className)} {...restProps}>
	{@render children()}
</div>
