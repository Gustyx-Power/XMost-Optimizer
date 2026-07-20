<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { Card } from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';

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

	const GB = 1024 * 1024 * 1024;

	onMount(() => {
		invoke('get_hardware_info').then((res) => {
			hwInfo = res as HardwareInfo;
		}).catch(console.error);

		const interval = setInterval(async () => {
			try {
				stats = (await invoke('get_system_stats')) as SystemStats;
			} catch (e) {
				console.error(e);
			}
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Dashboard - XMost Optimizer</title>
</svelte:head>

<div class="h-screen w-screen bg-bg-primary overflow-auto p-6">
	<div class="max-w-5xl mx-auto space-y-6">
		<header class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-text-primary">System Monitor</h1>
				<p class="text-text-secondary text-sm">Real-time telemetry and hardware profile</p>
			</div>
			<div class="flex items-center gap-3">
				<Badge variant="outline" class="font-mono border-accent-cyan text-accent-cyan bg-accent-cyan/10">
					{hwInfo ? 'ONLINE' : 'CONNECTING...'}
				</Badge>
			</div>
		</header>

		{#if hwInfo}
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card variant="glass" class="p-4 flex flex-col gap-1">
					<span class="text-xs text-text-muted font-semibold uppercase tracking-wider">Processor</span>
					<span class="text-sm text-text-primary truncate" title={hwInfo.cpu}>{hwInfo.cpu}</span>
				</Card>
				<Card variant="glass" class="p-4 flex flex-col gap-1">
					<span class="text-xs text-text-muted font-semibold uppercase tracking-wider">Graphics</span>
					<span class="text-sm text-text-primary truncate" title={hwInfo.gpu}>{hwInfo.gpu}</span>
				</Card>
				<Card variant="glass" class="p-4 flex flex-col gap-1">
					<span class="text-xs text-text-muted font-semibold uppercase tracking-wider">Motherboard</span>
					<span class="text-sm text-text-primary truncate" title={hwInfo.motherboard}>{hwInfo.motherboard}</span>
				</Card>
			</div>
		{/if}

		{#if stats}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- CPU Section -->
				<Card variant="interactive" class="p-6 space-y-4">
					<div class="flex items-center justify-between">
						<h2 class="text-lg font-semibold text-text-primary">CPU Load</h2>
						<span class="text-2xl text-accent-cyan font-mono">{stats.cpu_usage.toFixed(1)}%</span>
					</div>
					<Progress value={stats.cpu_usage} max={100} color="cyan" size="lg" />
				</Card>

				<!-- RAM Section -->
				<Card variant="interactive" class="p-6 space-y-4">
					<div class="flex items-center justify-between">
						<h2 class="text-lg font-semibold text-text-primary">Memory Usage</h2>
						<span class="text-2xl text-accent-emerald font-mono">
							{(stats.used_memory / GB).toFixed(1)} <span class="text-text-muted text-lg">/ {(stats.total_memory / GB).toFixed(1)} GB</span>
						</span>
					</div>
					<div class="space-y-3">
						<Progress value={stats.used_memory} max={stats.total_memory} color="emerald" size="lg" />
						<div class="flex justify-between text-xs text-text-secondary mt-2 font-mono">
							<span>Available: {(stats.available_memory / GB).toFixed(2)} GB</span>
							<span>Used: {(stats.used_memory / GB).toFixed(2)} GB</span>
						</div>
					</div>
				</Card>
			</div>
			
			<!-- System Overview / Controls placeholder -->
			<Card variant="default" class="p-6 space-y-4 mt-6">
				<div class="flex justify-between items-center">
					<h2 class="text-lg font-semibold text-text-primary">Quick Actions (Module 2 & 3 Preview)</h2>
				</div>
				<Separator />
				<div class="flex gap-4">
					<Button variant="glow">Purge Standby Memory</Button>
					<Button variant="outline">Ultimate Power Plan</Button>
				</div>
			</Card>
		{:else}
			<div class="flex items-center justify-center h-64 w-full">
				<div class="status-dot bg-accent-cyan"></div>
				<span class="ml-3 text-text-muted text-sm">Initializing Telemetry...</span>
			</div>
		{/if}
	</div>
</div>
