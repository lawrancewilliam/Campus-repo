import { adminDb } from '$lib/firebase-admin.server.js';
import { comparePassword, generateToken } from '$lib/auth.server.js';
import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
    try {
        const { username, password } = await request.json();
        
        if (!username || !password) {
            return json({ success: false, message: 'Missing username or password.' }, { status: 400 });
        }

        // 1. Admin login check
        if (username === '12345' && password === 'William26') {
            const token = generateToken({
                userId: '12345',
                registerNumber: '12345',
                username: 'Admin',
                role: 'admin'
            });

            cookies.set('token', token, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });

            const session = { role: 'admin', user: { name: 'Admin', registerNumber: '12345' } };
            return json({ success: true, role: 'admin', session, token });
        }
        
        // 2. Student login check
        let student = null;
        const studentsRef = adminDb.collection('students');
        
        // Attempt search by register number (document ID)
        const docSnap = await studentsRef.doc(username).get();
        
        if (docSnap.exists) {
            student = docSnap.data();
        } else {
            // Attempt search by email
            const querySnap = await studentsRef.where('email', '==', username).limit(1).get();
            if (!querySnap.empty) {
                student = querySnap.docs[0].data();
            }
        }
        
        if (student) {
            let isValid = false;
            if (student.hashedPassword) {
                isValid = await comparePassword(password, student.hashedPassword);
            } else if (student.password) {
                // Legacy plain text check (allows smooth migration)
                isValid = student.password === password;
            }

            if (isValid) {
                const token = generateToken({
                    userId: student.registerNumber,
                    registerNumber: student.registerNumber,
                    email: student.email,
                    username: student.name,
                    role: 'student',
                    department: student.department || 'CSE'
                });

                cookies.set('token', token, {
                    path: '/',
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7 // 1 week
                });

                // Clean sensitive credentials before returning
                const { password: _, hashedPassword: __, ...safeUser } = student;
                const session = { role: 'student', user: safeUser };
                
                return json({ success: true, role: 'student', session, token });
            }
        }
        
        return json({ success: false, message: 'Invalid register number/email or password.' }, { status: 401 });
    } catch (e) {
        console.error('Login API error:', e);
        return json({ success: false, message: e.message }, { status: 500 });
    }
}
