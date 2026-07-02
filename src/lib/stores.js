import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * A writable Svelte store that holds the user's session data.
 * It automatically persists the session to the browser's localStorage.
 */

// Initialize with data from localStorage if in the browser, otherwise null.
const initialSession = browser ? JSON.parse(localStorage.getItem('session')) : null;

export const session = writable(initialSession);

// When the session store changes, update localStorage.
if (browser) {
	session.subscribe((value) => {
		// If value is not null, stringify and store it. Otherwise, remove it.
		localStorage.setItem('session', value ? JSON.stringify(value) : null);
	});
}