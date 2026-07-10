<script>
    import { onMount } from 'svelte';
    import { getCurrentSession, getStudentProjects, getProjects, deleteProject, toggleBookmark, updateProject, incrementProjectDownloads, getActivityLog } from '$lib/storage.js';
    import { toastState } from '$lib/toasts.svelte.js';

    let session = $state(null);
    let myProjects = $state([]);
    let allProjects = $state([]);
    let activityLog = $state([]);
    let mounted = $state(false);

    // Edit Modal state
    let isEditModalOpen = $state(false);
    let projectToEdit = $state(null);

    let selectedDomain = $state('');
    let customDomain = $state('');

    const domains = [
        "Web Development", "Mobile Applications", "Artificial Intelligence", 
        "Machine Learning", "Cloud Computing", "Data Science", 
        "Internet of Things", "Cyber Security", "Others"
    ];

    // Stats
    let totalProjects = $derived(myProjects.length);
    let totalViews = $derived(myProjects.reduce((sum, p) => sum + (p.views || 0), 0));
    let totalStars = $derived(myProjects.reduce((sum, p) => sum + (p.stars || 0), 0));
    let totalDownloads = $derived(myProjects.reduce((sum, p) => sum + (p.downloadsCount || 0), 0));

    // Featured/Recommended projects marked by Admin (featured = true, recommended = true, or homePage = true)
    let recommendedProjects = $derived(
        allProjects.filter(p => (p.featured || p.recommended || p.homePage) && p.visibility === 'Public')
    );

    async function loadData() {
        session = getCurrentSession();
        if (session && session.user) {
            myProjects = await getStudentProjects(session.user.registerNumber);
            allProjects = await getProjects();
            const logs = await getActivityLog();
            activityLog = logs.filter(a => a.text.includes(session.user.name) || a.text.includes("You"));
        }
    }

    onMount(() => {
        loadData();
        mounted = true;
    });

    async function handleDelete(id, title) {
        if (confirm("Are you sure you want to delete this project?")) {
            await deleteProject(id);
            toastState.show(`Project "${title}" has been deleted.`, "success", "✅ Project Deleted");
            await loadData();
        }
    }

    async function handleToggleBookmark(id) {
        if (session && session.user) {
            await toggleBookmark(id, session.user.registerNumber);
            await loadData();
        }
    }

    async function handleDownload(project) {
        await incrementProjectDownloads(project.id);
        if (project.firebaseStorageUrl) {
            window.open(project.firebaseStorageUrl, '_blank');
        }
        toastState.show(`File "${project.fileName || 'source_code.zip'}" download started.`, "success", "✅ File Downloaded");
        await loadData();
    }

    function openEditModal(project) {
        projectToEdit = { ...project };
        const categoryVal = project.category || '';
        // If the category is one of the standard domains (except 'Others')
        if (domains.filter(d => d !== 'Others').includes(categoryVal)) {
            selectedDomain = categoryVal;
            customDomain = '';
        } else {
            selectedDomain = 'Others';
            customDomain = categoryVal;
        }
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

        const finalDomain = selectedDomain === 'Others' ? customDomain : selectedDomain;

        const res = await updateProject(projectToEdit.id, {
            title: projectToEdit.title,
            abstract: projectToEdit.abstract,
            category: finalDomain,
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

    function formatRelativeTime(timestamp, timeFallback) {
        if (!timestamp || isNaN(Number(timestamp))) {
            return timeFallback || 'Just now';
        }
        const diff = Date.now() - Number(timestamp);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 5) return 'Just now';
        if (seconds < 60) return `${seconds}s ago`;
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }
</script>

<svelte:head>
    <title>CampusRepo — Student Dashboard</title>
</svelte:head>

{#if mounted && session}
<main class="main-container">
    <!-- Hero / Welcome Banner -->
    <section class="dash-welcome">
        <div class="welcome-text">
            <span class="wave-icon">👋 Welcome back, {session.user.name}</span>
            <h1>Your campus projects,<br>all in one place.</h1>
            <p>CampusRepo is the open platform for students to share, discover, and collaborate on academic and personal projects. Build your public portfolio while helping peers learn.</p>
            <div class="hero-actions">
                <a href="/student/upload" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Upload a Project</a>
                <a href="/student/explore" class="btn btn-outline"><i class="fa-solid fa-compass"></i> Explore Projects</a>
            </div>
        </div>
    </section>

    <!-- Most Recommended Projects Section -->
    <section class="recommended-section">
        <div class="section-title">
            <h2>Most Recommended Projects</h2>
            <p>Featured publications highlighted by the administration</p>
        </div>
        <div class="recommended-grid">
            {#each recommendedProjects as p (p.id)}
                <div class="rec-card">
                    <header class="rec-header">
                        <span class="rec-category">{p.category}</span>
                        <div class="rec-flags">
                            {#if p.featured}<span class="flag f-feat"><i class="fa-solid fa-bolt"></i> Featured</span>{/if}
                            {#if p.recommended}<span class="flag f-rec"><i class="fa-solid fa-thumbs-up"></i> Recommended</span>{/if}
                            {#if p.homePage}<span class="flag f-home"><i class="fa-solid fa-star"></i> Highlight</span>{/if}
                        </div>
                    </header>
                    <h3 class="rec-title">{p.title}</h3>
                    <p class="rec-abstract">{p.abstract}</p>
                    <div class="rec-author">By <strong>{p.authorName}</strong> ({p.dept})</div>
                    <footer class="rec-footer">
                        <div class="rec-stats">
                            <span><i class="fa-solid fa-eye"></i> {p.views || 0}</span>
                            <span><i class="fa-solid fa-download"></i> {p.downloadsCount || 0}</span>
                            <span><i class="fa-solid fa-star"></i> {p.stars || 0}</span>
                        </div>
                        <div class="rec-actions">
                            <button onclick={() => handleDownload(p)} class="btn-rec-down" title="Download ZIP File">
                                <i class="fa-solid fa-download"></i> Download
                            </button>
                            <button onclick={() => handleToggleBookmark(p.id)} class="btn-rec-star" class:active={session.user.bookmarkedProjectIds?.includes(p.id)} title="Bookmark Project">
                                <i class="fa-solid fa-bookmark"></i>
                            </button>
                        </div>
                    </footer>
                </div>
            {:else}
                <div class="empty-recommended">
                    <i class="fa-solid fa-award"></i>
                    <p>No featured or recommended projects highlighted yet.</p>
                </div>
            {/each}
        </div>
    </section>

    <!-- Personal Stats Grid -->
    <section class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon"><i class="fa-solid fa-folder-open"></i></div>
            <h2>{totalProjects}</h2>
            <p>Your Projects</p>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fa-solid fa-eye"></i></div>
            <h2>{totalViews}</h2>
            <p>Total Views</p>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fa-solid fa-star"></i></div>
            <h2>{totalStars}</h2>
            <p>Stars Earned</p>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fa-solid fa-download"></i></div>
            <h2>{totalDownloads}</h2>
            <p>Downloads</p>
        </div>
    </section>

    <!-- Content Grid -->
    <div class="content-grid">
        <!-- My Projects -->
        <div class="panel">
            <div class="panel-header">
                <h3>My Uploaded Projects</h3>
                <a href="/student/upload" class="btn-primary-sm"><i class="fa-solid fa-plus"></i> New Project</a>
            </div>
            
            <div class="project-list">
                {#each myProjects as project (project.id)}
                    <div class="list-item">
                        <div class="list-icon">
                            <i class="fa-solid fa-code"></i>
                        </div>
                        <div class="list-info">
                            <h4>{project.title}</h4>
                            <div class="list-meta">
                                <span class="badge {project.visibility === 'Private' ? 'private-badge' : 'public-badge'}">{project.visibility}</span>
                                <span> • {project.category}</span>
                                <span> • {project.views || 0} Views</span>
                                <span> • {project.downloadsCount || 0} Downloads</span>
                            </div>
                        </div>
                        <div class="list-actions">
                            <button class="icon-btn edit" onclick={() => openEditModal(project)} title="Edit Project">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button class="icon-btn danger" onclick={() => handleDelete(project.id, project.title)} title="Delete Project">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                            <button class="icon-btn star-btn" class:active={session.user.bookmarkedProjectIds?.includes(project.id)} onclick={() => handleToggleBookmark(project.id)} title="Bookmark Project">
                                <i class="fa-solid fa-bookmark"></i>
                            </button>
                        </div>
                    </div>
                {:else}
                    <div class="empty-state">
                        <i class="fa-solid fa-folder-open"></i>
                        <p>No projects uploaded yet.</p>
                        <a href="/student/upload" class="btn btn-secondary">Upload Your First Project</a>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="panel">
            <div class="panel-header">
                <h3>Your Recent Activity</h3>
            </div>
            <div class="activity-list">
                {#each activityLog as activity}
                    <div class="activity-item">
                        <div class="activity-icon-wrapper" class:danger-bg={activity.type === 'delete'}>
                            <i class="fa-solid {activity.type === 'upload' ? 'fa-cloud-arrow-up' : activity.type === 'delete' ? 'fa-trash' : 'fa-pen'}"></i>
                        </div>
                        <div class="activity-details">
                            <p class="activity-text">{@html activity.text}</p>
                            <span class="activity-time">{formatRelativeTime(activity.timestamp, activity.time)}</span>
                        </div>
                    </div>
                {:else}
                    <p class="empty-text">No recent activity logged.</p>
                {/each}
            </div>
        </div>
    </div>

    <!-- STUDENT PROJECT EDIT EDIT MODAL -->
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
                        <select id="modal-edit-category" class="dark-input-field" bind:value={selectedDomain}>
                            {#each domains as domain}
                                <option value={domain}>{domain}</option>
                            {/each}
                        </select>
                    </div>
                    {#if selectedDomain === 'Others'}
                        <div class="form-group animate-fade-in" style="margin-top: 1rem;">
                            <label for="modal-edit-custom-category">Specify Other Domain</label>
                            <input id="modal-edit-custom-category" type="text" class="dark-input-field" bind:value={customDomain} placeholder="e.g. Blockchain, Cybersecurity, Bioinformatics" />
                        </div>
                    {/if}
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
                    <button class="btn-cancel-modal" onclick={closeEditModal}>Cancel</button>
                    <button class="btn-save-modal" onclick={saveProjectEdit}>Save Changes</button>
                </footer>
            </div>
        </div>
    {/if}
</main>
{/if}

<style>
    .main-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
        color: var(--text-main);
        font-family: 'Inter', sans-serif;
    }

    .dash-welcome {
        background: var(--bg-hero);
        border: 1px solid var(--border-hero);
        padding: 3rem;
        border-radius: 1rem;
        margin-bottom: 2rem;
        position: relative;
    }
    .wave-icon {
        color: var(--accent);
        font-weight: 600;
        font-size: 1rem;
        margin-bottom: 0.5rem;
        display: block;
    }
    .dash-welcome h1 { font-size: 2.25rem; font-weight: 800; line-height: 1.2; margin-bottom: 1rem; color: var(--text-hero-main); }
    .dash-welcome p { color: var(--text-hero-muted); font-size: 1.05rem; line-height: 1.5; max-width: 700px; margin-bottom: 2rem; }
 
    .hero-actions { display: flex; gap: 1rem; }
    .btn {
        padding: 0.65rem 1.25rem;
        border-radius: 0.5rem;
        font-weight: 600;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        transition: all 0.2s;
    }
    .btn-primary { background: var(--primary); color: white; border: none; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-outline { background: transparent; border: 1px solid var(--border-hero); color: var(--text-hero-main); }
    .btn-outline:hover { border-color: var(--text-hero-muted); background: rgba(255,255,255,0.04); }

    /* Recommended projects */
    .recommended-section {
        margin-bottom: 3rem;
    }
    .section-title { margin-bottom: 1.5rem; }
    .section-title h2 { font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px; }
    .section-title p { color: var(--text-muted); font-size: 0.9rem; margin: 0; }
    
    .recommended-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
    }
    .rec-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        transition: transform 0.2s, border-color 0.2s;
    }
    .rec-card:hover {
        transform: translateY(-2px);
        border-color: var(--primary);
    }
    .rec-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.75rem; }
    .rec-category { font-size: 0.7rem; background: rgba(59,130,246,0.1); color: var(--primary); font-weight: 600; padding: 2px 6px; border-radius: 4px; flex-shrink: 0; }
    .rec-flags { display: flex; gap: 0.25rem; flex-wrap: wrap; justify-content: flex-end; }
    .flag { font-size: 0.62rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; display: flex; align-items: center; gap: 3px; }
    .f-feat { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
    .f-rec { background: rgba(16, 185, 129, 0.15); color: var(--success); }
    .f-home { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }

    .rec-title { font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px; }
    .rec-abstract { font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 1rem; }
    .rec-author { font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1.25rem; border-top: 1px solid var(--border); padding-top: 0.5rem; }
    
    .rec-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
    .rec-stats { display: flex; gap: 0.6rem; font-size: 0.75rem; color: var(--text-muted); }
    .rec-stats span { display: flex; align-items: center; gap: 3px; }
    
    .rec-actions { display: flex; gap: 0.4rem; }
    .btn-rec-down { background: var(--primary); border: none; color: white; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 3px; }
    .btn-rec-down:hover { background: var(--primary-hover); }
    .btn-rec-star { background: none; border: 1px solid var(--border); color: var(--text-muted); border-radius: 4px; padding: 4px 6px; font-size: 0.75rem; cursor: pointer; }
    .btn-rec-star.active { color: #fbbf24; border-color: rgba(251, 191, 36, 0.3); background: rgba(251, 191, 36, 0.05); }

    .empty-recommended { grid-column: 1/-1; text-align: center; padding: 2rem; border: 1px dashed var(--border); border-radius: 0.75rem; color: var(--text-muted); font-size: 0.85rem; }
    .empty-recommended i { font-size: 1.75rem; display: block; margin-bottom: 0.5rem; color: var(--border); }

    /* Stats Grid */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.25rem;
        margin-bottom: 2.5rem;
    }
    .stat-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        padding: 1.5rem;
        border-radius: 1rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
    }
    .stat-icon {
        width: 48px; height: 48px;
        background: rgba(59, 130, 246, 0.15);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.25rem;
        color: var(--primary);
    }
    .stat-card h2 { font-size: 1.75rem; color: var(--text-main); font-weight: 800; margin: 0; }
    .stat-card p { color: var(--text-muted); font-size: 0.85rem; font-weight: 500; margin: 0; }

    /* Content Grid */
    .content-grid {
        display: grid;
        grid-template-columns: 1.3fr 1fr;
        gap: 1.5rem;
    }
    .panel {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 1.5rem;
    }
    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        border-bottom: 1px solid var(--border);
        padding-bottom: 0.75rem;
    }
    .panel-header h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin: 0; }

    .btn-primary-sm {
        background: var(--primary);
        color: white;
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.85rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        transition: background 0.2s;
    }
    .btn-primary-sm:hover { background: var(--primary-hover); }

    .btn-secondary {
        background: var(--bg-panel);
        color: var(--text-main);
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.85rem;
        font-weight: 600;
        border: 1px solid var(--border);
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.06); }

    /* Project List */
    .project-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .list-item {
        display: flex;
        align-items: center;
        background: var(--bg-panel);
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        gap: 1rem;
        border: 1px solid var(--border);
    }
    .list-icon {
        width: 32px; height: 32px;
        background: var(--bg-card);
        border-radius: 0.5rem;
        display: flex; align-items: center; justify-content: center;
        color: var(--primary);
    }
    .list-info { flex: 1; min-width: 0; }
    .list-info h4 { font-size: 0.95rem; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; }
    .list-meta { font-size: 0.78rem; color: var(--text-muted); display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem; align-items: center; }
    
    .badge {
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
    }
    .private-badge { background: rgba(239, 68, 68, 0.15); color: var(--danger); }
    .public-badge { background: rgba(16, 185, 129, 0.15); color: var(--success); }

    .list-actions { display: flex; gap: 0.4rem; }
    .icon-btn {
        background: none; border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 0.9rem;
        padding: 0.4rem;
        border-radius: 0.4rem;
        transition: color 0.2s, background 0.2s;
    }
    .icon-btn:hover { color: var(--text-main); background: rgba(255,255,255,0.05); }
    .icon-btn.edit:hover { color: #fbbf24; background: rgba(251, 191, 36, 0.1); }
    .icon-btn.danger:hover { color: var(--danger); background: rgba(239, 68, 68, 0.1); }
    .icon-btn.star-btn.active { color: #fbbf24; }

    .empty-state {
        text-align: center;
        padding: 3rem 1.5rem;
        border: 1px dashed var(--border);
        border-radius: 0.75rem;
        color: var(--text-muted);
    }
    .empty-state i { font-size: 2rem; margin-bottom: 1rem; display: inline-block; color: var(--border); }
    .empty-state p { margin-bottom: 1.5rem; font-size: 0.9rem; }

    /* Activity Feed */
    .activity-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .activity-item {
        display: flex; gap: 0.75rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--border);
        align-items: flex-start;
    }
    .activity-item:last-child { border-bottom: none; }
    
    .activity-icon-wrapper {
        width: 28px; height: 28px;
        border-radius: 50%;
        display: flex; justify-content: center; align-items: center;
        background: var(--bg-panel);
        color: var(--primary);
        font-size: 0.8rem;
        flex-shrink: 0;
    }
    .activity-icon-wrapper.danger-bg { background: rgba(239,68,68,0.1); color: var(--danger); }
    .activity-details { flex: 1; min-width: 0; }
    .activity-text { font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; margin: 0; }
    .activity-text :global(strong) { color: var(--text-main); font-weight: 600; }
    .activity-time { font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 0.15rem; }
    .empty-text { color: var(--text-muted); text-align: center; padding: 2rem; font-size: 0.9rem; }

    /* Modal styles */
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
    .modal-header {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .modal-header h3 { margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-main); }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; }
    
    .modal-body {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }
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
    .btn-cancel-modal { background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 0.5rem 1.25rem; border-radius: 0.5rem; cursor: pointer; }
    .btn-cancel-modal:hover { color: var(--text-main); border-color: var(--text-muted); }
    .btn-save-modal { background: var(--primary); border: none; color: white; padding: 0.5rem 1.25rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; }
    .btn-save-modal:hover { background: var(--primary-hover); }

    @media (max-width: 900px) {
        .content-grid { grid-template-columns: 1fr; }
        .stats-grid { grid-template-columns: repeat(2, 1fr); }
        .recommended-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 576px) {
        .main-container { padding: 1.5rem 0.75rem; }
        .stats-grid { grid-template-columns: 1fr; }
        .dash-welcome { padding: 2rem 1.25rem; text-align: center; }
        .dash-welcome h1 { font-size: 1.65rem; }
        .dash-welcome p { font-size: 0.95rem; margin-bottom: 1.5rem; }
        .hero-actions { flex-direction: column; gap: 0.75rem; }
        .hero-actions .btn { width: 100%; justify-content: center; box-sizing: border-box; }
        .panel { padding: 1rem; }
        .list-item { flex-direction: column; align-items: stretch; gap: 0.75rem; }
        .list-actions { justify-content: flex-end; border-top: 1px solid var(--border); padding-top: 0.5rem; }
        .modal-card { max-width: 95%; margin: 10px; }
        .modal-body { padding: 1rem; gap: 1rem; }
        .radio-group-horizontal { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
    }
</style>
