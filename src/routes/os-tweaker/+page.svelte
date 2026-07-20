<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { dialog } from '$lib/dialog.svelte';
	import { locale } from '$lib/locale.svelte';

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
</div>
