<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { Card } from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import Sparkline from '$lib/components/ui/sparkline/Sparkline.svelte';

	type HardwareInfo = {
		cpu: string;
		gpu: string;
		motherboard: string;
	};

	type SystemStats = {
		cpu_usage: number;
		total_memory: number;
		used_memory: number;
		available_memory: number;
	};

	let hwInfo = $state<HardwareInfo | null>(null);
	let stats = $state<SystemStats | null>(null);
	
	let cpuHistory = $state<number[]>(Array(30).fill(0));
	let memHistory = $state<number[]>(Array(30).fill(0));

	const GB = 1024 * 1024 * 1024;

	onMount(() => {
		invoke('get_hardware_info').then((res) => {
			hwInfo = res as HardwareInfo;
		}).catch(console.error);

		const interval = setInterval(async () => {
			try {
				stats = (await invoke('get_system_stats')) as SystemStats;
				if (stats) {
					if (cpuHistory[0] === 0 && cpuHistory[29] === 0) {
						// Initialize history arrays with first real values to prevent massive visual spikes
						cpuHistory = Array(30).fill(stats.cpu_usage);
						memHistory = Array(30).fill(stats.used_memory);
					} else {
						cpuHistory = [...cpuHistory.slice(1), stats.cpu_usage];
						memHistory = [...memHistory.slice(1), stats.used_memory];
					}
				}
			} catch (e) {
				console.error(e);
			}
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>System Monitor - XMost Optimizer</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-8 font-sans">
	<!-- MD3 Header -->
	<header class="flex items-center justify-between pb-2 border-b border-white/[0.02]">
		<div>
			<h1 class="text-3xl font-normal tracking-tight text-text-primary">System Monitor</h1>
			<p class="text-text-secondary text-xs mt-1">Real-time system telemetry and hardware profiles</p>
		</div>
	</header>

	<!-- Hardware Profiles Grid: Large, 3xl Cards -->
	{#if hwInfo}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- CPU Card -->
			<Card variant="interactive" class="p-6 h-44 flex flex-col justify-between bg-bg-card rounded-3xl shadow-sm">
				<div class="flex items-start justify-between">
					<div class="flex flex-col gap-0.5">
						<span class="text-[10px] text-text-muted font-bold uppercase tracking-wider">Processor</span>
						<span class="text-base font-normal text-text-primary line-clamp-3 mt-1 leading-snug" title={hwInfo.cpu}>
							{hwInfo.cpu}
						</span>
					</div>
					<div class="p-2 rounded-2xl bg-accent-cyan/10 text-accent-cyan">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<rect x="4" y="4" width="16" height="16" rx="2" />
							<path d="M9 9h6v6H9z" />
							<path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
						</svg>
					</div>
				</div>
				<span class="text-[10px] font-mono text-text-muted">Host CPU Cluster</span>
			</Card>

			<!-- GPU Card -->
			<Card variant="interactive" class="p-6 h-44 flex flex-col justify-between bg-bg-card rounded-3xl shadow-sm">
				<div class="flex items-start justify-between">
					<div class="flex flex-col gap-0.5">
						<span class="text-[10px] text-text-muted font-bold uppercase tracking-wider">Graphics</span>
						<span class="text-base font-normal text-text-primary line-clamp-3 mt-1 leading-snug" title={hwInfo.gpu}>
							{hwInfo.gpu}
						</span>
					</div>
					<div class="p-2 rounded-2xl bg-accent-amber/10 text-accent-amber">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<rect x="2" y="5" width="20" height="14" rx="2" />
							<path d="M6 9h4v6H6z" />
							<path d="M14 9h4M14 12h4M14 15h4" />
						</svg>
					</div>
				</div>
				<span class="text-[10px] font-mono text-text-muted">Dedicated GPU Adapter</span>
			</Card>

			<!-- Motherboard Card -->
			<Card variant="interactive" class="p-6 h-44 flex flex-col justify-between bg-bg-card rounded-3xl shadow-sm">
				<div class="flex items-start justify-between">
					<div class="flex flex-col gap-0.5">
						<span class="text-[10px] text-text-muted font-bold uppercase tracking-wider">Motherboard</span>
						<span class="text-base font-normal text-text-primary line-clamp-3 mt-1 leading-snug" title={hwInfo.motherboard}>
							{hwInfo.motherboard}
						</span>
					</div>
					<div class="p-2 rounded-2xl bg-accent-emerald/10 text-accent-emerald">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<rect x="3" y="3" width="18" height="18" rx="2" />
							<path d="M21 12H3" />
							<path d="M12 3v18" />
							<circle cx="7.5" cy="7.5" r="1.5" />
							<circle cx="16.5" cy="16.5" r="1.5" />
						</svg>
					</div>
				</div>
				<span class="text-[10px] font-mono text-text-muted">Baseboard Platform</span>
			</Card>
		</div>
	{/if}

	<!-- Dynamic Telemetry Graphs and Load: Thick MD3 progress indicators -->
	{#if stats}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- CPU Usage Telemetry -->
			<Card class="p-6 flex flex-col gap-4 bg-bg-card rounded-3xl shadow-sm">
				<div class="flex items-start justify-between">
					<div>
						<h2 class="text-lg font-normal text-text-primary">CPU Load</h2>
						<p class="text-xs text-text-muted">Total execution index</p>
					</div>
					<span class="text-3xl font-normal text-accent-cyan font-mono tracking-tight">{stats.cpu_usage.toFixed(1)}%</span>
				</div>
				
				<!-- Sparkline history -->
				<div class="h-16 w-full rounded-2xl overflow-hidden bg-bg-primary/30 p-2 border border-white/[0.01]">
					<Sparkline data={cpuHistory} max={100} color="text-accent-cyan" gradientId="cpu-grad" fillOpacity={0.15} strokeWidth={1.8} />
				</div>

				<!-- Thick, fully rounded linear progress indicator -->
				<div class="space-y-1.5 mt-2">
					<div class="flex justify-between text-[10px] text-text-muted uppercase tracking-wider font-mono">
						<span>Load Index</span>
						<span>100% Max</span>
					</div>
					<Progress value={stats.cpu_usage} max={100} color="cyan" size="md" />
				</div>
			</Card>

			<!-- RAM Memory Telemetry -->
			<Card class="p-6 flex flex-col gap-4 bg-bg-card rounded-3xl shadow-sm">
				<div class="flex items-start justify-between">
					<div>
						<h2 class="text-lg font-normal text-text-primary">Memory Usage</h2>
						<p class="text-xs text-text-muted">Physical address workspace</p>
					</div>
					<div class="text-right">
						<span class="text-3xl font-normal text-accent-cyan font-mono tracking-tight">
							{(stats.used_memory / GB).toFixed(1)}
						</span>
						<span class="text-text-muted text-sm font-normal"> / {(stats.total_memory / GB).toFixed(1)} GB</span>
					</div>
				</div>
				
				<!-- Sparkline history -->
				<div class="h-16 w-full rounded-2xl overflow-hidden bg-bg-primary/30 p-2 border border-white/[0.01]">
					<Sparkline data={memHistory} max={stats.total_memory} color="text-accent-emerald" gradientId="mem-grad" fillOpacity={0.15} strokeWidth={1.8} />
				</div>

				<!-- Thick, fully rounded linear progress indicator -->
				<div class="space-y-2 mt-2">
					<Progress value={stats.used_memory} max={stats.total_memory} color="emerald" size="md" />
					<div class="flex justify-between text-[11px] text-text-secondary font-mono mt-1">
						<span class="flex items-center gap-1.5">
							<span class="w-1.5 h-1.5 rounded-full bg-accent-emerald/60"></span>
							Used: {(stats.used_memory / GB).toFixed(2)} GB
						</span>
						<span class="flex items-center gap-1.5">
							<span class="w-1.5 h-1.5 rounded-full bg-white/20"></span>
							Available: {(stats.available_memory / GB).toFixed(2)} GB
						</span>
					</div>
				</div>
			</Card>
		</div>
	{:else}
		<!-- Loading state -->
		<div class="flex flex-col items-center justify-center h-64 w-full bg-bg-card rounded-3xl shadow-sm p-8 text-center border border-white/[0.01]">
			<div class="w-10 h-10 rounded-full border-4 border-accent-cyan/20 border-t-accent-cyan animate-spin"></div>
			<span class="mt-4 text-text-secondary text-sm font-medium">Initializing Telemetry Channel...</span>
		</div>
	{/if}
</div>
