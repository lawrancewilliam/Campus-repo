import { verifyToken } from '$lib/auth.server.js';
import { json } from '@sveltejs/kit';

export async function handle({ event, resolve }) {
    // 1. Get token from HTTP-only cookie or Authorization header
    const token = event.cookies.get('token') || event.request.headers.get('Authorization')?.replace('Bearer ', '');

    if (token) {
        try {
            const decoded = verifyToken(token);
            // Attach user metadata to locals for route handlers
            event.locals.user = decoded;
        } catch (err) {
            console.error('⚠️ Hook JWT verification error:', err.message);
            // Expired or corrupted token: delete cookie
            event.cookies.delete('token', { path: '/' });
        }
    }

    // 2. Protected endpoints check (e.g. upload file, update student, delete project)
    const pathname = event.url.pathname;
    const method = event.request.method;

    const isProtectedApi = 
        pathname.startsWith('/api/projects/upload') ||
        (pathname.startsWith('/api/projects') && (method === 'DELETE' || method === 'POST' || method === 'PUT')) ||
        (pathname.startsWith('/api/students') && method === 'PUT');

    if (isProtectedApi && !event.locals.user) {
        return json(
            { success: false, message: 'Unauthorized access. Please log in first.' }, 
            { status: 401 }
        );
    }

    return await resolve(event);
}
