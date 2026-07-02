<script>
    import { onMount } from 'svelte';
    import { getCurrentSession, getStudentProjects, deleteProject, updateProject, incrementProjectDownloads } from '$lib/storage.js';
    import { toastState } from '$lib/toasts.svelte.js';

    let session = $state(null);
    let myProjects = $state([]);
    let mounted = $state(false);

    // Edit Modal state
    let isEditModalOpen = $state(false);
    let projectToEdit = $state(null);

    // View Modal state
    let isViewModalOpen = $state(false);
    let projectToView = $state(null);

    const domains = [
        "Web Development", "Mobile Applications", "Artificial Intelligence", 
        "Machine Learning", "Cloud Computing", "Data Science", 
        "Internet of Things", "Cyber Security"
    ];

    async function loadData() {
        session = getCurrentSession();
        if (session && session.user) {
            myProjects = await getStudentProjects(session.user.registerNumber);
        }
    }

    onMount(() => {
        loadData();
        mounted = true;
    });

    async function handleDelete(id, title) {
        if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
            await deleteProject(id);
            toastState.show(`Project "${title}" has been deleted.`, "success", "✅ Project Deleted");
            await loadData();
        }
    }

    async function handleDownload(project) {
        await incrementProjectDownloads(project.id);
        toastState.show(`File "${project.fileName || 'source_code.zip'}" downloaded.`, "success", "✅ File Downloaded");
        await loadData();
    }

    function openEditModal(project) {
        projectToEdit = { ...project };
        isEditModalOpen = true;
    }

    function closeEditModal() {
        isEditModalOpen = false;
        projectToEdit = null;
    }

    function openViewModal(project) {
        projectToView = project;
        isViewModalOpen = true;
    }

    function closeViewModal() {
        isViewModalOpen = false;
        projectToView = null;
    }

    async function saveProjectEdit() {
        if (!projectToEdit.title || !projectToEdit.abstract) {
            alert("Title and abstract are required.");
            return;
        }

        const res = await updateProject(projectToEdit.id, {
            title: projectToEdit.title,
            abstract: projectToEdit.abstract,
            category: projectToEdit.category,
            visibility: projectToEdit.visibility
        });

        if (res.success) {
            toastState.show("Project details have been updated successfully.", "success", "✅ Project Updated");
            closeEditModal();
            await loadData();
        } else {
            alert(res.message || "Failed to update project.");
        }
    }
</script>

<svelte:head>
    <title>CampusRepo — My Projects</title>
</svelte:head>

