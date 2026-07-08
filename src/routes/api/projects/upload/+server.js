import { adminDb } from '$lib/firebase-admin.server.js';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
    try {
        if (!locals.user) {
            return json({ success: false, message: 'Unauthorized. Please login first.' }, { status: 401 });
        }

        const body = await request.json();
        const { 
            title, 
            abstract, 
            category, 
            domain,
            visibility, 
            fileUrl, 
            fileName, 
            fileSize, 
            fileType, 
            destinationPath,
            semester,
            academicYear,
            teamLeader,
            teamMembers,
            frontendTech,
            backendTech,
            database,
            toolsUsed,
            tags
        } = body;

        if (!fileUrl || !title || !abstract) {
            return json({ success: false, message: 'Missing required project details or uploaded file link.' }, { status: 400 });
        }

        const projectId = Date.now();

        const projectData = {
            projectId: String(projectId),
            projectName: title,
            description: abstract,
            uploadedBy: locals.user.username || locals.user.name || 'Student',
            userId: locals.user.userId || locals.user.registerNumber,
            fileType: fileType,
            fileName: fileName,
            fileSize: fileSize,
            firebaseStorageUrl: fileUrl,
            storagePath: destinationPath,
            createdAt: new Date().toISOString(),

            // Form metadata fields
            category: category || domain || 'General',
            domain: domain || category || 'General',
            semester: semester || '',
            academicYear: academicYear || '',
            teamLeader: teamLeader || '',
            teamMembers: teamMembers || '',
            frontendTech: frontendTech || '',
            backendTech: backendTech || '',
            database: database || '',
            toolsUsed: toolsUsed || '',
            tags: tags || '',

            // Legacy compatibility fields
            id: projectId,
            title: title,
            abstract: abstract,
            visibility: visibility || 'Public',
            authorName: locals.user.username || locals.user.name || 'Student',
            authorRegNo: locals.user.userId || locals.user.registerNumber,
            dept: locals.user.department || 'CSE',
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