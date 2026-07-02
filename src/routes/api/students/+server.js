import { adminDb, FieldValue } from '$lib/firebase-admin.server.js';
import { hashPassword, comparePassword } from '$lib/auth.server.js';
import { json } from '@sveltejs/kit';

export async function GET() {
    try {
        const studentsSnap = await adminDb.collection('students').get();
        const students = studentsSnap.docs.map(doc => {
            const data = doc.data();
            // Sanitize sensitive credentials
            const { password, hashedPassword, passwordHash, ...safeData } = data;
            return safeData;
        });
        return json(students);
    } catch (e) {
        console.error('Error fetching students:', e);
        return json({ success: false, message: e.message }, { status: 500 });
    }
}

export async function PUT({ request, locals }) {
    try {
        // Enforce authentication
        if (!locals.user) {
            return json({ success: false, message: 'Unauthorized.' }, { status: 401 });
        }

        const { regNo, updatedData } = await request.json();
        
        if (!regNo || !updatedData) {
            return json({ success: false, message: 'Missing regNo or updatedData.' }, { status: 400 });
        }

        // Only allow user to update their own profile unless they are admin
        if (locals.user.role !== 'admin' && locals.user.userId !== regNo) {
            return json({ success: false, message: 'Forbidden.' }, { status: 403 });
        }

        const studentRef = adminDb.collection('students').doc(regNo);

        // Check if updating password
        if (updatedData.newPassword) {
            const { currentPassword, newPassword } = updatedData;
            if (!currentPassword || !newPassword) {
                return json({ success: false, message: 'Missing password fields.' }, { status: 400 });
            }

            const docSnap = await studentRef.get();
            if (!docSnap.exists) {
                return json({ success: false, message: 'Student not found.' }, { status: 404 });
            }
            const student = docSnap.data();

            let isValid = false;
            if (student.passwordHash) {
                isValid = await comparePassword(currentPassword, student.passwordHash);
            } else if (student.hashedPassword) {
                isValid = await comparePassword(currentPassword, student.hashedPassword);
            } else if (student.password) {
                // Legacy plain text check
                isValid = student.password === currentPassword;
            }

            if (!isValid) {
                return json({ success: false, message: 'Current password is incorrect.' }, { status: 400 });
            }

            // Hash the new password with bcrypt
            const newHashed = await hashPassword(newPassword);
            updatedData.passwordHash = newHashed;
            
            // Delete legacy fields if they exist
            updatedData.password = FieldValue.delete();
            updatedData.hashedPassword = FieldValue.delete();

            // Clear password forms payload
            delete updatedData.currentPassword;
            delete updatedData.newPassword;
        }

        await studentRef.update(updatedData);
        
        return json({ success: true });
    } catch (e) {
        console.error('Error updating student:', e);
        return json({ success: false, message: e.message }, { status: 500 });
    }
}

export async function DELETE({ request, locals }) {
    try {
        // Only admin can delete student accounts
        if (!locals.user || locals.user.role !== 'admin') {
            return json({ success: false, message: 'Forbidden.' }, { status: 403 });
        }

        const { regNo } = await request.json();
        
        if (!regNo) {
            return json({ success: false, message: 'Missing regNo.' }, { status: 400 });
        }
        
        // 1. Delete the student document
        await adminDb.collection('students').doc(regNo).delete();
        
        // 2. Cascade delete: Delete all projects authored by this student
        const projectsSnap = await adminDb.collection('projects').where('authorRegNo', '==', regNo).get();
        
        const batch = adminDb.batch();
        for (const projectDoc of projectsSnap.docs) {
            batch.delete(projectDoc.ref);
        }
        await batch.commit();
        
        return json({ success: true });
    } catch (e) {
        console.error('Error deleting student:', e);
        return json({ success: false, message: e.message }, { status: 500 });
    }
}
