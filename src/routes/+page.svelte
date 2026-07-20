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

	let autoPurgeEnabled = $state(false);
	let purgeThresholdMb = $state(1024);
	let isPurging = $state(false);

	const GB = 1024 * 1024 * 1024;

	onMount(() => {
		invoke('get_hardware_info').then((res) => {
			hwInfo = res as HardwareInfo;
		}).catch(console.error);

		invoke('get_auto_purge_state').then((res) => {
			const [enabled, threshold] = res as [boolean, number];
			autoPurgeEnabled = enabled;
			purgeThresholdMb = threshold;
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

	async function purgeMemory() {
		if (isPurging) return;
		isPurging = true;
		try {
			await invoke('purge_memory_now');
		} catch (e) {
			console.error("Purge failed:", e);
			alert("Failed to purge memory. Make sure you run the app as Administrator.\nError: " + e);
		} finally {
			isPurging = false;
		}
	}

	async function onToggleAutoPurge() {
		autoPurgeEnabled = !autoPurgeEnabled;
		try {
			await invoke('toggle_auto_purge', { enabled: autoPurgeEnabled });
		} catch (e) {
			console.error(e);
		}
	}

	async function onThresholdChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = parseInt(target.value);
		if (!isNaN(val) && val > 0) {
			purgeThresholdMb = val;
			try {
				await invoke('set_auto_purge_threshold', { mb: purgeThresholdMb });
			} catch (err) {
				console.error(err);
			}
		}
	}
	let isTweakingPower = $state(false);
	let isTweakingCore = $state(false);

	async function applyUltimatePower() {
		if (isTweakingPower) return;
		isTweakingPower = true;
		try {
			const res = await invoke('apply_ultimate_power_plan');
			alert(res as string);
		} catch (e) {
			console.error(e);
			alert("Failed to apply power plan.\nError: " + e);
		} finally {
			isTweakingPower = false;
		}
	}

	async function disableCoreParking() {
		if (isTweakingCore) return;
		isTweakingCore = true;
		try {
			const res = await invoke('apply_core_parking_disable');
			alert(res as string);
		} catch (e) {
			console.error(e);
			alert("Failed to disable core parking.\nError: " + e);
		} finally {
			isTweakingCore = false;
		}
	}
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
			
			<!-- Memory Orchestrator -->
			<Card variant="default" class="p-6 space-y-4 mt-6 border border-accent-emerald/20">
				<div class="flex justify-between items-center">
					<h2 class="text-lg font-semibold text-text-primary">Memory Orchestrator</h2>
					<Badge variant="outline" class={autoPurgeEnabled ? "border-accent-emerald text-accent-emerald bg-accent-emerald/10" : ""}>
						{autoPurgeEnabled ? "AUTO-PURGE: ACTIVE" : "AUTO-PURGE: OFF"}
					</Badge>
				</div>
				<Separator />
				
				<div class="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
					<div class="space-y-2 flex-1 w-full max-w-sm">
						<div class="flex justify-between">
							<label for="threshold" class="text-sm font-medium text-text-primary">Auto-Purge Threshold</label>
							<span class="text-sm text-accent-emerald font-mono">{purgeThresholdMb} MB</span>
						</div>
						<input 
							id="threshold" 
							type="range" 
							min="512" 
							max="8192" 
							step="256" 
							value={purgeThresholdMb}
							onchange={onThresholdChange}
							class="w-full accent-accent-emerald"
						/>
						<p class="text-xs text-text-muted">Triggers automatically when Available RAM falls below this limit.</p>
					</div>
					
					<div class="flex flex-wrap gap-4 mt-4 md:mt-0">
						<Button variant={autoPurgeEnabled ? "outline" : "default"} onclick={onToggleAutoPurge}>
							{autoPurgeEnabled ? "Disable Auto-Purge" : "Enable Auto-Purge"}
						</Button>
						<Button variant="glow" onclick={purgeMemory} disabled={isPurging}>
							{isPurging ? "Purging..." : "1-Click Clean Now"}
						</Button>
					</div>
				</div>
			</Card>

			<!-- Core & OS Tweaker -->
			<Card variant="default" class="p-6 space-y-4 mt-6 border border-accent-cyan/20">
				<div class="flex justify-between items-center">
					<h2 class="text-lg font-semibold text-text-primary">Core & OS Tweaker</h2>
					<Badge variant="outline" class="border-accent-cyan text-accent-cyan bg-accent-cyan/10">
						MODULE 3
					</Badge>
				</div>
				<Separator />
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="space-y-3">
						<div>
							<h3 class="text-sm font-medium text-text-primary">Ultimate Performance</h3>
							<p class="text-xs text-text-muted mt-1">Injects and activates the hidden Windows Ultimate Performance power scheme to prevent aggressive downclocking.</p>
						</div>
						<Button variant="outline" class="w-full" onclick={applyUltimatePower} disabled={isTweakingPower}>
							{isTweakingPower ? "Applying..." : "Activate Ultimate Power Plan"}
						</Button>
					</div>
					
					<div class="space-y-3">
						<div>
							<h3 class="text-sm font-medium text-text-primary">Disable Core Parking</h3>
							<p class="text-xs text-text-muted mt-1">Forces all CPU cores to remain active during operation by overriding powercfg parking indexes.</p>
						</div>
						<Button variant="outline" class="w-full" onclick={disableCoreParking} disabled={isTweakingCore}>
							{isTweakingCore ? "Applying..." : "Disable CPU Core Parking"}
						</Button>
					</div>
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
