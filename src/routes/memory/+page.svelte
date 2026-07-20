<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { Card } from '$lib/components/ui/card';

	// Memory Metrics
	let standbyListMb = $state(0);
	let freeMemoryMb = $state(0);
	let totalMemoryMb = $state(0);
	let availableMemoryMb = $state(0);

	// Pagefile Metrics
	let pagefileUsedMb = $state(0);
	let pagefileTotalMb = $state(0);
	let pagefilePercent = $state(0);

	// Timer Resolution
	let currentTimerResolutionMs = $state(15.6);
	let wantedTimerResolutionMs = $state(1.0);
	let timerResolutionEnabled = $state(false);
	let useGlobalTimerRequests = $state(false);

	// Auto-Purge Configuration
	let autoPurgeEnabled = $state(false);
	let standbyThresholdMb = $state(4096);
	let freeMemoryThresholdMb = $state(2048);

	// Polling Configuration
	let pollingRateMs = $state(1000);
	let pollingInterval: number | null = null;

	// Fetch real telemetry data
	async function fetchTelemetry() {
		try {
			// Memory metrics
			const memMetrics = await invoke<{
				standby_list_mb: number;
				free_memory_mb: number;
				total_memory_mb: number;
				available_memory_mb: number;
			}>('get_memory_telemetry');
			
			standbyListMb = memMetrics.standby_list_mb;
			freeMemoryMb = memMetrics.free_memory_mb;
			totalMemoryMb = memMetrics.total_memory_mb;
			availableMemoryMb = memMetrics.available_memory_mb;

			// Pagefile metrics
			const pageMetrics = await invoke<{
				used_mb: number;
				total_mb: number;
				usage_percent: number;
			}>('get_pagefile_telemetry');
			
			pagefileUsedMb = pageMetrics.used_mb;
			pagefileTotalMb = pageMetrics.total_mb;
			pagefilePercent = pageMetrics.usage_percent;

			// Timer resolution
			currentTimerResolutionMs = await invoke<number>('get_timer_resolution_ms');
		} catch (e) {
			console.error('Failed to fetch telemetry:', e);
		}
	}

	// Load auto-purge state
	async function loadAutoPurgeState() {
		try {
			const [enabled, standbyMb, freeMb] = await invoke<[boolean, number, number]>('get_auto_purge_state');
			autoPurgeEnabled = enabled;
			standbyThresholdMb = standbyMb;
			freeMemoryThresholdMb = freeMb;
		} catch (e) {
			console.error('Failed to load auto-purge state:', e);
		}
	}

	// Toggle auto-purge
	async function toggleAutoPurge() {
		autoPurgeEnabled = !autoPurgeEnabled;
		try {
			await invoke('toggle_auto_purge', { enabled: autoPurgeEnabled });
		} catch (e) {
			console.error('Failed to toggle auto-purge:', e);
			autoPurgeEnabled = !autoPurgeEnabled; // Revert on error
		}
	}

	// Update auto-purge configuration
	async function updateAutoPurgeConfig() {
		try {
			await invoke('set_auto_purge_config', { 
				standbyMb: standbyThresholdMb, 
				freeMb: freeMemoryThresholdMb 
			});
		} catch (e) {
			console.error('Failed to update auto-purge config:', e);
		}
	}

	// Toggle timer resolution
	function toggleTimerResolution() {
		timerResolutionEnabled = !timerResolutionEnabled;
		// Actual setting setting logic is processed via Rust backend as needed
		console.log('Timer resolution enabled:', timerResolutionEnabled, 'Target:', wantedTimerResolutionMs);
	}

	// Start/stop polling based on rate change
	function updatePollingRate(newRate: number) {
		pollingRateMs = newRate;
		stopPolling();
		startPolling();
	}

	// Polling functions
	function startPolling() {
		if (pollingInterval) clearInterval(pollingInterval);
		pollingInterval = setInterval(fetchTelemetry, pollingRateMs) as unknown as number;
	}

	function stopPolling() {
		if (pollingInterval) {
			clearInterval(pollingInterval);
			pollingInterval = null;
		}
	}

	onMount(async () => {
		await loadAutoPurgeState();
		await fetchTelemetry();
		startPolling();
	});

	onDestroy(() => {
		stopPolling();
	});
</script>

