<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';

	let isTweakingPower = $state(false);
	let isTweakingCore = $state(false);
	let hagsEnabled = $state(false);
	let isTweakingHags = $state(false);

	onMount(() => {
		invoke('fetch_hags_status').then((res) => {
			hagsEnabled = res as boolean;
		}).catch(console.error);
	});

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

	async function toggleHags() {
		if (isTweakingHags) return;
		isTweakingHags = true;
		const nextState = !hagsEnabled;
		try {
			const res = await invoke('apply_hags_setting', { enabled: nextState });
			hagsEnabled = nextState;
			alert(res + "\n\nA system restart is required for changes to take effect.");
		} catch (e) {
			console.error(e);
			alert("Failed to toggle HAGS.\nError: " + e);
		} finally {
			isTweakingHags = false;
		}
	}
</script>

<svelte:head>
	<title>OS Tweaker - XMost Optimizer</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
	<header class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-text-primary">OS Tweaker</h1>
			<p class="text-text-secondary text-sm">Advanced CPU & GPU tuning</p>
		</div>
	</header>

	<!-- Core & OS Tweaker -->
	<Card variant="default" class="p-6 space-y-4 border border-accent-cyan/20">
		<div class="flex justify-between items-center">
			<h2 class="text-lg font-semibold text-text-primary">Core & OS Tweaker</h2>
			<Badge variant="outline" class="border-accent-cyan text-accent-cyan bg-accent-cyan/10">
				CPU
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

	<!-- GPU Bridge -->
	<Card variant="default" class="p-6 space-y-4 border border-accent-emerald/20">
		<div class="flex justify-between items-center">
			<h2 class="text-lg font-semibold text-text-primary">GPU Bridge</h2>
			<Badge variant="outline" class="border-accent-emerald text-accent-emerald bg-accent-emerald/10">
				GPU
			</Badge>
		</div>
		<Separator />
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
			<div class="space-y-3">
				<div>
					<h3 class="text-sm font-medium text-text-primary">Hardware-Accelerated GPU Scheduling (HAGS)</h3>
					<p class="text-xs text-text-muted mt-1">Reduces latency and improves performance by allowing the graphics card to manage its own memory.</p>
				</div>
			</div>
			
			<div class="flex flex-col space-y-3 md:items-end">
				<div class="flex items-center gap-4">
					<span class="text-sm font-mono {hagsEnabled ? 'text-accent-emerald' : 'text-text-muted'}">
						{hagsEnabled ? 'ENABLED' : 'DISABLED'}
					</span>
					<Button variant={hagsEnabled ? "outline" : "default"} onclick={toggleHags} disabled={isTweakingHags}>
						{isTweakingHags ? "Applying..." : hagsEnabled ? "Disable HAGS" : "Enable HAGS"}
					</Button>
				</div>
				<span class="text-[10px] text-orange-400 uppercase tracking-wider font-semibold">⚠ Reboot Required</span>
			</div>
		</div>
	</Card>
</div>
