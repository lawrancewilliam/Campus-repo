const isClient = typeof window !== 'undefined';

function get(key, defaultValue = null) {
    if (!isClient) return defaultValue;
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
}

function set(key, val) {
    if (isClient) {
        localStorage.setItem(key, JSON.stringify(val));
    }
}

// Initialize default mock data if empty
if (isClient) {
    if (!localStorage.getItem('students')) {
        // Initial mock student
        const mockStudent = {
            name: "Rahul",
            email: "rahul@sonatech.ac.in",
            registerNumber: "21MCA001",
            password: "password123",
            department: "MCA",
            academicYear: "3rd Year",
            bio: "Passionate Full Stack Developer interested in AI and Web Technologies. Always eager to learn new skills.",
            joinedDate: "Aug 2023",
            bookmarkedProjectIds: [101, 102]
        };
        localStorage.setItem('students', JSON.stringify([mockStudent]));
    }

    if (!localStorage.getItem('projects')) {
        const mockProjects = [
            { id: 101, title: "AI Attendance System", category: "AI", views: 150, stars: 20, downloadsCount: 75, authorName: "Rahul", authorRegNo: "21MCA001", dept: "CSE", visibility: "Public", abstract: "A facial recognition based attendance system.", date: "2 days ago", fileName: "ai_attendance.zip", featured: true, recommended: true, homePage: true, favorite: false },
            { id: 102, title: "E-Commerce Platform", category: "Web Dev", views: 230, stars: 45, downloadsCount: 115, authorName: "Rahul", authorRegNo: "21MCA001", dept: "CSE", visibility: "Public", abstract: "A secure e-commerce application using modern frameworks.", date: "5 days ago", fileName: "ecommerce_src.zip", featured: true, recommended: false, homePage: true, favorite: true },
            { id: 103, title: "Traffic Control System", category: "IoT", views: 89, stars: 12, downloadsCount: 44, authorName: "Rahul", authorRegNo: "21MCA001", dept: "ECE", visibility: "Private", abstract: "Smart traffic signal controlling using IoT components.", date: "1 week ago", fileName: "traffic_iot.zip", featured: false, recommended: true, homePage: false, favorite: false },
            { id: 104, title: "Hospital Management", category: "Web Dev", views: 112, stars: 8, downloadsCount: 56, authorName: "Rahul", authorRegNo: "21MCA001", dept: "IT", visibility: "Public", abstract: "General hospital management and patient scheduling application.", date: "2 weeks ago", fileName: "hospital_mgmt.zip", featured: false, recommended: false, homePage: false, favorite: false }
        ];
        localStorage.setItem('projects', JSON.stringify(mockProjects));
    }

    if (!localStorage.getItem('activity_log')) {
        const mockActivity = [
            { type: "upload", text: '<strong>Rahul</strong> uploaded <strong>AI Attendance System</strong>', time: "2 days ago" },
            { type: "star", text: '<strong>Priya</strong> starred <strong>E-Commerce Platform</strong>', time: "5 days ago" },
            { type: "edit", text: '<strong>Rahul</strong> updated <strong>Traffic Control System</strong>', time: "1 week ago" },
            { type: "join", text: '<strong>Rahul</strong> joined CampusRepo', time: "Aug 2023" }
        ];
        localStorage.setItem('activity_log', JSON.stringify(mockActivity));
    }
}

export function registerStudent(student) {
    const students = get('students', []);
    const exists = students.some(s => s.registerNumber === student.registerNumber || s.email === student.email);
    if (exists) {
        return { success: false, message: "Register Number or Email already exists." };
    }
    const newStudent = {
        ...student,
        bio: student.bio || "No bio yet.",
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        bookmarkedProjectIds: []
    };
    students.push(newStudent);
    set('students', students);

    // Add activity log
    logActivity('join', `<strong>${student.name}</strong> joined CampusRepo`, "Just now");

    return { success: true };
}

export function loginUser(username, password) {
    // 1. Admin login check
    if (username === '12345' && password === 'William26') {
        const session = { role: 'admin', user: { name: 'Admin', registerNumber: '12345' } };
        set('current_session', session);
        return { success: true, role: 'admin' };
    }

    // 2. Student login check
    const students = get('students', []);
    const student = students.find(s => (s.registerNumber === username || s.email === username) && s.password === password);
    if (student) {
        const session = { role: 'student', user: student };
        set('current_session', session);
        return { success: true, role: 'student' };
    }

    return { success: false, message: "Invalid register number/email or password." };
}

export function getCurrentSession() {
    return get('current_session', null);
}

export function logout() {
    if (isClient) {
        localStorage.removeItem('current_session');
    }
}

