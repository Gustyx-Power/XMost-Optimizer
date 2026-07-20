<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';

	let autoPurgeEnabled = $state(false);
	let purgeThresholdMb = $state(1024);
	let isPurging = $state(false);

	onMount(() => {
		invoke('get_auto_purge_state').then((res) => {
			const [enabled, threshold] = res as [boolean, number];
			autoPurgeEnabled = enabled;
			purgeThresholdMb = threshold;
		}).catch(console.error);
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
</script>

<svelte:head>
	<title>Memory Orchestrator - XMost Optimizer</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
	<header class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-text-primary">Memory Orchestrator</h1>
			<p class="text-text-secondary text-sm">Force-clear the Windows standby list</p>
		</div>
	</header>

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
</div>
