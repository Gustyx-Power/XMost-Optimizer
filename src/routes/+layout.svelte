<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	let { children } = $props();
</script>

<div class="flex h-screen bg-bg-primary text-text-primary overflow-hidden">
	<!-- Sidebar Navigation -->
	<aside class="w-64 flex-shrink-0 bg-bg-secondary border-r border-text-muted/10 flex flex-col">
		<div class="p-6">
			<h1 class="text-xl font-bold tracking-tight text-accent-cyan font-mono">XMOST<span class="text-text-primary">OPT</span></h1>
			<p class="text-xs text-text-muted mt-1 uppercase tracking-wider">System Control</p>
		</div>

		<nav class="flex-1 px-4 space-y-2 mt-4">
			<a 
				href="/" 
				class="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors { $page.url.pathname === '/' ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20' : 'text-text-secondary hover:text-text-primary hover:bg-white/5' }"
			>
				System Monitor
			</a>
			<a 
				href="/memory" 
				class="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors { $page.url.pathname.startsWith('/memory') ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20' : 'text-text-secondary hover:text-text-primary hover:bg-white/5' }"
			>
				Memory Orchestrator
			</a>
			<a 
				href="/os-tweaker" 
				class="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors { $page.url.pathname.startsWith('/os-tweaker') ? 'bg-orange-400/10 text-orange-400 border border-orange-400/20' : 'text-text-secondary hover:text-text-primary hover:bg-white/5' }"
			>
				OS Tweaker
			</a>
		</nav>

		<div class="p-4 border-t border-text-muted/10">
			<div class="text-[10px] text-text-muted text-center uppercase tracking-widest">v1.0.0</div>
		</div>
	</aside>

	<!-- Main Content Area -->
	<main class="flex-1 relative overflow-auto">
		{@render children()}
	</main>
</div>
