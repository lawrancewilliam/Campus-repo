<script>
    import { onMount } from 'svelte';
    import { getCurrentSession, getProjects, toggleBookmark, incrementProjectDownloads } from '$lib/storage.js';
    import { toastState } from '$lib/toasts.svelte.js';

    let session = $state(null);
    let projects = $state([]);
    let mounted = $state(false);

    // Search and filter state
    let searchQuery = $state('');
    let selectedCategory = $state('All');
    let selectedDept = $state('All');

    // Get unique categories and departments for filter dropdowns
    let categories = $derived(['All', ...new Set(projects.map(p => p.category))]);
    let departments = $derived(['All', ...new Set(projects.map(p => p.dept))]);

    // Filtered projects
    let filteredProjects = $derived(
        projects.filter(p => {
            // Only show Public projects
            if (p.visibility !== 'Public') return false;

            const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (p.abstract && p.abstract.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
            const matchesDept = selectedDept === 'All' || p.dept === selectedDept;

            return matchesSearch && matchesCategory && matchesDept;
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

    async function handleToggleBookmark(id) {
        if (session && session.user) {
            await toggleBookmark(id, session.user.registerNumber);
            await loadData();
        }
    }

    async function simulateDownload(project) {
        await incrementProjectDownloads(project.id);
        if (project.firebaseStorageUrl) {
            window.open(project.firebaseStorageUrl, '_blank');
        }
        toastState.show(
            `Project file "${project.fileName || 'source_code.zip'}" download started.`, 
            "success", 
            "✅ Download Started"
        );
        await loadData();
    }
</script>

<svelte:head>
    <title>CampusRepo — Explore Projects</title>
</svelte:head>

{#if mounted && session}
<main class="explore-container">
    <div class="bg-effects" aria-hidden="true">
        <div class="orb"></div>
    </div>
    
    <div class="explore-hero">
        <h1>Explore Projects</h1>
        <p>Discover innovative academic projects and source code shared by fellow students.</p>
    </div>
    
    <!-- Search & Filters Panel -->
    <section class="filters-panel">
        <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Search projects by title, keywords..." bind:value={searchQuery} />
        </div>
        
        <div class="filter-selectors">
            <div class="select-wrapper">
                <label for="category-select"><i class="fa-solid fa-tag"></i> Category</label>
                <select id="category-select" class="filter-select" bind:value={selectedCategory}>
                    {#each categories as category}
                        <option value={category}>{category}</option>
                    {/each}
                </select>
            </div>

            <div class="select-wrapper">
                <label for="dept-select"><i class="fa-solid fa-building-columns"></i> Department</label>
                <select id="dept-select" class="filter-select" bind:value={selectedDept}>
                    {#each departments as dept}
                        <option value={dept}>{dept}</option>
                    {/each}
                </select>
            </div>
        </div>
    </section>

    <!-- Projects Grid -->
    <section class="projects-grid">
        {#each filteredProjects as project (project.id)}
            <article class="project-card">
                <header class="card-header">
                    <span class="category-tag">{project.category}</span>
                    <span class="dept-tag">{project.dept}</span>
                </header>
                
                <h3 class="project-title">{project.title}</h3>
                <p class="project-abstract">{project.abstract || 'No description available for this project.'}</p>
                
                <div class="project-author">
                    <div class="author-avatar">{project.authorName ? project.authorName[0].toUpperCase() : 'S'}</div>
                    <div>
                        <div class="author-name">{project.authorName}</div>
                        <div class="project-date">{project.date}</div>
                    </div>
                </div>

                <div class="card-footer">
                    <div class="project-stats">
                        <span><i class="fa-solid fa-eye"></i> {project.views || 0}</span>
                        <span><i class="fa-solid fa-star"></i> {project.stars || 0}</span>
                        <span><i class="fa-solid fa-download"></i> {project.downloadsCount || 0}</span>
                    </div>
                    
                    <div class="card-actions">
                        <button class="action-btn download-btn" onclick={() => simulateDownload(project)} title="Download Code">
                            <i class="fa-solid fa-download"></i> Download
                        </button>
                        <button class="action-btn bookmark-btn" class:active={session.user.bookmarkedProjectIds?.includes(project.id)} onclick={() => handleToggleBookmark(project.id)} title="Bookmark Project">
                            <i class="fa-solid fa-bookmark"></i>
                        </button>
                    </div>
                </div>
            </article>
        {:else}
            <div class="empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <h3>No projects found</h3>
                <p>Try modifying your search queries or clearing the category and department filters.</p>
            </div>
        {/each}
    </section>
</main>
{/if}

<style>
    .explore-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 3rem 1.5rem;
        color: var(--text-main);
        font-family: 'Inter', sans-serif;
        min-height: calc(100vh - 64px);
        position: relative;
        z-index: 1;
    }

    .bg-effects {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
    }
    .orb {
        position: absolute;
        width: 600px; height: 600px;
        background: rgba(59, 130, 246, 0.05);
        border-radius: 50%;
        filter: blur(140px);
        top: 10%; right: 10%;
    }

    .explore-hero {
        text-align: center;
        margin-bottom: 2.5rem;
    }
    .explore-hero h1 {
        font-size: 2.5rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
        color: var(--text-main);
    }
    .explore-hero p {
        color: var(--text-muted);
        font-size: 1.1rem;
    }

    /* Filters Panel */
    .filters-panel {
        background: var(--bg-card);
        border: 1px solid var(--border);
        padding: 1.5rem;
        border-radius: 1rem;
        margin-bottom: 3rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        box-shadow: var(--card-shadow);
        transition: background-color 0.3s, border-color 0.3s;
    }

    .search-box {
        display: flex;
        align-items: center;
        background: var(--bg-input);
        border: 1px solid var(--border);
        padding: 0.75rem 1.25rem;
        border-radius: 0.75rem;
        gap: 0.75rem;
        width: 100%;
        box-sizing: border-box;
    }
    .search-box i { color: var(--text-muted); }
    .search-box input {
        border: none;
        background: none;
        outline: none;
        color: var(--text-main);
        font-size: 1rem;
        width: 100%;
    }

    .filter-selectors {
        display: flex;
        gap: 1.5rem;
    }
    .select-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
    }
    .select-wrapper label {
        font-size: 0.85rem;
        color: var(--text-muted);
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }
    .filter-select {
        background: var(--bg-input);
        border: 1px solid var(--border);
        color: var(--text-main);
        padding: 0.75rem;
        border-radius: 0.5rem;
        font-size: 0.9rem;
        font-family: inherit;
        outline: none;
        cursor: pointer;
        width: 100%;
    }
    .filter-select:focus { border-color: var(--primary); }

    /* Projects Grid */
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
        transition: transform 0.25s, border-color 0.25s, background-color 0.3s;
    }
    .project-card:hover {
        transform: translateY(-4px);
        border-color: var(--primary);
    }

    .card-header {
        display: flex;
        gap: 0.5rem;
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
    .dept-tag {
        background: rgba(139, 92, 246, 0.1);
        color: #8b5cf6;
        padding: 0.25rem 0.6rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .project-title {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--text-main);
        margin-bottom: 0.75rem;
        line-height: 1.3;
    }

    .project-abstract {
        font-size: 0.88rem;
        color: var(--text-muted);
        line-height: 1.5;
        margin-bottom: 1.5rem;
        flex-grow: 1;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .project-author {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        border-top: 1px solid var(--border);
        padding-top: 1rem;
        margin-bottom: 1.25rem;
    }
    .author-avatar {
        width: 32px; height: 32px;
        background: linear-gradient(135deg, var(--primary), #8b5cf6);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-weight: 700;
        font-size: 0.8rem;
        color: white;
    }
    .author-name { font-size: 0.85rem; font-weight: 600; color: var(--text-main); }
    .project-date { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.1rem; }

    .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .project-stats {
        display: flex;
        gap: 0.75rem;
        color: var(--text-muted);
        font-size: 0.8rem;
    }
    .project-stats span { display: flex; align-items: center; gap: 0.3rem; }

    .card-actions { display: flex; gap: 0.5rem; }
    .action-btn {
        border: none;
        cursor: pointer;
        font-family: inherit;
        border-radius: 0.5rem;
        transition: all 0.2s;
    }
    .download-btn {
        background: var(--primary);
        color: white;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.4rem 0.8rem;
        display: flex; align-items: center; gap: 0.4rem;
    }
    .download-btn:hover { background: var(--primary-hover); }
    .bookmark-btn {
        background: none;
        border: 1px solid var(--border);
        color: var(--text-muted);
        padding: 0.4rem 0.6rem;
        font-size: 0.85rem;
    }
    .bookmark-btn:hover { color: var(--text-main); border-color: var(--text-muted); }
    .bookmark-btn.active { color: #fbbf24; border-color: rgba(251, 191, 36, 0.3); background: rgba(251, 191, 36, 0.05); }

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
    .empty-state h3 { font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem; }

    @media (max-width: 768px) {
        .filter-selectors { flex-direction: column; gap: 1rem; }
        .projects-grid { grid-template-columns: 1fr; }
        .explore-hero h1 { font-size: 1.85rem; }
        .explore-hero p { font-size: 0.95rem; }
        .explore-container { padding: 2rem 1rem; }
        .filters-panel { padding: 1rem; margin-bottom: 2rem; }
    }
</style>
