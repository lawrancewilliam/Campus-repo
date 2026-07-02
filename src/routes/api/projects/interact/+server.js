import { adminDb, FieldValue } from '$lib/firebase-admin.server.js';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    try {
        const { action, projectId, regNo } = await request.json();
        
        if (!action || !projectId) {
            return json({ success: false, message: 'Missing action or projectId.' }, { status: 400 });
        }
        
        const projectRef = adminDb.collection('projects').doc(String(projectId));
        
        // 1. Increment Project Views
        if (action === 'view') {
            await projectRef.update({
                views: FieldValue.increment(1)
            });
            const snap = await projectRef.get();
            return json({ success: true, count: snap.data()?.views || 0 });
        }
        
        // 2. Increment Project Downloads
        if (action === 'download') {
            await projectRef.update({
                downloadsCount: FieldValue.increment(1)
            });
            const snap = await projectRef.get();
            return json({ success: true, count: snap.data()?.downloadsCount || 0 });
        }
        
        // 3. Toggle Bookmark for Student
        if (action === 'bookmark') {
            if (!regNo) {
                return json({ success: false, message: 'Missing regNo for bookmark action.' }, { status: 400 });
            }
            
            const studentRef = adminDb.collection('students').doc(regNo);
            const studentSnap = await studentRef.get();
            
            if (!studentSnap.exists) {
                return json({ success: false, message: 'Student not found.' }, { status: 404 });
            }
            
            const studentData = studentSnap.data();
            const bookmarks = studentData.bookmarkedProjectIds || [];
            
            // Project IDs in mock data are numeric. Ensure correct type check.
            const pId = Number(projectId);
            const index = bookmarks.indexOf(pId);
            let bookmarked = false;
            
            if (index === -1) {
                bookmarks.push(pId);
                bookmarked = true;
            } else {
                bookmarks.splice(index, 1);
            }
            
            await studentRef.update({
                bookmarkedProjectIds: bookmarks
            });
            
            // Retrieve updated student profile to return for session update
            const updatedStudentSnap = await studentRef.get();
            const { password: _, hashedPassword: __, passwordHash: ___, salt: ____, ...safeStudent } = updatedStudentSnap.data();
            
            return json({ 
                success: true, 
                bookmarked, 
                student: safeStudent 
            });
        }
        
        return json({ success: false, message: 'Invalid action.' }, { status: 400 });
    } catch (e) {
        console.error('Interaction error:', e);
        return json({ success: false, message: e.message }, { status: 500 });
    }
}