{#if mounted && session}
<main class="container main-content">
    <header class="page-header">
        <h1>My Projects</h1>
        <p>Manage, edit, or check performance metrics for your uploaded projects.</p>
    </header>

    <!-- Projects Grid -->
    <div class="projects-grid">
        {#each myProjects as project (project.id)}
            <article class="project-card">
                <header class="card-header">
                    <span class="category-tag">{project.category}</span>
                    <span class="badge {project.visibility === 'Private' ? 'private-badge' : 'public-badge'}">{project.visibility}</span>
                </header>
                
                <h3 class="project-title">{project.title}</h3>
                <p class="project-abstract">{project.abstract || 'No description available.'}</p>
                
                <!-- Project details -->
                <div class="project-details-box">
                    <div class="detail-row">
                        <span class="detail-label">File:</span>
                        <span class="detail-value filename-txt"><i class="fa-solid fa-file-zipper zip-icon"></i> {project.fileName || 'source_code.zip'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Uploaded:</span>
                        <span class="detail-value">{project.date || (project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A')}</span>
                    </div>
                </div>

                <div class="card-footer">
                    <!-- Project Stats -->
                    <div class="project-stats">
                        <span title="Views"><i class="fa-solid fa-eye"></i> {project.views || 0}</span>
                        <span title="Stars/Favorites"><i class="fa-solid fa-star"></i> {project.stars || 0}</span>
                        <span title="Downloads"><i class="fa-solid fa-download"></i> {project.downloadsCount || 0}</span>
                    </div>
                    
                    <!-- Actions -->
                    <div class="card-actions">
                        <button class="action-btn view-btn" onclick={() => openViewModal(project)} title="View Project Details">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="action-btn download-btn" onclick={() => handleDownload(project)} title="Download Source File">
                            <i class="fa-solid fa-download"></i>
                        </button>
                        <button class="action-btn edit-btn" onclick={() => openEditModal(project)} title="Edit Project">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick={() => handleDelete(project.id, project.title)} title="Delete Project">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </article>
        {:else}
            <div class="empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <h3>No projects uploaded</h3>
                <p>You have not shared any projects yet. Show off your work to the campus today!</p>
                <a href="/student/upload" class="btn btn-primary">Upload A Project</a>
            </div>
        {/each}
    </div>

    <!-- VIEW PROJECT MODAL -->
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
                        <h4>Abstract</h4>
                        <p class="abstract-content">{projectToView.abstract}</p>
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
                            <span class="stat-val font-mono">{projectToView.fileName || 'source_code.zip'}</span>
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

    <!-- EDIT PROJECT MODAL -->
    {#if isEditModalOpen && projectToEdit}
        <div class="modal-backdrop" onclick={closeEditModal} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && closeEditModal()}>
            <div class="modal-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <header class="modal-header">
                    <h3>Edit Project Details</h3>
                    <button class="close-btn" onclick={closeEditModal} aria-label="Close modal">&times;</button>
                </header>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="modal-edit-title">Project Title</label>
                        <input id="modal-edit-title" type="text" class="dark-input-field" bind:value={projectToEdit.title} />
                    </div>
                    <div class="form-group">
                        <label for="modal-edit-abstract">Abstract / Description</label>
                        <textarea id="modal-edit-abstract" class="dark-input-field" rows="4" bind:value={projectToEdit.abstract}></textarea>
                    </div>
                    <div class="form-group">
                        <label for="modal-edit-category">Category / Domain</label>
                        <select id="modal-edit-category" class="dark-input-field" bind:value={projectToEdit.category}>
                            {#each domains as domain}
                                <option value={domain}>{domain}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Visibility</label>
                        <div class="radio-group-horizontal">
                            <label class="radio-label">
                                <input type="radio" bind:group={projectToEdit.visibility} value="Public" /> Public
                            </label>
                            <label class="radio-label">
                                <input type="radio" bind:group={projectToEdit.visibility} value="Private" /> Private
                            </label>
                        </div>
                    </div>
                </div>
                <footer class="modal-footer">
                    <button class="btn-cancel" onclick={closeEditModal}>Cancel</button>
                    <button class="btn-save" onclick={saveProjectEdit}>Save Changes</button>
                </footer>
            </div>
        </div>
    {/if}
</main>
{/if}

<style>
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    .main-content { padding: 2rem 0; color: var(--text-main); font-family: 'Inter', sans-serif; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; margin-bottom: 0.5rem; color: var(--primary); }
    .page-header p { color: var(--text-muted); }

    /* Grid */
    .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;
        margin-bottom: 4rem;
    }

    .project-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        transition: transform 0.2s, border-color 0.2s;
    }
    .project-card:hover {
        transform: translateY(-4px);
        border-color: var(--primary);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    .category-tag {
        background: rgba(59, 130, 246, 0.1);
        color: var(--primary);
        padding: 0.25rem 0.6rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .badge { padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; }
    .private-badge { background: rgba(239, 68, 68, 0.15); color: var(--danger); }
    .public-badge { background: rgba(16, 185, 129, 0.15); color: var(--success); }

    .project-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--text-main);
        margin: 0 0 0.75rem;
        line-height: 1.3;
    }

    .project-abstract {
        font-size: 0.85rem;
        color: var(--text-muted);
        line-height: 1.5;
        margin-bottom: 1.25rem;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        flex-grow: 1;
    }

    .project-details-box {
        background: var(--bg-panel);
        border: 1px solid var(--border);
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1.25rem;
        font-size: 0.8rem;
    }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 0.4rem; }
    .detail-row:last-child { margin-bottom: 0; }
    .detail-label { color: var(--text-muted); font-weight: 500; }
    .detail-value { color: var(--text-main); font-weight: 600; }
    .filename-txt { font-family: monospace; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .zip-icon { color: #fbbf24; margin-right: 4px; }

    .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid var(--border);
        padding-top: 1rem;
    }
    .project-stats {
        display: flex;
        gap: 0.6rem;
        color: var(--text-muted);
        font-size: 0.8rem;
    }
    .project-stats span { display: flex; align-items: center; gap: 3px; }

    .card-actions { display: flex; gap: 0.35rem; }
    .action-btn {
        background: none; border: none; cursor: pointer;
        padding: 0.45rem; border-radius: 0.35rem; font-size: 0.85rem;
        transition: all 0.2s;
    }
    .view-btn { color: var(--text-main); background: rgba(255,255,255,0.06); border: 1px solid var(--border); }
    .view-btn:hover { background: rgba(255,255,255,0.12); }
    .download-btn { color: var(--primary); background: rgba(59, 130, 246, 0.08); }
    .download-btn:hover { background: var(--primary); color: white; }
    .edit-btn { color: #fbbf24; background: rgba(251, 191, 36, 0.08); }
    .edit-btn:hover { background: #fbbf24; color: black; }
    .delete-btn { color: var(--danger); background: rgba(239, 68, 68, 0.08); }
    .delete-btn:hover { background: var(--danger); color: white; }

    .btn-primary {
        background: var(--primary); color: white; border: none;
        padding: 0.6rem 1.25rem; border-radius: 0.5rem;
        font-weight: 600; text-decoration: none; cursor: pointer;
        transition: background 0.2s;
        font-size: 0.85rem;
    }
    .btn-primary:hover { background: var(--primary-hover); }

    .empty-state {
        grid-column: 1 / -1;
        background: var(--bg-card);
        border: 1px dashed var(--border);
        padding: 4rem 2rem;
        border-radius: 1rem;
        text-align: center;
        color: var(--text-muted);
    }
    .empty-state i { font-size: 3rem; margin-bottom: 1.5rem; color: var(--border); }
    .empty-state h3 { font-size: 1.25rem; color: var(--text-main); margin-bottom: 0.5rem; }
    .empty-state p { margin-bottom: 1.5rem; font-size: 0.9rem; }

    /* Modal Styles */
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
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
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: modal-scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
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
    .section-block h4 { font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase; margin: 0 0 0.5rem; font-weight: 600; }
    .abstract-content { font-size: 0.9rem; color: var(--text-main); line-height: 1.6; margin: 0; background: var(--bg-panel); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border); white-space: pre-wrap; }

    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .stat-info-box { background: var(--bg-panel); border: 1px solid var(--border); padding: 0.75rem 1rem; border-radius: 0.5rem; display: flex; flex-direction: column; gap: 2px; }
    .stat-lbl { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 500; }
    .stat-val { font-size: 1.1rem; color: var(--text-main); font-weight: 700; }
    .font-mono { font-family: monospace; font-size: 0.85rem !important; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }

    .dark-input-field {
        width: 100%;
        background: var(--bg-input);
        border: 1px solid var(--border);
        color: var(--text-main);
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        font-family: inherit;
        box-sizing: border-box;
    }
    .dark-input-field:focus { outline: none; border-color: var(--primary); }

    .radio-group-horizontal { display: flex; gap: 1.5rem; align-items: center; margin-top: 4px; }
    .radio-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: var(--text-main); cursor: pointer; }

    .modal-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--border);
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        background: var(--bg-panel);
    }
    .btn-cancel { background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 0.5rem 1.25rem; border-radius: 0.5rem; cursor: pointer; }
    .btn-cancel:hover { color: var(--text-main); border-color: var(--text-muted); }
    .btn-save { background: var(--primary); border: none; color: white; padding: 0.5rem 1.25rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem; }
    .btn-save:hover { background: var(--primary-hover); }

    @media (max-width: 768px) {
        .projects-grid { grid-template-columns: 1fr; }
        .grid-2 { grid-template-columns: 1fr; }
    }
</style>
