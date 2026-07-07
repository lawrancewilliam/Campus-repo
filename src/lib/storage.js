const isClient = typeof window !== 'undefined';

// --- Client Session Helpers (Synchronous using LocalStorage) ---
function getLocal(key, defaultValue = null) {
    if (!isClient) return defaultValue;
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
}

function setLocal(key, val) {
    if (isClient) {
        localStorage.setItem(key, JSON.stringify(val));
    }
}

export function getCurrentSession() {
    return getLocal('session', null);
}

export async function logout() {
    if (isClient) {
        localStorage.removeItem('session');
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Server logout failed:', e);
        }
    }
}

// --- Asynchronous Database/API Operations ---

export async function registerStudent(student) {
    try {
        const res = await fetch('/api/auth/register', { // SvelteKit endpoint is already correct
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student)
        });
        const result = await res.json();
        if (result.success) {
            // Log joining activity
            await logActivity('join', `<strong>${student.name}</strong> joined CampusRepo`, "Just now");
        }
        return result;
    } catch (e) {
        console.error('registerStudent failed:', e);
        return { success: false, message: e.message || 'Server error' };
    }
}

export async function loginUser(username, password, role) {
    try {
        const res = await fetch('/api/auth/login', { // SvelteKit endpoint is already correct
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });
        const result = await res.json();
        if (result.success) {
            setLocal('session', result.session);
        }
        return result;
    } catch (e) {
        console.error('loginUser failed:', e);
        return { success: false, message: 'Server communication error.' };
    }
}

export async function getStudents() {
    try {
        const res = await fetch('/api/students');
        return await res.json();
    } catch (e) {
        console.error('getStudents failed:', e);
        return [];
    }
}

export async function getProjects() {
    try {
        const res = await fetch('/api/projects');
        return await res.json();
    } catch (e) {
        console.error('getProjects failed:', e);
        return [];
    }
}

export async function getStudentProjects(regNo) {
    try {
        const res = await fetch(`/api/projects?regNo=${encodeURIComponent(regNo)}`);
        return await res.json();
    } catch (e) {
        console.error('getStudentProjects failed:', e);
        return [];
    }
}

export async function updateStudentProfile(regNo, updatedData) {
    try {
        const res = await fetch('/api/students', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ regNo, updatedData })
        });
        const result = await res.json();
        
        if (result.success) {
            // Update local session if it corresponds to current logged-in user
            const session = getCurrentSession();
            if (session && session.role === 'student' && session.user.registerNumber === regNo) {
                session.user = { ...session.user, ...updatedData };
                setLocal('session', session);
            }
        }
        return result;
    } catch (e) {
        console.error('updateStudentProfile failed:', e);
        return { success: false, message: e.message };
    }
}

export async function deleteStudent(regNo) {
    try {
        // Fetch student first to log their name
        const students = await getStudents();
        const student = students.find(s => s.registerNumber === regNo);

        const res = await fetch('/api/students', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ regNo })
        });
        const result = await res.json();
        
        if (result.success) {
            if (student) {
                await logActivity('delete', `Student account <strong>${student.name}</strong> was deleted`, "Just now");
            }
            
            // If current session is this student, clear it
            const session = getCurrentSession();
            if (session && session.user && session.user.registerNumber === regNo) {
                logout();
            }
        }
        return result;
    } catch (e) {
        console.error('deleteStudent failed:', e);
        return { success: false, message: e.message };
    }
}

export async function uploadProject(projectMetadata, fileObj, author) {
    try {
        const fd = new FormData();
        fd.append('file', fileObj);
        fd.append('title', projectMetadata.title);
        fd.append('abstract', projectMetadata.abstract);
        fd.append('category', projectMetadata.category || projectMetadata.domain || 'General');
        fd.append('visibility', projectMetadata.visibility || 'Public');

        const res = await fetch('/api/projects/upload', {
            method: 'POST',
            body: fd
        });
        const result = await res.json();
        
        if (result.success) {
            await logActivity('upload', `<strong>${author.name}</strong> uploaded <strong>${projectMetadata.title}</strong>`, "Just now");
        }
        return result;
    } catch (e) {
        console.error('uploadProject failed:', e);
        return { success: false, message: e.message || 'Server error' };
    }
}

export async function deleteProject(projectId) {
    try {
        // Fetch projects to find title for logging
        const projects = await getProjects();
        const project = projects.find(p => p.id === projectId);

        const res = await fetch('/api/projects', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId })
        });
        const result = await res.json();
        
        if (result.success && project) {
            await logActivity('delete', `Project <strong>${project.title}</strong> was deleted`, "Just now");
        }
        return result;
    } catch (e) {
        console.error('deleteProject failed:', e);
        return { success: false, message: e.message };
    }
}

export async function toggleBookmark(projectId, regNo) {
    try {
        const res = await fetch('/api/projects/interact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'bookmark', projectId, regNo })
        });
        const result = await res.json();
        
        if (result.success) {
            // Update current session student profile to sync bookmarks locally
            const session = getCurrentSession();
            if (session && session.role === 'student' && session.user.registerNumber === regNo) {
                session.user = result.student;
                setLocal('session', session);
            }
        }
        return result;
    } catch (e) {
        console.error('toggleBookmark failed:', e);
        return { success: false, message: e.message };
    }
}

export async function getActivityLog() {
    try {
        const res = await fetch('/api/activity');
        return await res.json();
    } catch (e) {
        console.error('getActivityLog failed:', e);
        return [];
    }
}

export async function logActivity(type, text, time) {
    try {
        await fetch('/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, text, time })
        });
    } catch (e) {
        console.error('logActivity failed:', e);
    }
}

export async function updateProject(projectId, updatedData) {
    try {
        const res = await fetch('/api/projects', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, updatedData })
        });
        return await res.json();
    } catch (e) {
        console.error('updateProject failed:', e);
        return { success: false, message: e.message };
    }
}

export async function incrementProjectDownloads(projectId) {
    try {
        const res = await fetch('/api/projects/interact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'download', projectId })
        });
        return await res.json();
    } catch (e) {
        console.error('incrementProjectDownloads failed:', e);
        return { success: false };
    }
}

export async function incrementProjectViews(projectId) {
    try {
        const res = await fetch('/api/projects/interact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'view', projectId })
        });
        return await res.json();
    } catch (e) {
        console.error('incrementProjectViews failed:', e);
        return { success: false };
    }
}