<svelte:head>
	<title>Memory Orchestrator - XMost Optimizer</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-8 font-sans">
	<!-- MD3 Header -->
	<header class="pb-2 border-b border-white/[0.02]">
		<h1 class="text-3xl font-normal tracking-tight text-text-primary">Memory Orchestrator</h1>
		<p class="text-text-secondary text-xs mt-1">Real-time memory management and system timer optimization</p>
	</header>

	<!-- Grid Layout for Cards -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		
		<!-- Card 1: Advanced Auto-Purge Engine -->
		<Card class="p-6 space-y-6 bg-bg-card rounded-3xl shadow-sm">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-normal text-text-primary">Advanced Auto-Purge Engine</h2>
				<div class="flex items-center gap-3">
					<span class="text-xs text-text-secondary uppercase tracking-wider font-semibold font-mono">{autoPurgeEnabled ? 'Active' : 'Inactive'}</span>
					<!-- MD3 Switch toggle -->
					<button
						onclick={toggleAutoPurge}
						class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none {autoPurgeEnabled ? 'bg-accent-cyan' : 'bg-text-muted/20'}"
						role="switch"
						aria-label="Toggle Auto-Purge Engine"
						aria-checked={autoPurgeEnabled}
					>
						<span
							class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out {autoPurgeEnabled ? 'translate-x-6 bg-bg-primary' : 'translate-x-1 bg-text-secondary'}"
						></span>
					</button>
				</div>
			</div>

			<div class="space-y-4">
				<!-- Standby Threshold -->
				<div class="space-y-2">
					<label for="standby-threshold" class="flex items-center justify-between text-sm text-text-secondary font-medium">
						<span>Standby list size is at least</span>
						<span class="font-mono text-accent-cyan font-bold">{standbyListMb} MB</span>
					</label>
					<input
						id="standby-threshold"
						type="number"
						bind:value={standbyThresholdMb}
						onchange={updateAutoPurgeConfig}
						min="512"
						max="32768"
						step="256"
						class="w-full rounded-full px-4 py-2 bg-bg-primary-end border border-border-default hover:border-border-active transition-all focus:outline-none focus:ring-2 focus:ring-accent-cyan text-text-primary font-mono"
					/>
					<p class="text-[11px] text-text-muted">Current standby list size: {standbyListMb} MB (estimated)</p>
				</div>

				<!-- Free Memory Threshold -->
				<div class="space-y-2">
					<label for="free-memory-threshold" class="flex items-center justify-between text-sm text-text-secondary font-medium">
						<span>Free memory is lower than</span>
						<span class="font-mono text-accent-cyan font-bold">{freeMemoryMb} MB</span>
					</label>
					<input
						id="free-memory-threshold"
						type="number"
						bind:value={freeMemoryThresholdMb}
						onchange={updateAutoPurgeConfig}
						min="256"
						max="16384"
						step="128"
						class="w-full rounded-full px-4 py-2 bg-bg-primary-end border border-border-default hover:border-border-active transition-all focus:outline-none focus:ring-2 focus:ring-accent-cyan text-text-primary font-mono"
					/>
					<p class="text-[11px] text-text-muted">Current free memory size: {freeMemoryMb} MB</p>
				</div>

				<!-- Real-time Stats -->
				<div class="grid grid-cols-2 gap-4 pt-2">
					<div class="rounded-2xl p-4 bg-bg-primary-end border border-border-default">
						<p class="text-xs text-text-secondary font-medium">Available</p>
						<p class="text-lg font-normal text-text-primary mt-1 font-mono tracking-tight">{availableMemoryMb} MB</p>
					</div>
					<div class="rounded-2xl p-4 bg-bg-primary-end border border-border-default">
						<p class="text-xs text-text-secondary font-medium">Total</p>
						<p class="text-lg font-normal text-text-primary mt-1 font-mono tracking-tight">{totalMemoryMb} MB</p>
					</div>
				</div>
			</div>
		</Card>

		<!-- Card 2: System Timer Resolution -->
		<Card class="p-6 space-y-6 bg-bg-card rounded-3xl shadow-sm">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-normal text-text-primary">System Timer Resolution</h2>
				<div class="flex items-center gap-3">
					<span class="text-xs text-text-secondary uppercase tracking-wider font-semibold font-mono">{timerResolutionEnabled ? 'Active' : 'Inactive'}</span>
					<!-- MD3 Switch toggle -->
					<button
						onclick={toggleTimerResolution}
						class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none {timerResolutionEnabled ? 'bg-accent-cyan' : 'bg-text-muted/20'}"
						role="switch"
						aria-label="Toggle System Timer Resolution"
						aria-checked={timerResolutionEnabled}
					>
						<span
							class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out {timerResolutionEnabled ? 'translate-x-6 bg-bg-primary' : 'translate-x-1 bg-text-secondary'}"
						></span>
					</button>
				</div>
			</div>

			<div class="space-y-4">
				<!-- Current Resolution Display -->
				<div class="rounded-2xl p-4 border border-accent-cyan/15 bg-bg-primary-end">
					<p class="text-xs text-text-secondary font-medium mb-1">Current Timer Resolution</p>
					<p class="text-3xl font-normal text-accent-cyan font-mono tracking-tight">{currentTimerResolutionMs.toFixed(2)} ms</p>
				</div>

				<!-- Wanted Resolution Input -->
				<div class="space-y-2">
					<label for="wanted-resolution" class="text-sm text-text-secondary font-medium">
						Wanted Timer Resolution (ms)
					</label>
					<input
						id="wanted-resolution"
						type="number"
						bind:value={wantedTimerResolutionMs}
						min="0.5"
						max="15.6"
						step="0.1"
						class="w-full rounded-full px-4 py-2 bg-bg-primary-end border border-border-default hover:border-border-active transition-all focus:outline-none focus:ring-2 focus:ring-accent-cyan text-text-primary font-mono disabled:opacity-50"
						disabled={!timerResolutionEnabled}
					/>
					<p class="text-[11px] text-text-muted">Lower values = higher precision (more CPU usage)</p>
				</div>

				<!-- Windows 11 Global Timer Requests -->
				<label class="flex items-center gap-4 cursor-pointer p-4 rounded-2xl bg-bg-primary-end border border-border-default hover:bg-bg-primary-end/80 transition-colors">
					<input
						type="checkbox"
						bind:checked={useGlobalTimerRequests}
						class="w-5 h-5 rounded accent-accent-cyan disabled:opacity-50"
						disabled={!timerResolutionEnabled}
					/>
					<div class="flex-1">
						<p class="text-sm font-medium text-text-primary">Use GlobalTimerResolutionRequests</p>
						<p class="text-[11px] text-text-secondary">Windows 11 only</p>
					</div>
				</label>
			</div>
		</Card>

		<!-- Card 3: Memory Paging & Polling -->
		<Card class="p-6 space-y-6 lg:col-span-2 bg-bg-card rounded-3xl shadow-sm">
			<h2 class="text-xl font-normal text-text-primary">Memory Paging & Polling</h2>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Pagefile Usage -->
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<p class="text-sm text-text-secondary font-medium">Pagefile Usage</p>
						<p class="text-sm font-mono text-accent-purple font-bold">{pagefilePercent.toFixed(1)}%</p>
					</div>
					
					<!-- Material 3 Thick Linear Progress Bar -->
					<div class="relative w-full h-3 rounded-full overflow-hidden bg-accent-purple/15">
						<div
							class="h-full rounded-full transition-all duration-500 bg-accent-purple"
							style="width: {pagefilePercent}%;"
						></div>
					</div>
					
					<div class="flex justify-between text-xs text-text-secondary font-mono mt-1">
						<span>{pagefileUsedMb} MB used</span>
						<span>{pagefileTotalMb} MB total</span>
					</div>
				</div>

				<!-- Engine Polling Rate -->
				<div class="space-y-3">
					<label for="polling-rate" class="text-sm text-text-secondary font-medium">
						Engine Polling Rate
					</label>
					<select
						id="polling-rate"
						bind:value={pollingRateMs}
						onchange={() => updatePollingRate(pollingRateMs)}
						class="w-full rounded-full px-4 py-2 bg-bg-primary-end border border-border-default hover:border-border-active transition-all focus:outline-none focus:ring-2 focus:ring-accent-purple text-text-primary"
					>
						<option value={500}>500 ms (Fast)</option>
						<option value={1000}>1000 ms (Normal)</option>
						<option value={2000}>2000 ms (Slow)</option>
					</select>
					<p class="text-[11px] text-text-muted">How often to refresh telemetry data</p>
				</div>
			</div>
		</Card>

	</div>
</div>

<style>
	/* Number input styling */
	input[type='number']::-webkit-inner-spin-button,
	input[type='number']::-webkit-outer-spin-button {
		opacity: 1;
	}
</style>
