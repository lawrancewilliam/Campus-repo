import { adminDb, FieldValue } from '$lib/firebase-admin.server.js';
import { hashPassword, comparePassword, generateToken } from '$lib/auth.server.js';
import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
    try {
        const { username, password, role } = await request.json();

        // Ensure admin user exists before any login attempt. This is the most reliable location for this logic.
        const adminRef = adminDb.collection('students').doc('admin');
        const adminSnap = await adminRef.get();
        if (!adminSnap.exists) {
            const adminPasswordHash = await hashPassword('Admin@1234');
            const adminUser = {
                userId: 'admin',
                registerNumber: 'admin',
                email: 'admin@sonatech.ac.in',
                name: 'Admin',
                username: 'Admin',
                role: 'admin',
                department: 'IT',
                passwordHash: adminPasswordHash,
                createdAt: new Date().toISOString()
            };
            await adminRef.set(adminUser);
            console.log('✅ Admin user created in Firestore during login check.');
        }
        
        if (!username || !password) {
            return json({ success: false, message: 'Missing username or password.' }, { status: 400 });
        }

        const lookup = username.trim();
        const lookupLower = lookup.toLowerCase();
        const lookupUpper = lookup.toUpperCase();

        // Unified login check for students and admins
        let student = null;
        let studentDocRef = null;
        const studentsRef = adminDb.collection('students');
        
        // Attempt search by register number (document ID) using cased variants
        let docSnap = await studentsRef.doc(lookup).get();
        if (!docSnap.exists) {
            docSnap = await studentsRef.doc(lookupUpper).get();
        }
        if (!docSnap.exists) {
            docSnap = await studentsRef.doc(lookupLower).get();
        }
        
        if (docSnap.exists) {
            student = docSnap.data();
            studentDocRef = docSnap.ref; // Ensure ref is set when found by doc ID
        } else {
            // Attempt search by email
            const querySnap = await studentsRef.where('email', '==', lookupLower).limit(1).get();
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

                if (role && role !== userRole) {
                    return json({ success: false, message: 'Invalid register number/email or password.' }, { status: 401 });
                }

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
