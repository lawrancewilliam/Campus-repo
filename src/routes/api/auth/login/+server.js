import { adminDb, FieldValue } from '$lib/firebase-admin.server.js';
import { hashPassword, comparePassword, generateToken } from '$lib/auth.server.js';
import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
    try {
        const { username, password } = await request.json();
        
        if (!username || !password) {
            return json({ success: false, message: 'Missing username or password.' }, { status: 400 });
        }

        // Unified login check for students and admins
        let student = null;
        let studentDocRef = null;
        const studentsRef = adminDb.collection('students');
        
        if (username === 'admin') {
            const adminDoc = await studentsRef.doc('admin').get();
            if (!adminDoc.exists) {
                const adminPasswordHash = await hashPassword('Admin@1234');
                const mockAdmin = {
                    userId: "admin",
                    username: "admin",
                    name: "Admin",
                    email: "admin@sonatech.ac.in",
                    passwordHash: adminPasswordHash,
                    registerNumber: "admin",
                    role: "admin",
                    department: "Admin",
                    academicYear: "N/A",
                    bio: "Built-in Administrator account.",
                    joinedDate: "Jul 2026",
                    bookmarkedProjectIds: []
                };
                await studentsRef.doc('admin').set(mockAdmin);
                console.log('✅ Seeded built-in admin account during login.');
            }
        }

        // Attempt search by register number (document ID)
        const docSnap = await studentsRef.doc(username).get();
        
        if (docSnap.exists) {
            student = docSnap.data();
            studentDocRef = docSnap.ref; // Ensure ref is set when found by doc ID
        } else {
            // Attempt search by email
            const querySnap = await studentsRef.where('email', '==', username).limit(1).get();
            if (!querySnap.empty) {
                studentDocRef = querySnap.docs[0].ref;
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
                    // studentDocRef is now guaranteed to be set from the initial lookup
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

                const userRole = student.role || 'student'; // Default to 'student' if role is not set

                const token = generateToken({
                    userId: student.registerNumber,
                    registerNumber: student.registerNumber,
                    email: student.email,
                    username: student.name,
                    role: userRole,
                    department: student.department
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
                const session = { role: userRole, user: safeUser };
                
                return json({ success: true, role: userRole, session, token });
            }
        }
        
        return json({ success: false, message: 'Invalid register number/email or password.' }, { status: 401 });
    } catch (e) {
        console.error('Login API error:', e);
        return json({ success: false, message: e.message }, { status: 500 });
    }
}
