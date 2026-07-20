// Svelte 5 class-based global alert dialog state (using .svelte.ts extension)
class DialogState {
	title = $state('');
	message = $state('');
	type = $state<'info' | 'error' | 'success' | 'warning'>('info');
	isOpen = $state(false);

	show(title: string, message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') {
		this.title = title;
		this.message = message;
		this.type = type;
		this.isOpen = true;
	}

	close() {
		this.isOpen = false;
	}
}

export const dialog = new DialogState();
