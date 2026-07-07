import { adminDb } from '$lib/firebase-admin.server.js';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
    try {
        if (!locals.user) {
            return json({ success: false, message: 'Unauthorized. Please login first.' }, { status: 401 });
        }

        const body = await request.json();
        const { title, abstract, category, visibility, fileUrl, fileName, fileSize, fileType, destinationPath } = body;

        if (!fileUrl || !title || !abstract) {
            return json({ success: false, message: 'Missing required project details or uploaded file link.' }, { status: 400 });
        }

        let uploadedBy = locals.user.username || locals.user.name || 'Student';
        let userId = locals.user.userId || locals.user.registerNumber;
        let authorName = uploadedBy;
        let authorRegNo = userId;
        let dept = locals.user.department || 'CSE';

        if (locals.user.role === 'admin' && body.authorRegNo) {
            authorName = body.authorName || authorName;
            authorRegNo = body.authorRegNo;
            dept = body.dept || dept;
            uploadedBy = authorName;
            userId = authorRegNo;
        }

        const projectId = Date.now();

        const projectData = {
            projectId: String(projectId),
            projectName: title,
            description: abstract,
            uploadedBy: uploadedBy,
            userId: userId,
            fileType: fileType,
            fileName: fileName,
            fileSize: fileSize,
            firebaseStorageUrl: fileUrl,
            storagePath: destinationPath,
            createdAt: new Date().toISOString(),

            // Legacy compatibility fields
            id: projectId,
            title: title,
            abstract: abstract,
            category: category || 'General',
            visibility: visibility || 'Public',
            authorName: authorName,
            authorRegNo: authorRegNo,
            dept: dept,
            views: 0,
            stars: 0,
            downloadsCount: 0,
            date: 'Just now',
            featured: false,
            recommended: false,
            favorite: false,
            homePage: false
        };

        await adminDb.collection('projects').doc(String(projectId)).set(projectData);

        return json({ success: true, project: projectData });

    } catch (e) {
        console.error('Metadata database save error:', e);
        return json({ success: false, message: e.message || 'Failed to register project.' }, { status: 500 });
    }
}