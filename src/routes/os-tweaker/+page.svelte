<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { listen } from '@tauri-apps/api/event';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { dialog } from '$lib/dialog.svelte';
	import { locale } from '$lib/locale.svelte';
	import { fade, fly } from 'svelte/transition';

	let isTweakingPower = $state(false);
	let isTweakingCore = $state(false);
	let hagsEnabled = $state(false);
	let isTweakingHags = $state(false);
	let autoCleanTemp = $state(false);
	let isCleaningTemp = $state(false);
	let tempProgress = $state(0);
	let tempCurrentFile = $state('');

	type TempInfo = {
		files: number;
		dirs: number;
		size_bytes: number;
	};
	let tempInfo = $state<TempInfo | null>(null);

	async function fetchTempInfo() {
		try {
			tempInfo = (await invoke('get_temp_info')) as TempInfo;
		} catch (e) {
			console.error(e);
		}
	}

	onMount(() => {
		invoke('fetch_hags_status').then((res) => {
			hagsEnabled = res as boolean;
		}).catch(console.error);

		if (typeof window !== 'undefined') {
			autoCleanTemp = localStorage.getItem('auto_clean_temp') === 'true';
		}
		
		fetchTempInfo();
	});

	function toggleAutoCleanTemp() {
		autoCleanTemp = !autoCleanTemp;
		if (typeof window !== 'undefined') {
			localStorage.setItem('auto_clean_temp', autoCleanTemp.toString());
		}
	}

	async function clearTempNow() {
		if (isCleaningTemp) return;
		isCleaningTemp = true;
		tempProgress = 0;
		tempCurrentFile = 'Initializing...';
		
		const unlisten = await listen('temp-clean-progress', (event) => {
			const payload = event.payload as { percentage: number, current_file: string };
			tempProgress = payload.percentage;
			tempCurrentFile = payload.current_file;
		});

		try {
			await invoke('clear_temp_folder');
			await fetchTempInfo();
		} catch (e) {
			console.error(e);
			dialog.show(locale.t('common.error'), "Failed to clear Temp folder.\nError: " + e, "error");
		} finally {
			unlisten();
			// Keep 100% for half a second before closing
			setTimeout(() => {
				isCleaningTemp = false;
			}, 500);
		}
	}

	async function applyUltimatePower() {
		if (isTweakingPower) return;
		isTweakingPower = true;
		try {
			const res = await invoke('apply_ultimate_power_plan');
			dialog.show(locale.t('tweaker.power.status_title'), res as string, "success");
		} catch (e) {
			console.error(e);
			dialog.show(locale.t('common.error'), "Failed to apply power plan.\nError: " + e, "error");
		} finally {
			isTweakingPower = false;
		}
	}

	async function disableCoreParking() {
		if (isTweakingCore) return;
		isTweakingCore = true;
		try {
			const res = await invoke('apply_core_parking_disable');
			dialog.show(locale.t('tweaker.parking.status_title'), res as string, "success");
		} catch (e) {
			console.error(e);
			dialog.show(locale.t('common.error'), "Failed to disable core parking.\nError: " + e, "error");
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
			dialog.show(locale.t('tweaker.reboot_warning'), res + "\n\nA system restart is required for changes to take effect.", "warning");
		} catch (e) {
			console.error(e);
			dialog.show(locale.t('common.error'), "Failed to toggle HAGS.\nError: " + e, "error");
		} finally {
			isTweakingHags = false;
		}
	}
</script>

