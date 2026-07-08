import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * A writable Svelte store that holds the user's session data.
 * It automatically persists the session to the browser's localStorage.
 */

// Initialize with data from localStorage if in the browser, otherwise null.
const initialSession = browser ? JSON.parse(localStorage.getItem('session')) : null;

const { subscribe, set } = writable(initialSession);

export const session = {
	subscribe,
	set: (value) => {
		if (browser) {
			localStorage.setItem('session', value ? JSON.stringify(value) : null);
		}
		set(value);
	},
	logout: () => {
		if (browser) {
			localStorage.removeItem('session');
		}
		set(null);
	}
};