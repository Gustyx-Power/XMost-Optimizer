<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { dialog } from '$lib/dialog.svelte';
	import { locale } from '$lib/locale.svelte';
	import { fade, fly } from 'svelte/transition';
	import logo from '$lib/xmost-logo.png';

	let { children } = $props();
	let isDark = $state(true); // Default to dark theme

	// Splash screen & onboarding state machine
	let flowState = $state<'splash' | 'onboarding' | 'main'>('splash');
	let currentStep = $state(0); // Onboarding slide index (0 to 3)

	onMount(() => {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme) {
			isDark = savedTheme === 'dark';
		} else {
			isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}
		applyTheme();

		// Auto clean temp folder on startup if enabled
		if (localStorage.getItem('auto_clean_temp') === 'true') {
			invoke('clear_temp_folder').then((res) => {
				console.log("Auto-cleaned Temp on startup:", res);
			}).catch((err) => {
				console.error("Auto-clean Temp failed:", err);
			});
		}

		// Flow transitions: Splash (2s) -> Onboarding (if not completed) -> Main App
		setTimeout(() => {
			const completed = localStorage.getItem('xmost_onboarding_completed') === 'true';
			if (completed) {
				flowState = 'main';
			} else {
				flowState = 'onboarding';
			}
		}, 2000);
	});

	function completeOnboarding() {
		localStorage.setItem('xmost_onboarding_completed', 'true');
		flowState = 'main';
	}

	function toggleTheme() {
		isDark = !isDark;
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
		applyTheme();
	}

	function applyTheme() {
		if (isDark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}
</script>

{#if flowState === 'splash'}
	<div 
		class="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#141218] text-[#E3E2E6] font-sans"
		transition:fade={{ duration: 400 }}
	>
		<!-- Large glowing logo monogram -->
		<div class="flex flex-col items-center mb-6 relative">
			<!-- Outer Glow Circle -->
			<div class="absolute inset-0 rounded-2xl bg-accent-cyan/10 blur-xl scale-150 animate-pulse"></div>
			
			<img src={logo} alt="XMost Logo" class="w-20 h-20 rounded-[22px] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform scale-110 object-contain relative z-10" />
		</div>

		<!-- App Title -->
		<h1 class="text-3xl font-extrabold tracking-widest mb-1.5 font-sans bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-amber uppercase">
			XMost Optimizer
		</h1>
		<p class="text-[10px] text-text-muted mb-10 tracking-[0.25em] font-mono font-bold uppercase">
			High-Performance Kernel Utility
		</p>

		<!-- Subtle Indeterminate Loading Bar -->
		<div class="w-56 h-1 bg-[#212836] rounded-full overflow-hidden relative">
			<div class="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-amber rounded-full animate-loading-bar" style="width: 50%;"></div>
		</div>
	</div>
{:else if flowState === 'onboarding'}
	<div 
		class="fixed inset-0 z-[200] flex items-center justify-center bg-[#141218] p-4 font-sans select-none"
		transition:fade={{ duration: 300 }}
	>
		<!-- Decorative Background Glows -->
		<div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-cyan/5 blur-[120px] pointer-events-none"></div>
		<div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-amber/5 blur-[120px] pointer-events-none"></div>

		<!-- Card Container -->
		<div class="w-full max-w-lg bg-[#1C202B] rounded-[28px] border border-white/[0.04] p-8 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
			
			<!-- Header -->
			<div class="flex flex-col items-center text-center gap-1.5">
				<img src={logo} alt="XMost" class="w-12 h-12 rounded-[14px] shadow-md mb-2 object-contain" />
				<h2 class="text-2xl font-semibold text-text-primary tracking-tight">
					{locale.t('onboarding.welcome')}
				</h2>
				<p class="text-xs text-text-muted font-medium">
					{locale.t('onboarding.subtitle')}
				</p>
			</div>

			<!-- Slide Content with Svelte transition -->
			<div class="flex-1 min-h-[260px] flex flex-col items-center justify-center py-4">
				{#key currentStep}
					<div 
						in:fly={{ y: 15, duration: 400, delay: 100 }} 
						out:fade={{ duration: 150 }}
						class="flex flex-col items-center gap-6 text-center w-full"
					>
						<!-- Slide Icon -->
						<div class="p-5 rounded-[24px] bg-[#212836] border border-white/[0.03] shadow-inner relative">
							{#if currentStep === 0}
								<!-- Language SVG -->
								<svg class="w-16 h-16 text-accent-cyan" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
									<circle cx="50" cy="50" r="42" stroke="currentColor" stroke-width="2" stroke-dasharray="6 4" class="opacity-25" />
									<path d="M50 20a30 30 0 1 0 0 60 30 30 0 0 0 0-60z" stroke="currentColor" stroke-width="3" />
									<path d="M20 50h60M50 20c-10 0-15 15-15 30s5 30 15 30 15-15 15-30-5-30-15-30z" stroke="currentColor" stroke-width="2" class="opacity-70" />
								</svg>
							{:else if currentStep === 1}
								<!-- System Monitor SVG -->
								<svg class="w-16 h-16 text-accent-cyan" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
									<circle cx="50" cy="50" r="42" stroke="currentColor" stroke-width="2" stroke-dasharray="6 4" class="opacity-25" />
									<circle cx="50" cy="50" r="32" stroke="currentColor" stroke-width="3" stroke-dasharray="140 180" stroke-linecap="round" class="opacity-70" />
									<rect x="42" y="42" width="16" height="16" rx="3.5" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.1" />
									<path d="M36 45h6M36 50h6M36 55h6M58 45h6M58 50h6M58 55h6M45 36v6M50 36v6M55 36v6M45 58v6M50 58v6M55 58v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
									<circle cx="50" cy="50" r="32" stroke="currentColor" stroke-width="3.5" stroke-dasharray="60 180" stroke-linecap="round" class="animate-pulse" />
								</svg>
							{:else if currentStep === 2}
								<!-- Memory Orchestrator SVG -->
								<svg class="w-16 h-16 text-accent-emerald" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
									<rect x="22" y="36" width="56" height="28" rx="4" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.1" />
									<rect x="30" y="42" width="8" height="10" rx="1" fill="currentColor" class="opacity-70" />
									<rect x="41" y="42" width="8" height="10" rx="1" fill="currentColor" class="opacity-70" />
									<rect x="52" y="42" width="8" height="10" rx="1" fill="currentColor" class="opacity-70" />
									<rect x="63" y="42" width="8" height="10" rx="1" fill="currentColor" class="opacity-70" />
									<path d="M22 64h56M25 64v3M30 64v3M35 64v3M40 64v3M45 64v3M50 64v3M55 64v3M60 64v3M65 64v3M70 64v3M75 64v3" stroke="currentColor" stroke-width="1.5" />
									<circle cx="68" cy="26" r="3.5" fill="currentColor" class="animate-ping" />
									<path d="M64 26h8M68 22v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
								</svg>
							{:else if currentStep === 3}
								<!-- OS Tweaker SVG -->
								<svg class="w-16 h-16 text-accent-amber" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M20 72A35 35 0 1 1 80 72" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3" class="opacity-30" />
									<path d="M20 72A35 35 0 0 1 74 36" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
									<path d="M53 18L35 52h14v28l18-32H53V18z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" class="drop-shadow-[0_0_8px_rgba(239,184,200,0.3)]" />
									<circle cx="26" cy="67" r="2.5" fill="currentColor" />
									<circle cx="74" cy="67" r="2.5" fill="currentColor" />
								</svg>
							{/if}
						</div>

						<!-- Slide Text Content -->
						<div class="flex flex-col gap-2 w-full">
							{#if currentStep === 0}
								<h3 class="text-lg font-medium text-text-primary">
									Choose Language / Pilih Bahasa
								</h3>
								<div class="flex flex-col gap-3 mt-2 w-full px-8">
									<button 
										onclick={() => { locale.setLanguage('en'); currentStep = 1; }}
										class="w-full py-2.5 rounded-xl border-2 transition-all duration-200 font-semibold cursor-pointer {locale.current === 'en' ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan' : 'border-white/[0.05] hover:border-white/[0.1] text-text-secondary hover:text-text-primary'}"
									>
										English
									</button>
									<button 
										onclick={() => { locale.setLanguage('id'); currentStep = 1; }}
										class="w-full py-2.5 rounded-xl border-2 transition-all duration-200 font-semibold cursor-pointer {locale.current === 'id' ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan' : 'border-white/[0.05] hover:border-white/[0.1] text-text-secondary hover:text-text-primary'}"
									>
										Bahasa Indonesia
									</button>
								</div>
							{:else}
								<h3 class="text-lg font-medium text-text-primary">
									{#if currentStep === 1}
										{locale.t('onboarding.steps.monitor.title')}
									{:else if currentStep === 2}
										{locale.t('onboarding.steps.memory.title')}
									{:else}
										{locale.t('onboarding.steps.tweaker.title')}
									{/if}
								</h3>
								
								<p class="text-xs text-text-secondary font-semibold font-mono tracking-wide uppercase px-6">
									{#if currentStep === 1}
										{locale.t('onboarding.steps.monitor.desc')}
									{:else if currentStep === 2}
										{locale.t('onboarding.steps.memory.desc')}
									{:else}
										{locale.t('onboarding.steps.tweaker.desc')}
									{/if}
								</p>

								<p class="text-xs text-text-muted leading-relaxed font-sans px-8 mt-1">
									{#if currentStep === 1}
										{locale.t('onboarding.steps.monitor.detail')}
									{:else if currentStep === 2}
										{locale.t('onboarding.steps.memory.detail')}
									{:else}
										{locale.t('onboarding.steps.tweaker.detail')}
									{/if}
								</p>
							{/if}
						</div>
					</div>
				{/key}
			</div>

			<!-- Footer Controls -->
			<div class="flex flex-col gap-6 mt-2">
				<!-- Step Indicators / Dots -->
				<div class="flex justify-center gap-2">
					{#each [0, 1, 2, 3] as i}
						<button 
							onclick={() => currentStep = i}
							class="h-2.5 rounded-full transition-all duration-300 cursor-pointer { currentStep === i ? 'w-6 bg-accent-cyan' : 'w-2.5 bg-border-active hover:bg-text-secondary' }"
							aria-label="Go to step {i + 1}"
						></button>
					{/each}
				</div>

				<!-- Navigation Buttons -->
				<div class="flex justify-between items-center h-12">
					<!-- Back Button -->
					{#if currentStep > 0}
						<button 
							onclick={() => currentStep -= 1}
							class="px-5 py-2.5 rounded-full text-xs font-semibold cursor-pointer border border-border-default text-text-secondary hover:text-text-primary hover:bg-white/[0.02] transition-all duration-200"
						>
							{locale.t('onboarding.back')}
						</button>
					{:else}
						<div class="w-1"></div>
					{/if}

					<!-- Next or Get Started Button -->
					{#if currentStep === 0}
						<!-- Empty in step 0, wait for them to click a language block -->
						<div class="w-1"></div>
					{:else if currentStep < 3}
						<button 
							onclick={() => currentStep += 1}
							class="px-6 py-2.5 rounded-full text-xs font-semibold cursor-pointer bg-accent-cyan text-bg-primary hover:opacity-90 transition-all duration-200 shadow-md shadow-accent-cyan/10"
						>
							{locale.t('onboarding.next')}
						</button>
					{:else}
						<button 
							onclick={completeOnboarding}
							class="px-8 py-3 rounded-full text-sm font-bold cursor-pointer bg-gradient-to-r from-accent-cyan to-accent-purple text-bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-accent-cyan/20 animate-pulse-glow"
						>
							{locale.t('onboarding.get_started')}
						</button>
					{/if}
				</div>
			</div>

		</div>
	</div>
{:else}
	<div class="flex h-screen bg-gradient-to-br from-bg-primary-start to-bg-primary-end text-text-primary overflow-hidden font-sans select-none transition-colors duration-300" transition:fade={{ duration: 250 }}>
		<!-- Material Design 3 Navigation Rail -->
		<aside class="w-20 flex-shrink-0 bg-bg-secondary flex flex-col items-center py-4 justify-between border-r border-white/[0.02] transition-colors duration-300">
			<!-- Top Branding: MD3 Monogram -->
			<div class="flex flex-col items-center mt-2">
				<img src={logo} alt="XMost" class="w-12 h-12 rounded-[14px] shadow-sm object-contain" title="XMost Optimizer" />
			</div>

			<!-- Rail Navigation Links -->
			<nav class="flex-1 w-full flex flex-col items-center justify-center gap-4 mt-6">
				<!-- Monitor (Dashboard) Link -->
				<a href="/" class="flex flex-col items-center group w-full py-1 text-center font-sans">
					<div class="h-8 w-14 rounded-full flex items-center justify-center transition-all duration-300 ease-[var(--ease-smooth)] { $page.url.pathname === '/' ? 'bg-accent-cyan text-bg-primary shadow-sm' : 'text-text-secondary group-hover:bg-text-secondary/10 group-hover:text-text-primary' }">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect width="20" height="14" x="2" y="3" rx="2"/>
							<line x1="8" x2="16" y1="21" y2="21"/>
							<line x1="12" x2="12" y1="17" y2="21"/>
						</svg>
					</div>
					<span class="text-[10px] font-sans font-medium tracking-wide mt-1.5 transition-colors duration-200 { $page.url.pathname === '/' ? 'text-accent-cyan font-bold' : 'text-text-secondary group-hover:text-text-primary' }">
						{locale.t('nav.monitor')}
					</span>
				</a>

				<!-- Memory Orchestrator Link -->
				<a href="/memory" class="flex flex-col items-center group w-full py-1 text-center font-sans">
					<div class="h-8 w-14 rounded-full flex items-center justify-center transition-all duration-300 ease-[var(--ease-smooth)] { $page.url.pathname.startsWith('/memory') ? 'bg-accent-cyan text-bg-primary shadow-sm' : 'text-text-secondary group-hover:bg-text-secondary/10 group-hover:text-text-primary' }">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M2 15h20"/>
							<path d="M2 9h20"/>
							<path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>
							<path d="M6 19v-4"/>
							<path d="M10 19v-4"/>
							<path d="M14 19v-4"/>
							<path d="M18 19v-4"/>
						</svg>
					</div>
					<span class="text-[10px] font-sans font-medium tracking-wide mt-1.5 transition-colors duration-200 { $page.url.pathname.startsWith('/memory') ? 'text-accent-cyan font-bold' : 'text-text-secondary group-hover:text-text-primary' }">
						{locale.t('nav.memory')}
					</span>
				</a>

				<!-- OS Tweaker Link -->
				<a href="/os-tweaker" class="flex flex-col items-center group w-full py-1 text-center font-sans">
					<div class="h-8 w-14 rounded-full flex items-center justify-center transition-all duration-300 ease-[var(--ease-smooth)] { $page.url.pathname.startsWith('/os-tweaker') ? 'bg-accent-cyan text-bg-primary shadow-sm' : 'text-text-secondary group-hover:bg-text-secondary/10 group-hover:text-text-primary' }">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<line x1="21" x2="14" y1="4" y2="4"/>
							<line x1="10" x2="3" y1="4" y2="4"/>
							<line x1="21" x2="12" y1="12" y2="12"/>
							<line x1="8" x2="3" y1="12" y2="12"/>
							<line x1="21" x2="16" y1="20" y2="20"/>
							<line x1="12" x2="3" y1="20" y2="20"/>
							<line x1="14" x2="14" y1="2" y2="6"/>
							<line x1="8" x2="8" y1="10" y2="14"/>
							<line x1="16" x2="16" y1="18" y2="22"/>
						</svg>
					</div>
					<span class="text-[10px] font-sans font-medium tracking-wide mt-1.5 transition-colors duration-200 { $page.url.pathname.startsWith('/os-tweaker') ? 'text-accent-cyan font-bold' : 'text-text-secondary group-hover:text-text-primary' }">
						{locale.t('nav.tweaker')}
					</span>
				</a>

				<!-- Settings Link -->
				<a href="/settings" class="flex flex-col items-center group w-full py-1 text-center font-sans">
					<div class="h-8 w-14 rounded-full flex items-center justify-center transition-all duration-300 ease-[var(--ease-smooth)] { $page.url.pathname.startsWith('/settings') ? 'bg-accent-cyan text-bg-primary shadow-sm' : 'text-text-secondary group-hover:bg-text-secondary/10 group-hover:text-text-primary' }">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="3"/>
							<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
						</svg>
					</div>
					<span class="text-[10px] font-sans font-medium tracking-wide mt-1.5 transition-colors duration-200 { $page.url.pathname.startsWith('/settings') ? 'text-accent-cyan font-bold' : 'text-text-secondary group-hover:text-text-primary' }">
						{locale.t('nav.settings')}
					</span>
				</a>
			</nav>

			<!-- Bottom Theme Toggle & Version -->
			<div class="mt-auto py-2 flex flex-col items-center gap-3">
				<!-- Theme Toggle Button -->
				<button 
					onclick={toggleTheme}
					class="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-text-secondary/10 transition-all duration-200 cursor-pointer shadow-sm"
					title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
				>
					{#if isDark}
						<!-- Moon Icon -->
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
						</svg>
					{:else}
						<!-- Sun Icon -->
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="4"/>
							<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
						</svg>
					{/if}
				</button>

				<span class="text-[9px] font-mono text-text-muted font-bold uppercase tracking-wider select-none">v1.0.0</span>
			</div>
		</aside>

		<!-- Main Content Area -->
		<main class="flex-1 relative overflow-auto p-6 md:p-8">
			{@render children()}
		</main>
	</div>
{/if}

<!-- Custom Material Design 3 Dialog / Modal popup -->
{#if dialog.isOpen}
	<div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300">
		<div 
			class="w-full max-w-sm bg-bg-card rounded-[28px] p-6 shadow-2xl border border-border-default flex flex-col gap-4 transform transition-all duration-300 scale-100"
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="dialog-title"
			aria-describedby="dialog-message"
		>
			<!-- Dialog Header -->
			<div class="flex items-center gap-3">
				{#if dialog.type === 'error'}
					<div class="p-2 rounded-full bg-accent-red/10 text-accent-red">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"/>
							<line x1="12" x2="12" y1="8" y2="12"/>
							<line x1="12" x2="12.01" y1="16" y2="16"/>
						</svg>
					</div>
				{:else if dialog.type === 'warning'}
					<div class="p-2 rounded-full bg-accent-amber/10 text-accent-amber">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
							<line x1="12" x2="12" y1="9" y2="13"/>
							<line x1="12" x2="12.01" y1="17" y2="17"/>
						</svg>
					</div>
				{:else if dialog.type === 'success'}
					<div class="p-2 rounded-full bg-accent-emerald/10 text-accent-emerald">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
							<polyline points="22 4 12 14.01 9 11.01"/>
						</svg>
					</div>
				{:else}
					<div class="p-2 rounded-full bg-accent-cyan/10 text-accent-cyan">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"/>
							<line x1="12" x2="12" y1="16" y2="12"/>
							<line x1="12" x2="12.01" y1="8" y2="8"/>
						</svg>
					</div>
				{/if}
				<h3 id="dialog-title" class="text-lg font-normal text-text-primary leading-none">{dialog.title}</h3>
			</div>

			<!-- Dialog Message -->
			<div id="dialog-message" class="text-xs text-text-secondary leading-relaxed whitespace-pre-line px-1">
				{dialog.message}
			</div>

			<!-- Dialog Actions -->
			<div class="flex justify-end gap-2 mt-2">
				<button 
					onclick={() => dialog.close()}
					class="px-5 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 bg-accent-cyan text-bg-primary hover:opacity-90 shadow-sm"
				>
					Dismiss
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes loading-bar {
		0% {
			left: -50%;
			width: 50%;
		}
		50% {
			left: 25%;
			width: 75%;
		}
		100% {
			left: 100%;
			width: 50%;
		}
	}
	.animate-loading-bar {
		animation: loading-bar 1.6s infinite ease-in-out;
	}

	@keyframes pulse-glow {
		0%, 100% {
			box-shadow: 0 4px 16px rgba(168, 199, 250, 0.2);
		}
		50% {
			box-shadow: 0 4px 28px rgba(168, 199, 250, 0.4);
		}
	}
	.animate-pulse-glow {
		animation: pulse-glow 2s infinite ease-in-out;
	}
</style>
