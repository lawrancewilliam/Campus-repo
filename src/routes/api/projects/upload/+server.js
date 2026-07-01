import { adminDb, adminStorage } from '$lib/firebase-admin.server.js';
import { json } from '@sveltejs/kit';
import { FIREBASE_STORAGE_BUCKET } from '$env/static/private';

export async function POST({ request, locals }) {
    try {
        // Enforce JWT authentication
        if (!locals.user) {
            return json({ success: false, message: 'Unauthorized. Please login first.' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const title = formData.get('title');
        const abstract = formData.get('abstract');
        const category = formData.get('category') || formData.get('domain') || 'General';
        const visibility = formData.get('visibility') || 'Public';

        if (!file || !title || !abstract) {
            return json({ success: false, message: 'Missing required file, title, or abstract.' }, { status: 400 });
        }

        // Validate file type extension
        const allowedExtensions = ['.pdf', '.ppt', '.pptx', '.zip'];
        const fileName = file.name.toLowerCase();
        const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

        if (!isValidExtension) {
            return json({ 
                success: false, 
                message: 'Invalid file type. Only PDF, PPT, PPTX, and ZIP files are allowed.' 
            }, { status: 400 });
        }

        // Validate maximum file size (100MB)
        const maxFileSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxFileSize) {
            return json({ success: false, message: 'File size exceeds 100MB limit.' }, { status: 400 });
        }

        // Determine destination folder in Firebase Storage
        let folder = 'zips';
        let fileType = 'zip';
        if (fileName.endsWith('.pdf')) {
            folder = 'pdfs';
            fileType = 'pdf';
        } else if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
            folder = 'ppts';
            fileType = 'ppt';
        }

        // Convert the File object to a Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const bucket = adminStorage.bucket();
        const destinationPath = `campus-repo/${folder}/${Date.now()}_${file.name}`;
        const storageFile = bucket.file(destinationPath);

        // Upload file bytes to Firebase Storage
        await storageFile.save(buffer, {
            metadata: {
                contentType: file.type || 'application/octet-stream'
            }
        });

        // Generate download URL
        let downloadUrl = '';
        try {
            // Attempt to get long-lived signed URL
            const [signedUrl] = await storageFile.getSignedUrl({
                action: 'read',
                expires: '03-09-2491' // far future
            });
            downloadUrl = signedUrl;
        } catch (signedErr) {
            console.warn('⚠️ Service account credentials missing or insufficient. Falling back to public storage URL:', signedErr.message);
            // Fallback public read URL (works if public read rules are active)
            downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(destinationPath)}?alt=media`;
        }

        const projectId = Date.now();

        // Build the metadata payload (merging new Firestore requirements and old frontend fields)
        const projectData = {
            // New schema fields
            projectId: String(projectId),
            projectName: title,
            description: abstract,
            uploadedBy: locals.user.username || locals.user.name || 'Student',
            userId: locals.user.userId || locals.user.registerNumber,
            fileType: fileType,
            fileName: file.name,
            fileSize: file.size,
            firebaseStorageUrl: downloadUrl,
            storagePath: destinationPath,
            createdAt: new Date().toISOString(),

            // Legacy compatibility fields
            id: projectId,
            title: title,
            abstract: abstract,
            category: category,
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

        // Write document to projects collection in Firestore
        await adminDb.collection('projects').doc(String(projectId)).set(projectData);

        return json({ success: true, project: projectData });

    } catch (e) {
        console.error('File Upload error:', e);
        return json({ success: false, message: e.message || 'File upload failed.' }, { status: 500 });
    }
}
