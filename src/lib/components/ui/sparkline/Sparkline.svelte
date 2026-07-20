<script lang="ts">
	let {
		data = [],
		max = 100,
		color = 'text-accent-cyan',
		gradientId = 'sparkline-grad',
		fillOpacity = 0.3,
		strokeWidth = 2
	}: {
		data?: number[];
		max?: number;
		color?: string;
		gradientId?: string;
		fillOpacity?: number;
		strokeWidth?: number;
	} = $props();

	let points = $derived(data.map((val, i) => {
		const x = (i / Math.max(1, data.length - 1)) * 100;
		const y = Math.max(0, Math.min(100, 100 - (val / max) * 100));
		return { x, y };
	}));

	let pathData = $derived(points.reduce((acc, point, i, arr) => {
		if (i === 0) return `M ${point.x},${point.y}`;
		const prev = arr[i - 1];
		const midX = (prev.x + point.x) / 2;
		return `${acc} C ${midX},${prev.y} ${midX},${point.y} ${point.x},${point.y}`;
	}, ''));

	let fillPath = $derived(points.length > 0 ? `${pathData} L 100,100 L 0,100 Z` : '');
</script>

<div class="w-full h-full relative overflow-hidden">
	<svg
		viewBox="0 0 100 100"
		preserveAspectRatio="none"
		class="w-full h-full overflow-visible"
	>
		<defs>
			<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="currentColor" stop-opacity={fillOpacity} />
				<stop offset="100%" stop-color="currentColor" stop-opacity="0" />
			</linearGradient>
		</defs>
		{#if points.length > 1}
			<path
				d={fillPath}
				fill={`url(#${gradientId})`}
				class={color}
				style="transition: d 0.3s ease-out;"
			/>
			<path
				d={pathData}
				fill="none"
				class={`stroke-current ${color}`}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-linejoin="round"
				vector-effect="non-scaling-stroke"
				style="transition: d 0.3s ease-out;"
			/>
		{/if}
	</svg>
</div>
