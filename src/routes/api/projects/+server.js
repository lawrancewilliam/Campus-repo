import { adminDb, adminStorage } from '$lib/firebase-admin.server.js';
import { json } from '@sveltejs/kit';

// Seed data function to prepopulate Firestore if empty (now utilizing Admin SDK)
async function checkAndSeed() {
    try {
        const studentsSnap = await adminDb.collection('students').limit(1).get();
        if (studentsSnap.empty) {
            const mockStudent = {
                userId: "21MCA001",
                username: "Rahul",
                email: "rahul@sonatech.ac.in",
                // Plain text for backwards compatibility during initial migration
                password: "password123",
                name: "Rahul",
                mobile: "9876543210",
                registerNumber: "21MCA001",
                department: "MCA",
                academicYear: "3rd Year",
                bio: "Passionate Full Stack Developer interested in AI and Web Technologies. Always eager to learn new skills.",
                joinedDate: "Aug 2023",
                bookmarkedProjectIds: [101, 102]
            };
            await adminDb.collection('students').doc('21MCA001').set(mockStudent);
        }

        const projectsSnap = await adminDb.collection('projects').limit(1).get();
        if (projectsSnap.empty) {
            const mockProjects = [
                { projectId: "101", projectName: "AI Attendance System", description: "A facial recognition based attendance system.", fileType: "zip", fileName: "ai_attendance.zip", fileSize: 1048576, firebaseStorageUrl: "https://example.com/ai_attendance.zip", createdAt: new Date().toISOString(), id: 101, title: "AI Attendance System", abstract: "A facial recognition based attendance system.", category: "AI", views: 150, stars: 20, downloadsCount: 75, authorName: "Rahul", authorRegNo: "21MCA001", dept: "CSE", visibility: "Public", fileName: "ai_attendance.zip", featured: true, recommended: true, homePage: true, favorite: false },
                { projectId: "102", projectName: "E-Commerce Platform", description: "A secure e-commerce application using modern frameworks.", fileType: "zip", fileName: "ecommerce_src.zip", fileSize: 2097152, firebaseStorageUrl: "https://example.com/ecommerce_src.zip", createdAt: new Date().toISOString(), id: 102, title: "E-Commerce Platform", abstract: "A secure e-commerce application using modern frameworks.", category: "Web Dev", views: 230, stars: 45, downloadsCount: 115, authorName: "Rahul", authorRegNo: "21MCA001", dept: "CSE", visibility: "Public", fileName: "ecommerce_src.zip", featured: true, recommended: false, homePage: true, favorite: true },
                { projectId: "103", projectName: "Traffic Control System", description: "Smart traffic signal controlling using IoT components.", fileType: "zip", fileName: "traffic_iot.zip", fileSize: 512000, firebaseStorageUrl: "https://example.com/traffic_iot.zip", createdAt: new Date().toISOString(), id: 103, title: "Traffic Control System", abstract: "Smart traffic signal controlling using IoT components.", category: "IoT", views: 89, stars: 12, downloadsCount: 44, authorName: "Rahul", authorRegNo: "21MCA001", dept: "ECE", visibility: "Private", fileName: "traffic_iot.zip", featured: false, recommended: true, homePage: false, favorite: false },
                { projectId: "104", projectName: "Hospital Management", description: "General hospital management and patient scheduling application.", fileType: "zip", fileName: "hospital_mgmt.zip", fileSize: 1572864, firebaseStorageUrl: "https://example.com/hospital_mgmt.zip", createdAt: new Date().toISOString(), id: 104, title: "Hospital Management", abstract: "General hospital management and patient scheduling application.", category: "Web Dev", views: 112, stars: 8, downloadsCount: 56, authorName: "Rahul", authorRegNo: "21MCA001", dept: "IT", visibility: "Public", fileName: "hospital_mgmt.zip", featured: false, recommended: false, homePage: false, favorite: false }
            ];
            for (const p of mockProjects) {
                await adminDb.collection('projects').doc(String(p.id)).set(p);
            }
        }

        const activitiesSnap = await adminDb.collection('activities').limit(1).get();
        if (activitiesSnap.empty) {
            const mockActivity = [
                { type: "upload", text: '<strong>Rahul</strong> uploaded <strong>AI Attendance System</strong>', time: "2 days ago", timestamp: Date.now() - 172800000 },
                { type: "star", text: '<strong>Priya</strong> starred <strong>E-Commerce Platform</strong>', time: "5 days ago", timestamp: Date.now() - 432000000 },
                { type: "edit", text: '<strong>Rahul</strong> updated <strong>Traffic Control System</strong>', time: "1 week ago", timestamp: Date.now() - 604800000 },
                { type: "join", text: '<strong>Rahul</strong> joined CampusRepo', time: "Aug 2023", timestamp: Date.now() - 90000000000 }
            ];
            for (const a of mockActivity) {
                await adminDb.collection('activities').add(a);
            }
        }
    } catch (e) {
        console.error("Seeding failed: ", e);
    }
}

