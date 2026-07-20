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
		cyan: 'bg-accent-cyan shadow-[0_0_8px_rgba(56,189,248,0.4)]',
		emerald: 'bg-accent-emerald shadow-[0_0_8px_rgba(52,211,153,0.4)]',
		amber: 'bg-accent-amber shadow-[0_0_8px_rgba(251,191,36,0.4)]',
		red: 'bg-accent-red shadow-[0_0_8px_rgba(248,113,113,0.4)]',
		purple: 'bg-accent-purple shadow-[0_0_8px_rgba(167,139,250,0.4)]',
	};

	const sizeClasses: Record<string, string> = {
		sm: 'h-1',
		md: 'h-2',
		lg: 'h-3',
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

<div class={cn('flex items-center gap-3', className)} {...restProps}>
	<div
		class={cn(
			'relative w-full overflow-hidden rounded-full bg-bg-card',
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
		<span class="text-data text-xs text-text-secondary min-w-[3ch] text-right">
			{Math.round(percentage)}%
		</span>
	{/if}
</div>
