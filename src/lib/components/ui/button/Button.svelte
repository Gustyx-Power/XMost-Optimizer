<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'glow';
	type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

	interface ButtonProps extends HTMLButtonAttributes {
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
		children: Snippet;
	}

	const variantClasses: Record<ButtonVariant, string> = {
		default: 'bg-accent-cyan text-bg-primary hover:bg-accent-cyan/90 shadow-sm',
		destructive: 'bg-accent-red text-white hover:bg-accent-red/90 shadow-sm',
		outline: 'border border-border-default bg-transparent hover:bg-bg-card hover:border-border-active text-text-primary',
		secondary: 'bg-bg-card text-text-primary hover:bg-bg-card-hover border border-border-glass',
		ghost: 'hover:bg-bg-card text-text-secondary hover:text-text-primary',
		link: 'text-accent-cyan underline-offset-4 hover:underline',
		glow: 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/20 hover:border-accent-cyan/50 hover:shadow-glow-cyan',
	};

	const sizeClasses: Record<ButtonSize, string> = {
		default: 'h-9 px-4 py-2 text-sm',
		sm: 'h-8 px-3 text-xs',
		lg: 'h-11 px-8 text-base',
		icon: 'h-9 w-9',
	};

	let {
		variant = 'default',
		size = 'default',
		class: className,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

<button
	class={cn(
		'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-button)] font-medium transition-all duration-200 ease-[var(--ease-smooth)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
		variantClasses[variant],
		sizeClasses[size],
		className
	)}
	{...restProps}
>
	{@render children()}
</button>
