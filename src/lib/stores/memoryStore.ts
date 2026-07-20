import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function readBool(key: string, defaultValue: boolean): boolean {
	if (!browser) return defaultValue;
	const raw = localStorage.getItem(key);
	if (raw === null) return defaultValue;
	return raw === 'true';
}

function readNumber(key: string, defaultValue: number): number {
	if (!browser) return defaultValue;
	const raw = localStorage.getItem(key);
	if (raw === null) return defaultValue;
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : defaultValue;
}

const KEYS = {
	iapsEnabled: 'mem_iapsEnabled',
	timerEnabled: 'mem_timerEnabled',
	pollingRate: 'mem_pollingRate',
	targetResolution: 'mem_targetResolution',
} as const;


export const iapsEnabled = writable<boolean>(readBool(KEYS.iapsEnabled, false));
export const timerEnabled = writable<boolean>(readBool(KEYS.timerEnabled, false));
export const pollingRate = writable<number>(readNumber(KEYS.pollingRate, 1000));
export const targetResolution = writable<number>(readNumber(KEYS.targetResolution, 1));

if (browser) {
	iapsEnabled.subscribe((v) => localStorage.setItem(KEYS.iapsEnabled, String(v)));
	timerEnabled.subscribe((v) => localStorage.setItem(KEYS.timerEnabled, String(v)));
	pollingRate.subscribe((v) => localStorage.setItem(KEYS.pollingRate, String(v)));
	targetResolution.subscribe((v) => localStorage.setItem(KEYS.targetResolution, String(v)));
}
