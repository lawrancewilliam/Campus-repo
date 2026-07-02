import { json } from '@sveltejs/kit';

export async function POST({ cookies }) {
    // Delete the JWT cookie
    cookies.delete('token', { path: '/' });
    
    return json({ success: true, message: 'Logged out successfully.' });
}
