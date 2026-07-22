<script lang="ts">
	import { locale } from '$lib/locale.svelte';
	import { Card } from '$lib/components/ui/card';
	import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
	import { onMount } from 'svelte';

	let autostartEnabled = $state(false);

	onMount(async () => {
		try {
			autostartEnabled = await isEnabled();
		} catch (e) {
			console.error("Failed to check autostart status", e);
		}
	});

	async function toggleAutostart() {
		try {
			if (autostartEnabled) {
				await disable();
				autostartEnabled = false;
			} else {
				await enable();
				autostartEnabled = true;
			}
		} catch (e) {
			console.error("Failed to toggle autostart", e);
		}
	}
</script>

<div class="max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
	<div class="flex flex-col gap-1.5">
		<h1 class="text-3xl font-bold tracking-tight text-text-primary">
			{locale.t('settings.title')}
		</h1>
		<p class="text-sm text-text-secondary font-medium">
			{locale.t('settings.subtitle')}
		</p>
	</div>

	<!-- Language Selection Card -->
	<Card variant="interactive" class="p-6 bg-bg-card rounded-[24px] shadow-sm flex flex-col gap-4">
		<div class="flex items-start justify-between">
			<div class="flex flex-col gap-1 w-[calc(100%-36px)]">
				<h3 class="text-base font-bold text-text-primary">
					{locale.t('settings.language.title')}
				</h3>
				<p class="text-xs text-text-secondary leading-relaxed">
					{locale.t('settings.language.description')}
				</p>
			</div>
			<div class="p-2 rounded-2xl bg-accent-cyan/10 text-accent-cyan shrink-0">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="m5 8 6 6" />
					<path d="m4 14 6-6 2-3" />
					<path d="M2 5h12" />
					<path d="M7 2h1" />
					<path d="m22 22-5-10-5 10" />
					<path d="M14 18h6" />
				</svg>
			</div>
		</div>

		<div class="flex flex-col sm:flex-row gap-3 mt-2">
			<button
				onclick={() => locale.setLanguage('en')}
				class="flex-1 py-3 px-4 rounded-[16px] border text-xs font-semibold tracking-wide uppercase transition-all duration-200 cursor-pointer text-center {locale.current === 'en' ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan shadow-sm' : 'border-white/5 text-text-secondary hover:bg-white/5 hover:text-text-primary'}"
			>
				English (US)
			</button>
			<button
				onclick={() => locale.setLanguage('id')}
				class="flex-1 py-3 px-4 rounded-[16px] border text-xs font-semibold tracking-wide uppercase transition-all duration-200 cursor-pointer text-center {locale.current === 'id' ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan shadow-sm' : 'border-white/5 text-text-secondary hover:bg-white/5 hover:text-text-primary'}"
			>
				Bahasa Indonesia
			</button>
		</div>
	</Card>

	<!-- Theme Selection Card -->
	<Card variant="interactive" class="p-6 bg-bg-card rounded-[24px] shadow-sm flex flex-col gap-4">
		<div class="flex items-start justify-between">
			<div class="flex flex-col gap-1 w-[calc(100%-36px)]">
				<h3 class="text-base font-bold text-text-primary">
					{locale.t('settings.theme.title')}
				</h3>
				<p class="text-xs text-text-secondary leading-relaxed">
					{locale.t('settings.theme.description')}
				</p>
			</div>
			<div class="p-2 rounded-2xl bg-accent-amber/10 text-accent-amber shrink-0">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<circle cx="12" cy="12" r="4"/>
					<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
				</svg>
			</div>
		</div>

		<p class="text-xs text-text-muted italic leading-relaxed">
			Tip: Use the theme switch toggle button in the bottom-left navigation rail to swap between Light and Dark mode instantly.
		</p>
	</Card>

	<!-- Startup Selection Card -->
	<Card variant="interactive" class="p-6 bg-bg-card rounded-[24px] shadow-sm flex flex-col gap-4">
		<div class="flex items-start justify-between">
			<div class="flex flex-col gap-1 w-[calc(100%-36px)]">
				<h3 class="text-base font-bold text-text-primary">
					{locale.t('settings.startup.title')}
				</h3>
				<p class="text-xs text-text-secondary leading-relaxed">
					{locale.t('settings.startup.description')}
				</p>
			</div>
			<div class="p-2 rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
					<line x1="12" y1="2" x2="12" y2="12" />
				</svg>
			</div>
		</div>

		<div class="flex items-center justify-between mt-2 p-3 bg-white/5 rounded-[16px]">
			<span class="text-xs font-medium text-text-primary">
				{autostartEnabled ? locale.t('common.enabled') : locale.t('common.disabled')}
			</span>
			<button
				onclick={toggleAutostart}
				class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none {autostartEnabled ? 'bg-emerald-500' : 'bg-white/10'}"
			>
				<span
					class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {autostartEnabled ? 'translate-x-6' : 'translate-x-1'}"
				></span>
			</button>
		</div>
	</Card>

	<!-- About Application Card -->
	<Card variant="interactive" class="p-6 bg-bg-card rounded-[24px] shadow-sm flex flex-col gap-3">
		<div class="flex items-center gap-4">
			<div class="w-12 h-12 rounded-2xl bg-accent-cyan/10 text-accent-cyan flex flex-col items-center justify-center font-sans font-black shadow-sm shrink-0">
				<span class="text-[14px] leading-none font-bold">XM</span>
				<span class="text-[8px] leading-none tracking-widest text-accent-amber mt-0.5 font-bold">OPT</span>
			</div>
			<div class="flex flex-col">
				<h3 class="text-base font-bold text-text-primary">
					{locale.t('settings.about.title')}
				</h3>
				<span class="text-[10px] font-mono text-text-muted">{locale.t('settings.about.build')}</span>
			</div>
		</div>
		<p class="text-xs text-text-secondary leading-relaxed mt-2">
			{locale.t('settings.about.description')}
		</p>
		<hr class="border-white/5 my-2" />
		<div class="flex justify-between items-center text-xs font-mono">
			<span class="text-text-muted">{locale.t('settings.about.version')}</span>
			<span class="text-accent-cyan font-bold">v1.0.0</span>
		</div>
	</Card>
</div>
