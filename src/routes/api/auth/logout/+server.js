import { json } from '@sveltejs/kit';

/**
 * Handles user logout by clearing the session cookie.
 */
export async function POST({ cookies }) {
	// Clear the 'token' cookie by setting its maxAge to 0.
	cookies.set('token', '', {
		path: '/',
		maxAge: 0
	});

	return json({ success: true, message: 'Logged out successfully.' });
}