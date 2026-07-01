<script>
    import { onMount } from 'svelte';
    import { getCurrentSession, getProjects, deleteProject, updateProject, incrementProjectDownloads } from '$lib/storage.js';
    import { toastState } from '$lib/toasts.svelte.js';

    let session = $state(null);
    let projects = $state([]);
    let mounted = $state(false);

    // Search and filters
    let searchQuery = $state('');
    let selectedCategory = $state('All');
    let selectedVisibility = $state('All');

    // Edit Modal state
    let isEditModalOpen = $state(false);
    let projectToEdit = $state(null);

    // Get unique categories for filter
    let categories = $derived(['All', ...new Set(projects.map(p => p.category))]);

    // Filter projects
    let filteredProjects = $derived(
        projects.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  p.authorRegNo.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
            const matchesVisibility = selectedVisibility === 'All' || p.visibility === selectedVisibility;

            return matchesSearch && matchesCategory && matchesVisibility;
        })
    );

    async function loadData() {
        session = getCurrentSession();
        projects = await getProjects();
    }

    onMount(() => {
        loadData();
        mounted = true;
    });

    async function handleDeleteProject(id, title) {
        if (confirm(`Are you sure you want to delete the project "${title}"? This action is permanent and will remove it from the platform.`)) {
            await deleteProject(id);
            toastState.show(`Project "${title}" has been deleted.`, "success", "✅ Project Deleted");
            await loadData();
        }
    }

    async function simulateDownload(project) {
        await incrementProjectDownloads(project.id);
        toastState.show(`Downloaded: ${project.fileName || 'source_code.zip'} successfully.`, "success", "✅ File Downloaded");
        await loadData();
    }

    async function toggleFlag(project, flagName) {
        const updatedValue = !project[flagName];
        const res = await updateProject(project.id, { [flagName]: updatedValue });
        if (res.success) {
            toastState.show(
                `"${project.title}" flag "${flagName}" set to ${updatedValue ? 'ON' : 'OFF'}`,
                "success",
                "✅ Project Flag Updated"
            );
            await loadData();
        }
    }

    function openEditModal(project) {
        projectToEdit = { ...project };
        isEditModalOpen = true;
    }

    function closeEditModal() {
        isEditModalOpen = false;
        projectToEdit = null;
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
    <title>CampusRepo — Manage Uploads</title>
</svelte:head>

{#if mounted && session && session.role === 'admin'}
<main class="uploads-container">
    <section class="page-header">
        <h1>Manage Uploads</h1>
        <p>Review, download, moderate, or feature project uploads across the campus repository.</p>
    </section>

    <!-- Filters & Search Toolbar -->
    <section class="toolbar-panel">
        <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Search by title, author name, register number..." bind:value={searchQuery} />
        </div>
        
        <div class="filters">
            <div class="select-group">
                <label for="cat-filter">Category</label>
                <select id="cat-filter" class="filter-select" bind:value={selectedCategory}>
                    {#each categories as cat}
                        <option value={cat}>{cat}</option>
                    {/each}
                </select>
            </div>
            
            <div class="select-group">
                <label for="vis-filter">Visibility</label>
                <select id="vis-filter" class="filter-select" bind:value={selectedVisibility}>
                    <option value="All">All Visibility</option>
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                </select>
            </div>
        </div>
    </section>

    <!-- Table Panel -->
    <section class="table-panel">
        <div class="table-responsive">
            <table class="uploads-table">
                <thead>
                    <tr>
                        <th>Project Info</th>
                        <th>Author</th>
                        <th>File Details</th>
                        <th>Highlight Flags</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredProjects as project (project.id)}
                        <tr>
                            <!-- Project Info -->
                            <td>
                                <div class="project-cell">
                                    <div class="project-icon-wrapper"><i class="fa-solid fa-code"></i></div>
                                    <div>
                                        <span class="project-title-text">{project.title}</span>
                                        <div class="project-meta-badges">
                                            <span class="badge {project.visibility === 'Private' ? 'private-badge' : 'public-badge'}">{project.visibility}</span>
                                            <span class="project-category-badge">{project.category}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            
                            <!-- Author -->
                            <td>
                                <div class="author-cell">
                                    <span class="author-name-text">{project.authorName}</span>
                                    <span class="author-reg-no">{project.authorRegNo} ({project.dept})</span>
                                </div>
                            </td>
                            
                            <!-- File & Stats -->
                            <td>
                                <div class="file-cell">
                                    <span class="file-name" title={project.fileName}>
                                        <i class="fa-solid fa-file-zipper zip-color"></i> {project.fileName || 'source_code.zip'}
                                    </span>
                                    <div class="stats-row">
                                        <span><i class="fa-solid fa-eye"></i> {project.views || 0}</span>
                                        <span><i class="fa-solid fa-star"></i> {project.stars || 0}</span>
                                        <span><i class="fa-solid fa-download"></i> {project.downloadsCount || 0}</span>
                                    </div>
                                </div>
                            </td>

                            <!-- Highlight Flags -->
                            <td>
                                <div class="flags-grid">
                                    <button class="flag-toggle-btn" class:active={project.featured} onclick={() => toggleFlag(project, 'featured')} title="Toggle Featured">
                                        <i class="fa-solid fa-bolt"></i> Featured
                                    </button>
                                    <button class="flag-toggle-btn" class:active={project.recommended} onclick={() => toggleFlag(project, 'recommended')} title="Toggle Recommended">
                                        <i class="fa-solid fa-thumbs-up"></i> Recommended
                                    </button>
                                    <button class="flag-toggle-btn" class:active={project.favorite} onclick={() => toggleFlag(project, 'favorite')} title="Toggle Favorite">
                                        <i class="fa-solid fa-heart"></i> Favorite
                                    </button>
                                    <button class="flag-toggle-btn" class:active={project.homePage} onclick={() => toggleFlag(project, 'homePage')} title="Toggle Home Page Project">
                                        <i class="fa-solid fa-house-laptop"></i> Home Page
                                    </button>
                                </div>
                            </td>
                            
                            <!-- Actions -->
                            <td>
                                <div class="actions-cell">
                                    <button class="action-btn download-btn" onclick={() => simulateDownload(project)} title="Download Source File">
                                        <i class="fa-solid fa-download"></i>
                                    </button>
                                    <button class="action-btn edit-btn" onclick={() => openEditModal(project)} title="Edit Project Details">
                                        <i class="fa-solid fa-pen-to-square"></i>
                                    </button>
                                    <button class="action-btn delete-btn" onclick={() => handleDeleteProject(project.id, project.title)} title="Delete/Moderate Project">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {:else}
                        <tr>
                            <td colspan="5" class="empty-cell">
                                <div class="empty-state">
                                    <i class="fa-solid fa-box-archive"></i>
                                    <p>No project uploads match the criteria.</p>
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </section>

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
                        <label for="edit-title">Project Title</label>
                        <input id="edit-title" type="text" class="dark-input" bind:value={projectToEdit.title} />
                    </div>
                    <div class="form-group">
                        <label for="edit-abstract">Abstract / Description</label>
                        <textarea id="edit-abstract" class="dark-input" rows="4" bind:value={projectToEdit.abstract}></textarea>
                    </div>
                    <div class="form-group">
                        <label for="edit-category">Category / Domain</label>
                        <select id="edit-category" class="dark-input" bind:value={projectToEdit.category}>
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
    .uploads-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
        color: var(--text-main);
        font-family: 'Inter', sans-serif;
    }

    .page-header { margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; margin-bottom: 0.5rem; color: var(--text-main); }
    .page-header p { color: var(--text-muted); }

    /* Toolbar Panel */
    .toolbar-panel {
        background: var(--bg-card);
        border: 1px solid var(--border);
        padding: 1.25rem;
        border-radius: 1rem;
        margin-bottom: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1.5rem;
    }

    .search-box {
        display: flex;
        align-items: center;
        background: var(--bg-input);
        border: 1px solid var(--border);
        padding: 0.6rem 1rem;
        border-radius: 0.5rem;
        gap: 0.5rem;
        flex: 1;
        max-width: 500px;
    }
    .search-box i { color: var(--text-muted); font-size: 0.9rem; }
    .search-box input {
        background: none; border: none; outline: none;
        color: var(--text-main); font-size: 0.88rem; width: 100%;
    }

    .filters { display: flex; gap: 1rem; }
    .select-group { display: flex; align-items: center; gap: 0.5rem; }
    .select-group label { font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
    
    .filter-select {
        background: var(--bg-input);
        border: 1px solid var(--border);
        color: var(--text-main);
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.85rem;
        font-family: inherit;
        outline: none;
        cursor: pointer;
    }
    .filter-select:focus { border-color: var(--primary); }

    /* Table Panel */
    .table-panel {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        overflow: hidden;
    }
    .table-responsive { overflow-x: auto; }
    
    .uploads-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: 0.88rem;
    }
    .uploads-table th {
        background: var(--bg-panel);
        color: var(--text-muted);
        padding: 1rem 1.25rem;
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        border-bottom: 1px solid var(--border);
    }
    .uploads-table td {
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--border);
        vertical-align: middle;
    }
    .uploads-table tr:last-child td { border-bottom: none; }

    /* Cells details */
    .project-cell { display: flex; align-items: center; gap: 0.75rem; }
    .project-icon-wrapper {
        width: 36px; height: 36px;
        background: rgba(59, 130, 246, 0.1);
        color: var(--primary);
        border-radius: 0.5rem;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
    }
    .project-title-text { display: block; font-weight: 600; color: var(--text-main); margin-bottom: 4px; font-size: 0.95rem; }
    .project-meta-badges { display: flex; gap: 0.4rem; align-items: center; }
    .project-category-badge {
        display: inline-block;
        background: var(--bg-panel);
        color: var(--text-muted);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 500;
        border: 1px solid var(--border);
    }

    .author-cell { display: flex; flex-direction: column; }
    .author-name-text { font-weight: 500; color: var(--text-main); margin-bottom: 2px; }
    .author-reg-no { font-size: 0.75rem; color: var(--text-muted); }

    .badge { padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; }
    .private-badge { background: rgba(239, 68, 68, 0.15); color: var(--danger); }
    .public-badge { background: rgba(16, 185, 129, 0.15); color: var(--success); }

    /* File Cells */
    .file-cell { display: flex; flex-direction: column; gap: 0.25rem; }
    .file-name {
        font-family: monospace; font-size: 0.8rem; color: var(--text-muted);
        max-width: 140px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .zip-color { color: #fbbf24; margin-right: 4px; }
    .stats-row { display: flex; gap: 0.6rem; color: var(--text-muted); font-size: 0.75rem; }
    .stats-row span { display: flex; align-items: center; gap: 3px; }

    /* Highlight flags grid */
    .flags-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.4rem;
        width: 180px;
    }
    .flag-toggle-btn {
        background: var(--bg-input);
        border: 1px solid var(--border);
        color: var(--text-muted);
        font-size: 0.7rem;
        font-weight: 600;
        padding: 4px 6px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .flag-toggle-btn:hover {
        border-color: var(--text-muted);
        color: var(--text-main);
    }
    .flag-toggle-btn.active {
        background: rgba(251, 191, 36, 0.12);
        color: #fbbf24;
        border-color: rgba(251, 191, 36, 0.4);
    }

    /* Actions cell */
    .actions-cell { display: flex; gap: 0.4rem; }
    .action-btn {
        background: none; border: none; cursor: pointer;
        padding: 0.45rem; border-radius: 0.35rem; font-size: 0.9rem;
        transition: all 0.2s;
    }
    .download-btn { color: var(--primary); background: rgba(59, 130, 246, 0.08); }
    .download-btn:hover { background: var(--primary); color: white; }
    .edit-btn { color: #fbbf24; background: rgba(251, 191, 36, 0.08); }
    .edit-btn:hover { background: #fbbf24; color: black; }
    .delete-btn { color: var(--danger); background: rgba(239, 68, 68, 0.08); }
    .delete-btn:hover { background: var(--danger); color: white; }

    /* Empty state */
    .empty-cell { text-align: center; padding: 3rem 0; }
    .empty-state { color: var(--text-muted); }
    .empty-state i { font-size: 2.5rem; color: var(--border); margin-bottom: 1rem; display: inline-block; }

    /* Modal Backdrop */
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

    .modal-body {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        max-height: 60vh;
        overflow-y: auto;
    }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }

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
    .btn-save { background: var(--primary); border: none; color: white; padding: 0.5rem 1.25rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; }
    .btn-save:hover { background: var(--primary-hover); }

    @media (max-width: 900px) {
        .toolbar-panel { flex-direction: column; align-items: stretch; }
        .search-box { max-width: none; }
        .filters { justify-content: space-between; }
        .flags-grid { grid-template-columns: 1fr; width: 100px; }
    }
</style>
