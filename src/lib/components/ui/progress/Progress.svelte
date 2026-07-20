<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	type ProgressColor = 'cyan' | 'emerald' | 'amber' | 'red' | 'purple';

	interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
		value?: number;
		max?: number;
		color?: ProgressColor;
		size?: 'sm' | 'md' | 'lg';
		showLabel?: boolean;
		class?: string;
	}

	const colorClasses: Record<ProgressColor, string> = {
		cyan: 'bg-accent-cyan',
		emerald: 'bg-accent-emerald',
		amber: 'bg-accent-amber',
		red: 'bg-accent-red',
		purple: 'bg-accent-purple',
	};

	const trackClasses: Record<ProgressColor, string> = {
		cyan: 'bg-accent-cyan/15',
		emerald: 'bg-accent-emerald/15',
		amber: 'bg-accent-amber/15',
		red: 'bg-accent-red/15',
		purple: 'bg-accent-purple/15',
	};

	const sizeClasses: Record<string, string> = {
		sm: 'h-2',
		md: 'h-3.5',
		lg: 'h-5',
	};

	let {
		value = 0,
		max = 100,
		color = 'cyan',
		size = 'md',
		showLabel = false,
		class: className,
		...restProps
	}: ProgressProps = $props();

	let percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));
</script>

<div class={cn('flex items-center gap-3 w-full', className)} {...restProps}>
	<div
		class={cn(
			'relative w-full overflow-hidden rounded-full',
			trackClasses[color],
			sizeClasses[size]
		)}
		role="progressbar"
		aria-valuenow={value}
		aria-valuemin={0}
		aria-valuemax={max}
	>
		<div
			class={cn(
				'h-full rounded-full transition-all duration-500 ease-[var(--ease-smooth)]',
				colorClasses[color]
			)}
			style="width: {percentage}%"
		></div>
	</div>
	{#if showLabel}
		<span class="text-data text-xs text-text-secondary min-w-[4ch] text-right font-medium">
			{Math.round(percentage)}%
		</span>
	{/if}
</div>