export function getStudents() {
    return get('students', []);
}

export function getProjects() {
    return get('projects', []);
}

export function getStudentProjects(regNo) {
    const projects = get('projects', []);
    return projects.filter(p => p.authorRegNo === regNo);
}

export function updateStudentProfile(regNo, updatedData) {
    const students = get('students', []);
    const index = students.findIndex(s => s.registerNumber === regNo);
    if (index !== -1) {
        students[index] = { ...students[index], ...updatedData };
        set('students', students);

        // Update current session if the profile is for the logged-in student
        const session = getCurrentSession();
        if (session && session.role === 'student' && session.user.registerNumber === regNo) {
            session.user = students[index];
            set('current_session', session);
        }
        return { success: true };
    }
    return { success: false, message: "Student not found." };
}

export function deleteStudent(regNo) {
    let students = get('students', []);
    const student = students.find(s => s.registerNumber === regNo);
    students = students.filter(s => s.registerNumber !== regNo);
    set('students', students);

    // Delete student's projects
    let projects = get('projects', []);
    projects = projects.filter(p => p.authorRegNo !== regNo);
    set('projects', projects);

    if (student) {
        logActivity('delete', `Student account <strong>${student.name}</strong> was deleted`, "Just now");
    }

    // If current session is this student, clear it
    const session = getCurrentSession();
    if (session && session.user && session.user.registerNumber === regNo) {
        logout();
    }

    return { success: true };
}

export function uploadProject(project, author) {
    const projects = get('projects', []);
    const newProject = {
        id: Date.now(),
        title: project.title,
        abstract: project.abstract,
        category: project.domain || project.category || "General",
        visibility: project.visibility || "Public",
        authorName: author.name,
        authorRegNo: author.registerNumber,
        dept: author.department || "CSE",
        views: 0,
        stars: 0,
        downloadsCount: 0,
        date: "Just now",
        fileName: project.fileName || "source_code.zip",
        featured: false,
        recommended: false,
        favorite: false,
        homePage: false
    };
    projects.unshift(newProject);
    set('projects', projects);

    logActivity('upload', `<strong>${author.name}</strong> uploaded <strong>${project.title}</strong>`, "Just now");

    return { success: true, project: newProject };
}

export function deleteProject(projectId) {
    let projects = get('projects', []);
    const project = projects.find(p => p.id === projectId);
    projects = projects.filter(p => p.id !== projectId);
    set('projects', projects);

    if (project) {
        logActivity('delete', `Project <strong>${project.title}</strong> was deleted`, "Just now");
    }

    return { success: true };
}

export function toggleBookmark(projectId, regNo) {
    const students = get('students', []);
    const index = students.findIndex(s => s.registerNumber === regNo);
    if (index !== -1) {
        const bookmarks = students[index].bookmarkedProjectIds || [];
        const bIndex = bookmarks.indexOf(projectId);
        if (bIndex === -1) {
            bookmarks.push(projectId);
        } else {
            bookmarks.splice(bIndex, 1);
        }
        students[index].bookmarkedProjectIds = bookmarks;
        set('students', students);

        // Update current session
        const session = getCurrentSession();
        if (session && session.role === 'student' && session.user.registerNumber === regNo) {
            session.user = students[index];
            set('current_session', session);
        }
        return { success: true, bookmarked: bIndex === -1 };
    }
    return { success: false, message: "Student not found." };
}

export function getActivityLog() {
    return get('activity_log', []);
}

export function logActivity(type, text, time) {
    const log = get('activity_log', []);
    log.unshift({ type, text, time });
    set('activity_log', log.slice(0, 50)); // Keep last 50 activities
}

export function updateProject(projectId, updatedData) {
    const projects = get('projects', []);
    const index = projects.findIndex(p => p.id === projectId);
    if (index !== -1) {
        projects[index] = { ...projects[index], ...updatedData };
        set('projects', projects);
        return { success: true, project: projects[index] };
    }
    return { success: false, message: "Project not found." };
}

export function incrementProjectDownloads(projectId) {
    const projects = get('projects', []);
    const index = projects.findIndex(p => p.id === projectId);
    if (index !== -1) {
        projects[index].downloadsCount = (projects[index].downloadsCount || 0) + 1;
        set('projects', projects);
        return { success: true, count: projects[index].downloadsCount };
    }
    return { success: false };
}

export function incrementProjectViews(projectId) {
    const projects = get('projects', []);
    const index = projects.findIndex(p => p.id === projectId);
    if (index !== -1) {
        projects[index].views = (projects[index].views || 0) + 1;
        set('projects', projects);
        return { success: true, count: projects[index].views };
    }
    return { success: false };
}
