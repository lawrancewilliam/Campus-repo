import { adminDb, adminStorage } from '$lib/firebase-admin.server.js';
import { json } from '@sveltejs/kit';
import JSZip from 'jszip';

export async function POST({ request, locals }) {
    try {
        if (!locals.user) {
            return json({ success: false, message: 'Unauthorized. Please login first.' }, { status: 401 });
        }

        const formData = await request.formData();
        const file_sourceCode = formData.get('file_sourceCode');
        const file_report = formData.get('file_report');
        const file_presentation = formData.get('file_presentation');
        const file_readme = formData.get('file_readme');

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

        if (!title || !abstract) {
            return json({ success: false, message: 'Missing required project title or abstract.' }, { status: 400 });
        }

        // Collect all uploaded files
        const filesToBundle = [];
        if (file_sourceCode) filesToBundle.push({ name: file_sourceCode.name, file: file_sourceCode });
        if (file_report) filesToBundle.push({ name: file_report.name, file: file_report });
        if (file_presentation) filesToBundle.push({ name: file_presentation.name, file: file_presentation });
        if (file_readme) filesToBundle.push({ name: file_readme.name, file: file_readme });

        if (filesToBundle.length === 0) {
            return json({ success: false, message: 'Please upload at least one project file (Source Code ZIP, PDF Report, Presentation PPT, or README).' }, { status: 400 });
        }

        // Initialize JSZip and add all files
        const zip = new JSZip();
        for (const item of filesToBundle) {
            const arrayBuffer = await item.file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            zip.file(item.name, buffer);
        }

        // Generate combined ZIP in memory as a Node Buffer
        const combinedBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
        const bundleFileName = `${Date.now()}_${cleanTitle}_Bundle.zip`;
        const destinationPath = `campus-repo/zips/${bundleFileName}`;

        const bucket = adminStorage.bucket();
        const storageFile = bucket.file(destinationPath);

        // Upload combined bytes using Admin Storage SDK (with local fallback mock)
        await storageFile.save(combinedBuffer, {
            metadata: {
                contentType: 'application/zip'
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
            fileType: 'zip',
            fileName: bundleFileName,
            fileSize: combinedBuffer.length,
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
        console.error('File bundle upload error on backend:', e);
        return json({ success: false, message: e.message || 'Failed to upload and bundle project.' }, { status: 500 });
    }
}