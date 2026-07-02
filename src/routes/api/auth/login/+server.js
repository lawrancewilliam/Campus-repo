import { adminDb, FieldValue } from '$lib/firebase-admin.server.js';
import { hashPassword, comparePassword, generateToken } from '$lib/auth.server.js';
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
            let needsMigration = false;
            let migrationHash = null;

            if (student.passwordHash) {
                // Production-ready check
                isValid = await comparePassword(password, student.passwordHash);
            } else if (student.hashedPassword) {
                // Verify legacy bcrypt hash
                isValid = await comparePassword(password, student.hashedPassword);
                if (isValid) {
                    needsMigration = true;
                    migrationHash = student.hashedPassword;
                }
            } else if (student.password) {
                // Legacy plain text check (allows smooth migration)
                isValid = student.password === password;
                if (isValid) {
                    needsMigration = true;
                    // Hash passwords using bcrypt with saltRounds = 10
                    migrationHash = await hashPassword(password);
                }
            }

            if (isValid) {
                // If migration is required, update the student document to store passwordHash only
                if (needsMigration && migrationHash) {
                    const studentDocRef = studentsRef.doc(student.registerNumber);
                    await studentDocRef.update({
                        passwordHash: migrationHash,
                        password: FieldValue.delete(),
                        hashedPassword: FieldValue.delete()
                    });

                    // Update local student object to reflect database state
                    student.passwordHash = migrationHash;
                    delete student.password;
                    delete student.hashedPassword;
                }

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
                const { password: _, hashedPassword: __, passwordHash: ___, ...safeUser } = student;
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
