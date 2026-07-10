<script>
    import { onMount } from 'svelte';
    import { getCurrentSession, getStudents, getProjects, deleteStudent, updateStudentProfile, updateProject, deleteProject, incrementProjectDownloads } from '$lib/storage.js';
    import { toastState } from '$lib/toasts.svelte.js';

    let session = $state(null);
    let students = $state([]);
    let projects = $state([]);
    let mounted = $state(false);

    // Search and selected student register number
    let searchQuery = $state('');
    let selectedStudentRegNo = $state(null);

    // Edit state
    let isEditing = $state(false);
    let editForm = $state({
        name: '',
        email: '',
        department: '',
        academicYear: '',
        bio: ''
    });

    // Project view modal state
    let isViewModalOpen = $state(false);
    let projectToView = $state(null);

    // Derived states
    let selectedStudent = $derived(students.find(s => s.registerNumber === selectedStudentRegNo) || null);
    let selectedStudentProjects = $derived(
        selectedStudent ? projects.filter(p => p.authorRegNo === selectedStudent.registerNumber) : []
    );

    let totalProjects = $derived(selectedStudentProjects.length);
    let totalViews = $derived(selectedStudentProjects.reduce((sum, p) => sum + (p.views || 0), 0));
    let totalStars = $derived(selectedStudentProjects.reduce((sum, p) => sum + (p.stars || 0), 0));
    let totalDownloads = $derived(selectedStudentProjects.reduce((sum, p) => sum + (p.downloadsCount || 0), 0));

    let filteredStudents = $derived(
        students.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.registerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.department.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    async function loadData() {
        session = getCurrentSession();
        students = await getStudents();
        projects = await getProjects();
    }

    onMount(() => {
        loadData();
        mounted = true;
    });

    function selectStudent(student) {
        selectedStudentRegNo = student.registerNumber;
        isEditing = false;
    }

    async function handleDeleteStudent(regNo, name) {
        if (confirm(`Are you sure you want to delete ${name}'s account? This will permanently delete their student profile and all of their uploaded projects.`)) {
            await deleteStudent(regNo);
            toastState.show(`Student account "${name}" has been deleted.`, "success", "✅ Account Deleted");
            selectedStudentRegNo = null;
            await loadData();
        }
    }

    function startEditing() {
        if (!selectedStudent) return;
        editForm = {
            name: selectedStudent.name,
            email: selectedStudent.email,
            department: selectedStudent.department || 'CSE',
            academicYear: selectedStudent.academicYear || '3rd Year',
            bio: selectedStudent.bio || ''
        };
        isEditing = true;
    }

    function cancelEditing() {
        isEditing = false;
    }

    async function saveStudentDetails() {
        if (!editForm.name || !editForm.email) {
            alert("Name and email are required.");
            return;
        }

        const res = await updateStudentProfile(selectedStudentRegNo, {
            name: editForm.name,
            email: editForm.email,
            department: editForm.department,
            academicYear: editForm.academicYear,
            bio: editForm.bio
        });

        if (res.success) {
            toastState.show(`Profile details for ${editForm.name} updated successfully.`, "success", "✅ Profile Updated");
            isEditing = false;
            await loadData();
        } else {
            alert(res.message || "Failed to update profile.");
        }
    }

    async function handleToggleProjectFlag(projectId, flagKey) {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        
        const updatedValue = !project[flagKey];
        const res = await updateProject(projectId, { [flagKey]: updatedValue });
        
        if (res.success) {
            const flagName = flagKey === 'recommended' ? 'Recommended' : (flagKey === 'featured' ? 'Featured' : 'Home Page');
            const status = updatedValue ? 'enabled' : 'disabled';
            toastState.show(`Project "${project.title}" ${flagName} status ${status}.`, "success", "✅ Status Updated");
            await loadData();
        } else {
            alert("Failed to update project status.");
        }
    }

    async function handleDeleteProject(projectId, title) {
        if (confirm(`Are you sure you want to delete project "${title}"? This action cannot be undone.`)) {
            await deleteProject(projectId);
            toastState.show(`Project "${title}" has been deleted.`, "success", "✅ Project Deleted");
            await loadData();
        }
    }

    async function handleDownload(project) {
        await incrementProjectDownloads(project.id);
        toastState.show(`File "${project.fileName || 'source_code.zip'}" downloaded.`, "success", "✅ File Downloaded");
        await loadData();
    }

    function openViewModal(project) {
        projectToView = project;
        isViewModalOpen = true;
    }

    function closeViewModal() {
        isViewModalOpen = false;
        projectToView = null;
    }
</script>

<svelte:head>
    <title>CampusRepo — Manage Users & Projects</title>
</svelte:head>

{#if mounted && session && session.role === 'admin'}
<main class="directory-container">
    <div class="directory-layout">
        
        <!-- LEFT: Students List -->
        <aside class="students-list-panel">
            <div class="panel-header">
                <h3>Users Management</h3>
                <div class="search-box">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" placeholder="Search students..." bind:value={searchQuery} />
                </div>
            </div>
            
            <div class="students-list">
                {#each filteredStudents as student (student.registerNumber)}
                    <button class="student-item" class:active={selectedStudentRegNo === student.registerNumber} onclick={() => selectStudent(student)}>
                        <div class="student-avatar">{student.name ? student.name[0].toUpperCase() : 'S'}</div>
                        <div class="student-meta">
                            <h4>{student.name}</h4>
                            <p>{student.registerNumber} • {student.department}</p>
                            <span class="projects-badge">
                                <i class="fa-solid fa-code-branch"></i> 
                                {projects.filter(p => p.authorRegNo === student.registerNumber).length} projects
                            </span>
                        </div>
                        <i class="fa-solid fa-chevron-right arrow-icon"></i>
                    </button>
                {:else}
                    <p class="empty-text">No students found.</p>
                {/each}
            </div>
        </aside>

        <!-- RIGHT: Selected Student Detail & Projects Moderation -->
        <section class="student-detail-panel">
            {#if selectedStudent}
                <div class="detail-card">
                    <header class="detail-header">
                        <div class="profile-summary">
                            <div class="detail-avatar">{selectedStudent.name ? selectedStudent.name[0].toUpperCase() : 'S'}</div>
                            <div>
                                <h2>{selectedStudent.name}</h2>
                                <p class="role-badge"><i class="fa-solid fa-user-graduate"></i> Student Profile</p>
                            </div>
                        </div>
                        
                        <div class="header-actions">
                            {#if !isEditing}
                                <button class="btn-edit" onclick={startEditing}>
                                    <i class="fa-solid fa-user-pen"></i> Edit Profile
                                </button>
                                <button class="btn-danger" onclick={() => handleDeleteStudent(selectedStudent.registerNumber, selectedStudent.name)}>
                                    <i class="fa-solid fa-trash"></i> Delete Account
                                </button>
                            {:else}
                                <button class="btn-cancel" onclick={cancelEditing}>Cancel</button>
                                <button class="btn-save" onclick={saveStudentDetails}>Save Details</button>
                            {/if}
                        </div>
                    </header>

                    <div class="divider"></div>

                    <!-- Selected Student Statistics Panel -->
                    <div class="stats-section-grid">
                        <div class="mini-stat-card yellow-border">
                            <span class="val">{totalProjects}</span>
                            <span class="lbl">Projects</span>
                        </div>
                        <div class="mini-stat-card blue-border">
                            <span class="val">{totalViews}</span>
                            <span class="lbl">Views</span>
                        </div>
                        <div class="mini-stat-card green-border">
                            <span class="val">{totalStars}</span>
                            <span class="lbl">Favorites</span>
                        </div>
                        <div class="mini-stat-card red-border">
                            <span class="val">{totalDownloads}</span>
                            <span class="lbl">Downloads</span>
                        </div>
                    </div>

                    <!-- Profile Information Section / Form Edit -->
                    <div class="info-details-form">
                        <h3>Student Information</h3>
                        {#if !isEditing}
                            <div class="meta-grid">
                                <div class="meta-item">
                                    <span class="meta-label">Register Number</span>
                                    <span class="meta-value">{selectedStudent.registerNumber}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">Department</span>
                                    <span class="meta-value">{selectedStudent.department}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">Academic Year</span>
                                    <span class="meta-value">{selectedStudent.academicYear || '3rd Year'}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">Email Address</span>
                                    <span class="meta-value">{selectedStudent.email}</span>
                                </div>
                                <div class="meta-item full-width-meta">
                                    <span class="meta-label">Joined Date</span>
                                    <span class="meta-value">{selectedStudent.joinedDate || 'Aug 2023'}</span>
                                </div>
                            </div>

                            <div class="bio-section" style="margin-top: 1.5rem;">
                                <h4>Biography</h4>
                                <p class="bio-text">{selectedStudent.bio || 'No bio written yet.'}</p>
                            </div>
                        {:else}
                            <div class="form-fields-grid">
                                <div class="field-item">
                                    <label for="edit-student-name">Full Name</label>
                                    <input id="edit-student-name" type="text" class="dark-input" bind:value={editForm.name} />
                                </div>
                                <div class="field-item">
                                    <label for="edit-student-email">Email Address</label>
                                    <input id="edit-student-email" type="email" class="dark-input" bind:value={editForm.email} />
                                </div>
                                <div class="field-item">
                                    <label for="edit-student-dept">Department</label>
                                    <select id="edit-student-dept" class="dark-input" bind:value={editForm.department}>
                                        <option>CSE</option>
                                        <option>MCA</option>
                                        <option>ECE</option>
                                        <option>IT</option>
                                        <option>EEE</option>
                                        <option>MECH</option>
                                        <option>CIVIL</option>
                                    </select>
                                </div>
                                <div class="field-item">
                                    <label for="edit-student-year">Academic Year</label>
                                    <select id="edit-student-year" class="dark-input" bind:value={editForm.academicYear}>
                                        <option>1st Year</option>
                                        <option>2nd Year</option>
                                        <option>3rd Year</option>
                                        <option>4th Year</option>
                                    </select>
                                </div>
                                <div class="field-item full-width">
                                    <label for="edit-student-bio">Biography</label>
                                    <textarea id="edit-student-bio" class="dark-input" rows="4" bind:value={editForm.bio}></textarea>
                                </div>
                            </div>
                        {/if}
                    </div>

                    <div class="divider"></div>

                    <!-- Student Uploads & Moderation Panel -->
                    <div class="uploads-section">
                        <h3>Uploaded Projects & Moderation ({selectedStudentProjects.length})</h3>
                        <div class="project-list">
                            {#each selectedStudentProjects as project (project.id)}
                                <div class="project-item">
                                    <div class="project-info-header">
                                        <div class="project-icon"><i class="fa-solid fa-file-code"></i></div>
                                        <div class="project-info-main">
                                            <h4>{project.title}</h4>
                                            <p>{project.category} • Uploaded {project.date || 'Recently'} • <span class="font-mono-filename">{project.fileName || 'source_code.zip'}</span></p>
                                            <div class="project-item-stats">
                                                <span><i class="fa-solid fa-eye"></i> {project.views || 0} views</span>
                                                <span><i class="fa-solid fa-star"></i> {project.stars || 0} stars</span>
                                                <span><i class="fa-solid fa-download"></i> {project.downloadsCount || 0} downloads</span>
                                            </div>
                                        </div>
                                        <div class="visibility-status">
                                            <span class="badge {project.visibility === 'Private' ? 'private-badge' : 'public-badge'}">{project.visibility}</span>
                                        </div>
                                    </div>

                                    <!-- Switch Toggles Row -->
                                    <div class="moderation-toggles-row">
                                        <div class="toggle-group">
                                            <span class="toggle-label"><i class="fa-solid fa-circle-check text-yellow-500"></i> Recommended</span>
                                            <label class="switch" title="Toggle recommendation flag">
                                                <input type="checkbox" checked={project.recommended} onchange={() => handleToggleProjectFlag(project.id, 'recommended')} />
                                                <span class="slider"></span>
                                            </label>
                                        </div>
                                        <div class="toggle-group">
                                            <span class="toggle-label"><i class="fa-solid fa-trophy text-blue-500"></i> Featured</span>
                                            <label class="switch" title="Toggle featured flag">
                                                <input type="checkbox" checked={project.featured} onchange={() => handleToggleProjectFlag(project.id, 'featured')} />
                                                <span class="slider"></span>
                                            </label>
                                        </div>
                                        <div class="toggle-group">
                                            <span class="toggle-label"><i class="fa-solid fa-house-chimney text-emerald-500"></i> Home Page</span>
                                            <label class="switch" title="Toggle home page project flag">
                                                <input type="checkbox" checked={project.homePage} onchange={() => handleToggleProjectFlag(project.id, 'homePage')} />
                                                <span class="slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    <!-- Actions Row -->
                                    <div class="project-actions-row">
                                        <button class="btn-action btn-view" onclick={() => openViewModal(project)} title="View Abstract/Details">
                                            <i class="fa-solid fa-magnifying-glass-plus"></i> View Details
                                        </button>
                                        <button class="btn-action btn-download" onclick={() => handleDownload(project)} title="Download Source Zip">
                                            <i class="fa-solid fa-download"></i> Download File
                                        </button>
                                        <button class="btn-action btn-delete-project" onclick={() => handleDeleteProject(project.id, project.title)} title="Delete Project Permanently">
                                            <i class="fa-solid fa-trash-can"></i> Delete Project
                                        </button>
                                    </div>
                                </div>
                            {:else}
                                <p class="empty-text">This student has not uploaded any projects yet.</p>
                            {/each}
                        </div>
                    </div>
                </div>
            {:else}
                <div class="empty-detail-state">
                    <i class="fa-solid fa-users-gear"></i>
                    <h3>Select a Student Profile</h3>
                    <p>Select any student from the left directory to view full profile credentials, update accounts, review uploads, and moderate recommendations.</p>
                </div>
            {/if}
        </section>

    </div>
</main>
{/if}

<!-- VIEW PROJECT DETAILS MODAL -->
{#if isViewModalOpen && projectToView}
    <div class="modal-backdrop" onclick={closeViewModal} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && closeViewModal()}>
        <div class="modal-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <header class="modal-header">
                <h3>{projectToView.title}</h3>
                <button class="close-btn" onclick={closeViewModal} aria-label="Close modal">&times;</button>
            </header>
            <div class="modal-body scrollable">
                <div class="meta-pills">
                    <span class="category-tag">{projectToView.category}</span>
                    <span class="badge {projectToView.visibility === 'Private' ? 'private-badge' : 'public-badge'}">{projectToView.visibility}</span>
                </div>
                
                <div class="section-block">
                    <h4>Abstract / Description</h4>
                    <p class="abstract-content">{projectToView.abstract || 'No description available for this project.'}</p>
                </div>

                <div class="section-block grid-2">
                    <div class="stat-info-box">
                        <span class="stat-lbl">Views</span>
                        <span class="stat-val">{projectToView.views || 0}</span>
                    </div>
                    <div class="stat-info-box">
                        <span class="stat-lbl">Stars</span>
                        <span class="stat-val">{projectToView.stars || 0}</span>
                    </div>
                    <div class="stat-info-box">
                        <span class="stat-lbl">Downloads</span>
                        <span class="stat-val">{projectToView.downloadsCount || 0}</span>
                    </div>
                    <div class="stat-info-box">
                        <span class="stat-lbl">File Name</span>
                        <span class="stat-val font-mono-filename">{projectToView.fileName || 'source_code.zip'}</span>
                    </div>
                </div>
            </div>
            <footer class="modal-footer">
                <button class="btn-cancel" onclick={closeViewModal}>Close</button>
                <button class="btn-save" onclick={() => { closeViewModal(); handleDownload(projectToView); }}><i class="fa-solid fa-download"></i> Download Code</button>
            </footer>
        </div>
    </div>
{/if}

<style>
    .directory-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
        color: var(--text-main);
        font-family: 'Inter', sans-serif;
    }

    .directory-layout {
        display: grid;
        grid-template-columns: 380px 1fr;
        gap: 2rem;
        height: calc(100vh - 120px);
        min-height: 550px;
    }

    /* Left Panel: Students List */
    .students-list-panel {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    .students-list-panel .panel-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--border);
    }
    .students-list-panel h3 { margin: 0 0 1rem; font-size: 1.15rem; color: var(--text-main); font-weight: 700; }
    
    .search-box {
        display: flex;
        align-items: center;
        background: var(--bg-input);
        border: 1px solid var(--border);
        padding: 0.6rem 1rem;
        border-radius: 0.5rem;
        gap: 0.5rem;
    }
    .search-box i { color: var(--text-muted); font-size: 0.9rem; }
    .search-box input {
        background: none; border: none; outline: none;
        color: var(--text-main); font-size: 0.88rem; width: 100%;
    }

    .students-list {
        flex: 1;
        overflow-y: auto;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .student-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        background: none;
        border: 1px solid transparent;
        color: inherit;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s;
        width: 100%;
        box-sizing: border-box;
    }
    .student-item:hover {
        background: rgba(255, 255, 255, 0.03);
        border-color: var(--border);
    }
    .student-item.active {
        background: rgba(59, 130, 246, 0.08);
        border-color: var(--primary);
    }
    
    .student-avatar {
        width: 40px; height: 40px;
        background: linear-gradient(135deg, var(--primary), #8b5cf6);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; color: white; font-size: 0.95rem;
        flex-shrink: 0;
    }
    .student-item.active .student-avatar {
        background: linear-gradient(135deg, var(--accent), #ef4444);
    }

    .student-meta { flex: 1; min-width: 0; }
    .student-meta h4 { margin: 0 0 4px; font-size: 0.9rem; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .student-meta p { margin: 0 0 4px; font-size: 0.75rem; color: var(--text-muted); }
    
    .projects-badge {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: 0.7rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border);
        color: var(--text-muted);
        padding: 1px 6px;
        border-radius: 4px;
        font-weight: 500;
    }
    
    .arrow-icon { font-size: 0.8rem; color: var(--text-muted); opacity: 0; transition: opacity 0.2s; }
    .student-item:hover .arrow-icon, .student-item.active .arrow-icon { opacity: 1; }

    /* Right Panel: Detail view */
    .student-detail-panel {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        overflow-y: auto;
    }

    .detail-card { padding: 2rem; }
    .detail-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    
    .profile-summary { display: flex; align-items: center; gap: 1.25rem; }
    .detail-avatar {
        width: 70px; height: 70px;
        background: linear-gradient(135deg, var(--accent), #ef4444);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-weight: 800; color: white; font-size: 1.8rem;
    }
    .profile-summary h2 { margin: 0 0 0.25rem; font-size: 1.6rem; color: var(--text-main); }
    .role-badge { 
        display: inline-flex; 
        align-items: center; 
        gap: 4px; 
        background: rgba(251, 191, 36, 0.1); 
        color: var(--accent); 
        padding: 2px 8px; 
        border-radius: 4px; 
        font-size: 0.75rem; 
        font-weight: 700; 
        text-transform: uppercase; 
    }

    .header-actions { display: flex; gap: 0.5rem; }
    .btn-edit {
        background: rgba(251, 191, 36, 0.1);
        border: 1px solid rgba(251, 191, 36, 0.2);
        color: var(--accent);
        padding: 0.5rem 1rem; border-radius: 0.5rem;
        font-size: 0.85rem; font-weight: 600; cursor: pointer;
        display: flex; align-items: center; gap: 0.4rem;
        transition: all 0.2s;
    }
    .btn-edit:hover { background: var(--accent); color: black; border-color: var(--accent); }

    .divider { height: 1px; background: var(--border); margin: 1.5rem 0; }

    .btn-danger {
        background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);
        color: var(--danger);
        padding: 0.5rem 1rem; border-radius: 0.5rem;
        font-size: 0.85rem; font-weight: 600; cursor: pointer;
        display: flex; align-items: center; gap: 0.4rem;
        transition: background 0.2s;
    }
    .btn-danger:hover { background: var(--danger); color: white; }

    .btn-cancel {
        background: transparent; border: 1px solid var(--border);
        color: var(--text-muted);
        padding: 0.5rem 1rem; border-radius: 0.5rem;
        font-size: 0.85rem; font-weight: 600; cursor: pointer;
    }
    .btn-cancel:hover { color: var(--text-main); border-color: var(--text-muted); }

    .btn-save {
        background: var(--success); border: none;
        color: white;
        padding: 0.5rem 1rem; border-radius: 0.5rem;
        font-size: 0.85rem; font-weight: 600; cursor: pointer;
    }
    .btn-save:hover { opacity: 0.9; }

    /* Student specific statistics */
    .stats-section-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }
    .mini-stat-card {
        background: var(--bg-panel);
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        padding: 1rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    .yellow-border { border-top: 3px solid var(--accent); }
    .blue-border { border-top: 3px solid var(--primary); }
    .green-border { border-top: 3px solid var(--success); }
    .red-border { border-top: 3px solid var(--danger); }
    
    .mini-stat-card .val {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--text-main);
    }
    .mini-stat-card .lbl {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-weight: 500;
        text-transform: uppercase;
    }

    /* Meta Grid / Form Fields */
    .meta-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
    }
    .meta-item { background: var(--bg-panel); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border); }
    .meta-label { display: block; font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 6px; }
    .meta-value { font-size: 0.95rem; color: var(--text-main); font-weight: 500; }
    .full-width-meta { grid-column: span 2; }

    .bio-section h4 { font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin: 0 0 0.5rem; }
    .bio-text { color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; margin: 0; background: var(--bg-panel); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border); }

    /* Form edit styles */
    .form-fields-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.25rem;
    }
    .field-item { display: flex; flex-direction: column; gap: 0.5rem; }
    .field-item label { font-size: 0.82rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
    .field-item.full-width { grid-column: span 2; }
    .dark-input {
        width: 100%;
        background: var(--bg-input);
        border: 1px solid var(--border);
        color: var(--text-main);
        padding: 0.7rem 0.9rem;
        border-radius: 0.5rem;
        font-family: inherit;
        box-sizing: border-box;
    }
    .dark-input:focus { outline: none; border-color: var(--primary); }

    /* Uploads and Moderation list */
    .uploads-section h3 { font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin: 0 0 1rem; }
    .project-list { display: flex; flex-direction: column; gap: 1rem; }
    
    .project-item {
        background: var(--bg-panel); 
        padding: 1.25rem; 
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        gap: 1rem;
        transition: border-color 0.2s;
    }
    .project-item:hover {
        border-color: rgba(251, 191, 36, 0.3);
    }
    
    .project-info-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
    }
    .project-icon { 
        width: 40px; height: 40px; 
        border-radius: 0.5rem; 
        background: var(--bg-card); 
        display: flex; align-items: center; justify-content: center; 
        color: var(--primary); 
        font-size: 1.2rem;
        flex-shrink: 0;
        border: 1px solid var(--border);
    }
    .project-info-main { flex: 1; min-width: 0; }
    .project-info-main h4 { margin: 0 0 4px; font-size: 1rem; font-weight: 600; color: var(--text-main); }
    .project-info-main p { margin: 0 0 6px; font-size: 0.8rem; color: var(--text-muted); }
    .font-mono-filename { font-family: monospace; font-size: 0.75rem; color: var(--accent); background: rgba(251, 191, 36, 0.05); padding: 1px 4px; border-radius: 3px; }
    
    .project-item-stats {
        display: flex;
        gap: 0.75rem;
        font-size: 0.75rem;
        color: var(--text-muted);
    }
    .project-item-stats span { display: flex; align-items: center; gap: 3px; }

    .visibility-status { flex-shrink: 0; }
    .badge { padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; }
    .private-badge { background: rgba(239, 68, 68, 0.15); color: var(--danger); }
    .public-badge { background: rgba(16, 185, 129, 0.15); color: var(--success); }

    /* Moderation Toggles CSS */
    .moderation-toggles-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
        background: var(--bg-card);
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        border: 1px solid var(--border);
    }
    .toggle-group {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .toggle-label {
        font-size: 0.78rem;
        color: var(--text-muted);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    
    /* Toggle Switch Styling */
    .switch {
        position: relative;
        display: inline-block;
        width: 38px;
        height: 20px;
    }
    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    .slider {
        position: absolute;
        cursor: pointer;
        top: 0; left: 0; right: 0; bottom: 0;
        background-color: rgba(255, 255, 255, 0.08);
        border: 1px solid var(--border);
        transition: .2s;
        border-radius: 20px;
    }
    .slider:before {
        position: absolute;
        content: "";
        height: 12px;
        width: 12px;
        left: 3px;
        bottom: 3px;
        background-color: var(--text-muted);
        transition: .2s;
        border-radius: 50%;
    }
    input:checked + .slider {
        background-color: var(--accent);
        border-color: var(--accent);
    }
    input:checked + .slider:before {
        transform: translateX(18px);
        background-color: #000000;
    }

    /* Actions Row CSS */
    .project-actions-row {
        display: flex;
        gap: 0.5rem;
    }
    .btn-action {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        padding: 0.5rem 0.75rem;
        font-size: 0.78rem;
        font-weight: 600;
        border-radius: 0.35rem;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-main);
    }
    .btn-view:hover { background: rgba(255, 255, 255, 0.05); border-color: var(--text-muted); }
    .btn-download { color: var(--primary); }
    .btn-download:hover { background: rgba(59, 130, 246, 0.08); border-color: var(--primary); }
    .btn-delete-project { color: var(--danger); }
    .btn-delete-project:hover { background: rgba(239, 68, 68, 0.08); border-color: var(--danger); }

    /* Empty states */
    .empty-text { color: var(--text-muted); font-size: 0.85rem; padding: 1.5rem; text-align: center; margin: 0; }
    
    .empty-detail-state {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        height: 100%; text-align: center; color: var(--text-muted); padding: 4rem 2rem;
    }
    .empty-detail-state i { font-size: 4rem; color: var(--border); margin-bottom: 1.5rem; }
    .empty-detail-state h3 { font-size: 1.3rem; color: var(--text-main); margin: 0 0 0.5rem; }
    .empty-detail-state p { font-size: 0.9rem; max-width: 420px; line-height: 1.6; margin: 0; }

    /* Modal Styles */
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(4px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
    }
    .modal-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        width: 100%;
        max-width: 550px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.6);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: modal-scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modal-scale-in {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    .modal-header {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .modal-header h3 { margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-main); }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; }
    .close-btn:hover { color: var(--text-main); }

    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .modal-body.scrollable { max-height: 60vh; overflow-y: auto; }
    
    .meta-pills { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
    .category-tag {
        background: rgba(59, 130, 246, 0.1);
        color: var(--primary);
        padding: 0.25rem 0.6rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    .section-block h4 { font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase; margin: 0 0 0.5rem; font-weight: 600; }
    .abstract-content { font-size: 0.9rem; color: var(--text-main); line-height: 1.6; margin: 0; background: var(--bg-panel); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border); white-space: pre-wrap; }

    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .stat-info-box { background: var(--bg-panel); border: 1px solid var(--border); padding: 0.75rem 1rem; border-radius: 0.5rem; display: flex; flex-direction: column; gap: 2px; }
    .stat-lbl { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 500; }
    .stat-val { font-size: 1.1rem; color: var(--text-main); font-weight: 700; }

    .modal-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--border);
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        background: var(--bg-panel);
    }

    @media (max-width: 850px) {
        .directory-layout { grid-template-columns: 1fr; height: auto; min-height: auto; }
        .students-list-panel { height: 350px; }
        .stats-section-grid { grid-template-columns: repeat(2, 1fr); }
        .moderation-toggles-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 576px) {
        .directory-container { padding: 1.5rem 1rem; }
        .stats-section-grid { grid-template-columns: 1fr; }
        .grid-2 { grid-template-columns: 1fr; }
        .detail-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
        .header-actions { width: 100%; display: flex; gap: 0.5rem; }
        .header-actions button, .header-actions a { flex: 1; text-align: center; justify-content: center; }
        .modal-card { max-width: 95%; margin: 10px; }
        .project-actions-row { flex-direction: column; }
    }
</style>
