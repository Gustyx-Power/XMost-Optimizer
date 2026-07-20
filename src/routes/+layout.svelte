<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let { children } = $props();
	let isDark = $state(true); // Default to dark theme

	onMount(() => {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme) {
			isDark = savedTheme === 'dark';
		} else {
			isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}
		applyTheme();
	});

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

<div class="flex h-screen bg-gradient-to-br from-bg-primary-start to-bg-primary-end text-text-primary overflow-hidden font-sans select-none transition-colors duration-300">
	<!-- Material Design 3 Navigation Rail -->
	<aside class="w-20 flex-shrink-0 bg-bg-secondary flex flex-col items-center py-4 justify-between border-r border-white/[0.02] transition-colors duration-300">
		<!-- Top Branding: MD3 Monogram -->
		<div class="flex flex-col items-center mt-2">
			<div class="w-12 h-12 rounded-2xl bg-accent-cyan/10 text-accent-cyan flex flex-col items-center justify-center font-sans font-black shadow-sm" title="XMost Optimizer">
				<span class="text-[14px] leading-none font-bold">XM</span>
				<span class="text-[8px] leading-none tracking-widest text-accent-amber mt-0.5 font-bold">OPT</span>
			</div>
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
					Monitor
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
					Memory
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
					Tweaker
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
					Settings
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
