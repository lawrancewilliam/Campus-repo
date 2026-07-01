import { adminDb } from '$lib/firebase-admin.server.js';
import { hashPassword, generateToken } from '$lib/auth.server.js';
import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
    try {
        const student = await request.json();
        
        if (!student.registerNumber || !student.email || !student.password || !student.name) {
            return json({ success: false, message: 'Missing required registration fields.' }, { status: 400 });
        }

        const studentsRef = adminDb.collection('students');
        
        // Check if register number already exists
        const regSnap = await studentsRef.where('registerNumber', '==', student.registerNumber).get();
        if (!regSnap.empty) {
            return json({ success: false, message: 'Register Number already exists.' }, { status: 400 });
        }
        
        // Check if email already exists
        const emailSnap = await studentsRef.where('email', '==', student.email).get();
        if (!emailSnap.empty) {
            return json({ success: false, message: 'Email already exists.' }, { status: 400 });
        }

        // Hash password with bcryptjs
        const hashedPassword = await hashPassword(student.password);
        
        const newStudent = {
            // New user schema
            userId: student.registerNumber,
            username: student.name,
            email: student.email,
            hashedPassword: hashedPassword,
            createdAt: new Date().toISOString(),

            // Legacy fields for compatibility
            name: student.name,
            mobile: student.mobile || '',
            registerNumber: student.registerNumber,
            department: student.department || 'CSE',
            academicYear: student.academicYear || '3rd Year',
            bio: student.bio || 'No bio yet.',
            joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            bookmarkedProjectIds: []
        };
        
        // Store in Firestore using register number as key
        await studentsRef.doc(student.registerNumber).set(newStudent);

        // Generate JWT
        const token = generateToken({
            userId: student.registerNumber,
            registerNumber: student.registerNumber,
            email: student.email,
            username: student.name,
            role: 'student',
            department: student.department || 'CSE'
        });

        // Set secure HTTP-only cookie
        cookies.set('token', token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });
        
        // Strip sensitive password before returning
        const { hashedPassword: _, ...safeUser } = newStudent;
        const session = { role: 'student', user: safeUser };

        return json({ success: true, token, session });
    } catch (e) {
        console.error('Registration error:', e);
        return json({ success: false, message: e.message }, { status: 500 });
    }
}
