import { adminDb, adminStorage } from '$lib/firebase-admin.server.js';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
    try {
        if (!locals.user) {
            return json({ success: false, message: 'Unauthorized. Please login first.' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const title = formData.get('title');
        const abstract = formData.get('abstract');
        const category = formData.get('category') || formData.get('domain') || 'General';
        const domain = formData.get('domain') || category;
        const visibility = formData.get('visibility') || 'Public';
        
        const semester = formData.get('semester') || '';
        const academicYear = formData.get('academicYear') || '';
        const teamLeader = formData.get('teamLeader') || '';
        const teamMembers = formData.get('teamMembers') || '';
        const frontendTech = formData.get('frontendTech') || '';
        const backendTech = formData.get('backendTech') || '';
        const database = formData.get('database') || '';
        const toolsUsed = formData.get('toolsUsed') || '';
        const tags = formData.get('tags') || '';

        if (!file || !title || !abstract) {
            return json({ success: false, message: 'Missing required project details or file.' }, { status: 400 });
        }

        const fileName = file.name;
        const fileSize = file.size;

        // Validate maximum file size (100MB)
        const maxFileSize = 100 * 1024 * 1024;
        if (fileSize > maxFileSize) {
            return json({ success: false, message: 'File size exceeds 100MB limit.' }, { status: 400 });
        }

        // Determine destination folder in Firebase Storage
        let folder = 'zips';
        let fileType = 'zip';
        const lowerName = fileName.toLowerCase();
        if (lowerName.endsWith('.pdf')) {
            folder = 'pdfs';
            fileType = 'pdf';
        } else if (lowerName.endsWith('.ppt') || lowerName.endsWith('.pptx')) {
            folder = 'ppts';
            fileType = 'ppt';
        } else if (lowerName.endsWith('.md') || lowerName.endsWith('.txt')) {
            folder = 'readmes';
            fileType = 'text';
        }

        // Convert the File object to a Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const destinationPath = `campus-repo/${folder}/${Date.now()}_${fileName}`;
        const bucket = adminStorage.bucket();
        const storageFile = bucket.file(destinationPath);

        // Upload bytes using the Admin SDK
        await storageFile.save(buffer, {
            metadata: {
                contentType: file.type || 'application/octet-stream'
            }
        });

        // Get download URL (signed URL or fallback public URL)
        let downloadUrl = '';
        try {
            const [signedUrl] = await storageFile.getSignedUrl({
                action: 'read',
                expires: '03-09-2491'
            });
            downloadUrl = signedUrl;
        } catch (signedErr) {
            console.warn('⚠️ getSignedUrl failed, falling back to public storage URL:', signedErr.message);
            // Fallback public read URL (works if public read rules are active)
            const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'campus-repo-bcdd3.firebasestorage.app';
            downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(destinationPath)}?alt=media`;
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
            firebaseStorageUrl: downloadUrl,
            storagePath: destinationPath,
            createdAt: new Date().toISOString(),

            // Form metadata fields
            category: category,
            domain: domain,
            semester: semester,
            academicYear: academicYear,
            teamLeader: teamLeader,
            teamMembers: teamMembers,
            frontendTech: frontendTech,
            backendTech: backendTech,
            database: database,
            toolsUsed: toolsUsed,
            tags: tags,

            // Legacy compatibility fields
            id: projectId,
            title: title,
            abstract: abstract,
            visibility: visibility,
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
        console.error('File upload error on backend:', e);
        return json({ success: false, message: e.message || 'Failed to upload project.' }, { status: 500 });
    }
}