<svelte:head>
	<title>{locale.t('nav.tweaker')} - XMost Optimizer</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-6">
	<header class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-text-primary">{locale.t('nav.tweaker')}</h1>
			<p class="text-text-secondary text-sm">{locale.t('tweaker.subtitle')}</p>
		</div>
	</header>

	<!-- Core & OS Tweaker -->
	<Card variant="default" class="p-6 space-y-4 border border-accent-cyan/20">
		<div class="flex justify-between items-center">
			<h2 class="text-lg font-semibold text-text-primary">{locale.t('tweaker.core_header')}</h2>
			<Badge variant="outline" class="border-accent-cyan text-accent-cyan bg-accent-cyan/10">
				CPU
			</Badge>
		</div>
		<Separator />
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div class="space-y-3">
				<div>
					<h3 class="text-sm font-medium text-text-primary">{locale.t('tweaker.power.title')}</h3>
					<p class="text-xs text-text-muted mt-1">{locale.t('tweaker.power.desc')}</p>
				</div>
				<Button variant="outline" class="w-full" onclick={applyUltimatePower} disabled={isTweakingPower}>
					{isTweakingPower ? locale.t('tweaker.power.applying') : locale.t('tweaker.power.btn')}
				</Button>
			</div>
			
			<div class="space-y-3">
				<div>
					<h3 class="text-sm font-medium text-text-primary">{locale.t('tweaker.parking.title')}</h3>
					<p class="text-xs text-text-muted mt-1">{locale.t('tweaker.parking.desc')}</p>
				</div>
				<Button variant="outline" class="w-full" onclick={disableCoreParking} disabled={isTweakingCore}>
					{isTweakingCore ? locale.t('tweaker.parking.applying') : locale.t('tweaker.parking.btn')}
				</Button>
			</div>
		</div>
	</Card>

	<!-- GPU Bridge -->
	<Card variant="default" class="p-6 space-y-4 border border-accent-emerald/20">
		<div class="flex justify-between items-center">
			<h2 class="text-lg font-semibold text-text-primary">{locale.t('tweaker.gpu_header')}</h2>
			<Badge variant="outline" class="border-accent-emerald text-accent-emerald bg-accent-emerald/10">
				GPU
			</Badge>
		</div>
		<Separator />
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
			<div class="space-y-3">
				<div>
					<h3 class="text-sm font-medium text-text-primary">{locale.t('tweaker.hags.title')}</h3>
					<p class="text-xs text-text-muted mt-1">{locale.t('tweaker.hags.desc')}</p>
				</div>
			</div>
			
			<div class="flex flex-col space-y-3 md:items-end">
				<div class="flex items-center gap-4">
					<span class="text-sm font-mono {hagsEnabled ? 'text-accent-emerald' : 'text-text-muted'}">
						{hagsEnabled ? locale.t('common.enabled').toUpperCase() : locale.t('common.disabled').toUpperCase()}
					</span>
					<Button variant={hagsEnabled ? "outline" : "default"} onclick={toggleHags} disabled={isTweakingHags}>
						{isTweakingHags ? locale.t('tweaker.power.applying') : hagsEnabled ? locale.t('tweaker.hags.btn_disable') : locale.t('tweaker.hags.btn_enable')}
					</Button>
				</div>
				<span class="text-[10px] text-orange-400 uppercase tracking-wider font-semibold">{locale.t('tweaker.reboot_warning')}</span>
			</div>
		</div>
	</Card>

	<!-- Temporary Files Manager -->
	<Card variant="default" class="p-6 space-y-4 border border-accent-amber/20">
		<div class="flex justify-between items-center">
			<h2 class="text-lg font-semibold text-text-primary">{locale.t('tweaker.temp.title')}</h2>
			<Badge variant="outline" class="border-accent-amber text-accent-amber bg-accent-amber/10">
				Storage
			</Badge>
		</div>
		<Separator />
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div class="space-y-3">
				<div>
					<h3 class="text-sm font-medium text-text-primary">{locale.t('tweaker.temp.auto_clean')}</h3>
					<p class="text-xs text-text-muted mt-1">{locale.t('tweaker.temp.desc')}</p>
				</div>
				<div class="flex items-center justify-between p-3 bg-white/5 rounded-[16px] border border-white/10">
					<span class="text-xs font-medium text-text-primary">
						{autoCleanTemp ? locale.t('common.enabled') : locale.t('common.disabled')}
					</span>
					<button
						onclick={toggleAutoCleanTemp}
						class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none {autoCleanTemp ? 'bg-accent-amber' : 'bg-white/10'}"
					>
						<span
							class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {autoCleanTemp ? 'translate-x-6' : 'translate-x-1'}"
						></span>
					</button>
				</div>
			</div>
			
			<div class="space-y-3">
				<div class="flex flex-col justify-end h-auto md:h-[42px]">
					{#if tempInfo}
						<span class="text-[10px] text-text-muted font-bold uppercase tracking-wider">CURRENTLY USING</span>
						<span class="text-sm font-semibold text-text-primary mt-0.5">
							{(tempInfo.size_bytes / 1024 / 1024).toFixed(1)} MB <span class="text-text-muted text-xs font-normal">({tempInfo.files} files, {tempInfo.dirs} dirs)</span>
						</span>
					{:else}
						<span class="text-[10px] text-text-muted font-bold uppercase tracking-wider">CALCULATING...</span>
					{/if}
				</div>
				<Button variant="outline" class="w-full" onclick={clearTempNow} disabled={isCleaningTemp}>
					{isCleaningTemp ? locale.t('tweaker.temp.applying') : locale.t('tweaker.temp.clean_now')}
				</Button>
			</div>
		</div>
	</Card>
</div>

<!-- Progress Modal overlay for Temp Clean -->
{#if isCleaningTemp}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" transition:fade={{ duration: 150 }}>
		<div class="w-full max-w-md" transition:fly={{ y: 15, duration: 250 }}>
			<Card class="w-full p-6 bg-bg-card rounded-[24px] shadow-lg border border-white/10 space-y-4">
				<div class="flex flex-col items-center justify-center space-y-4 text-center">
					<div class="w-12 h-12 rounded-full bg-accent-amber/10 text-accent-amber flex items-center justify-center shrink-0">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-pulse">
							<path d="M3 6h18" />
							<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
						</svg>
					</div>
					<div>
						<h3 class="text-lg font-bold text-text-primary">Cleaning Temporary Files...</h3>
						<p class="text-[10px] font-mono text-text-muted mt-1 truncate max-w-[280px]" title={tempCurrentFile}>{tempCurrentFile}</p>
					</div>
					<div class="w-full space-y-2 mt-4">
						<div class="flex justify-between text-xs font-mono">
							<span class="text-text-muted">Progress</span>
							<span class="text-accent-amber font-bold">{tempProgress}%</span>
						</div>
						<div class="w-full h-1.5 rounded-full bg-bg-primary overflow-hidden">
							<div class="h-full bg-accent-amber transition-all duration-300 ease-out" style="width: {tempProgress}%"></div>
						</div>
					</div>
				</div>
			</Card>
		</div>
	</div>
{/if}