export async function GET({ url }) {
    try {
        await checkAndSeed();
        
        const regNo = url.searchParams.get('regNo');
        const projectsRef = adminDb.collection('projects');
        let snap;
        
        if (regNo) {
            snap = await projectsRef.where('authorRegNo', '==', regNo).get();
        } else {
            snap = await projectsRef.get();
        }
        
        const projects = snap.docs.map(doc => doc.data());
        // Sort newest projects first (based on id)
        projects.sort((a, b) => b.id - a.id);
        
        return json(projects);
    } catch (e) {
        console.error('Error fetching projects:', e);
        return json({ success: false, message: e.message }, { status: 500 });
    }
}

export async function PUT({ request, locals }) {
    try {
        // Enforce authentication
        if (!locals.user) {
            return json({ success: false, message: 'Unauthorized.' }, { status: 401 });
        }

        const { projectId, updatedData } = await request.json();
        
        if (!projectId || !updatedData) {
            return json({ success: false, message: 'Missing projectId or updatedData.' }, { status: 400 });
        }

        const projectRef = adminDb.collection('projects').doc(String(projectId));
        const projectSnap = await projectRef.get();
        if (!projectSnap.exists) {
            return json({ success: false, message: 'Project not found.' }, { status: 404 });
        }
        
        const project = projectSnap.data();

        // Enforce ownership or admin permission
        if (locals.user.role !== 'admin' && locals.user.userId !== project.authorRegNo && locals.user.userId !== project.userId) {
            return json({ success: false, message: 'Forbidden. You do not own this project.' }, { status: 403 });
        }

        // Keep field synchronization clean
        if (updatedData.title) {
            updatedData.projectName = updatedData.title;
        }
        if (updatedData.abstract) {
            updatedData.description = updatedData.abstract;
        }

        await projectRef.update(updatedData);
        return json({ success: true });
    } catch (e) {
        console.error('Error updating project:', e);
        return json({ success: false, message: e.message }, { status: 500 });
    }
}

export async function DELETE({ request, locals }) {
    try {
        // Enforce authentication
        if (!locals.user) {
            return json({ success: false, message: 'Unauthorized.' }, { status: 401 });
        }

        const { projectId } = await request.json();
        
        if (!projectId) {
            return json({ success: false, message: 'Missing projectId.' }, { status: 400 });
        }

        const projectRef = adminDb.collection('projects').doc(String(projectId));
        const projectSnap = await projectRef.get();
        if (!projectSnap.exists) {
            return json({ success: false, message: 'Project not found.' }, { status: 404 });
        }

        const project = projectSnap.data();

        // Enforce permission: Admin or Author
        if (locals.user.role !== 'admin' && locals.user.userId !== project.authorRegNo && locals.user.userId !== project.userId) {
            return json({ success: false, message: 'Forbidden. You cannot delete this project.' }, { status: 403 });
        }

        // Cascade delete from Firebase Storage if it exists
        if (project.storagePath) {
            try {
                const bucket = adminStorage.bucket();
                await bucket.file(project.storagePath).delete();
                console.log(`✅ Deleted associated file from Storage: ${project.storagePath}`);
            } catch (err) {
                console.error(`⚠️ Failed to delete storage file ${project.storagePath}:`, err.message);
            }
        }

        await projectRef.delete();
        return json({ success: true });
    } catch (e) {
        console.error('Error deleting project:', e);
        return json({ success: false, message: e.message }, { status: 500 });
    }
}
