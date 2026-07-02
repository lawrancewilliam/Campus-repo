<script>
    import { onMount } from 'svelte';
    import { getCurrentSession, getProjects, getStudents, getActivityLog } from '$lib/storage.js';

    let session = $state(null);
    let projects = $state([]);
    let students = $state([]);
    let activityLog = $state([]);
    let mounted = $state(false);

    // Stats calculations (dynamic, defaulting to 0)
    let totalProjects = $derived(projects.length || 0);
    let totalStudents = $derived(students.length || 0);
    let totalViews = $derived(projects.reduce((sum, p) => sum + (p.views || 0), 0) || 0);
    let totalStars = $derived(projects.reduce((sum, p) => sum + (p.stars || 0), 0) || 0);

    // Distribution arrays
    let categoryDistribution = $derived(getDistribution(projects, 'category'));
    let departmentDistribution = $derived(getDistribution(projects, 'dept'));

    async function loadData() {
        session = getCurrentSession();
        projects = await getProjects();
        students = await getStudents();
        activityLog = await getActivityLog();
    }

    onMount(() => {
        loadData();
        mounted = true;
    });

    function getDistribution(items, key) {
        const counts = {};
        items.forEach(item => {
            const val = item[key] || 'General';
            counts[val] = (counts[val] || 0) + 1;
        });

        const maxVal = Math.max(...Object.values(counts), 1);

        return Object.entries(counts).map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / maxVal) * 100)
        })).sort((a, b) => b.count - a.count);
    }
</script>

<svelte:head>
    <title>CampusRepo — Admin Dashboard</title>
</svelte:head>

{#if mounted && session && session.role === 'admin'}
<main class="main-container">
    <section class="admin-welcome">
        <div>
            <h1>Admin Dashboard</h1>
            <p>Platform Analytics & Moderation Center. Current session: <strong>William (Admin)</strong></p>
        </div>
    </section>

    <!-- Stats Grid -->
    <section class="stats-grid">
        <div class="stat-card yellow-border">
            <div class="stat-icon yellow-bg"><i class="fa-solid fa-folder"></i></div>
            <div class="stat-info">
                <h2>{totalProjects}</h2>
                <p>Total Projects</p>
            </div>
        </div>
        <div class="stat-card blue-border">
            <div class="stat-icon blue-bg"><i class="fa-solid fa-users"></i></div>
            <div class="stat-info">
                <h2>{totalStudents}</h2>
                <p>Registered Students</p>
            </div>
        </div>
        <div class="stat-card green-border">
            <div class="stat-icon green-bg"><i class="fa-solid fa-eye"></i></div>
            <div class="stat-info">
                <h2>{totalViews}</h2>
                <p>Total Views</p>
            </div>
        </div>
        <div class="stat-card red-border">
            <div class="stat-icon red-bg"><i class="fa-solid fa-star"></i></div>
            <div class="stat-info">
                <h2>{totalStars}</h2>
                <p>Total Stars</p>
            </div>
        </div>
    </section>

    <!-- Analytics & Activity Grid -->
    <div class="analytics-grid">
        <!-- Project Distributions -->
        <section class="panel chart-panel">
            <div class="panel-header">
                <h3>Category Distribution</h3>
            </div>
            <div class="chart-list">
                {#each categoryDistribution as cat}
                    <div class="chart-item">
                        <div class="chart-label">
                            <span>{cat.name}</span>
                            <span class="count-badge">{cat.count} ({cat.percentage}%)</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill cat-color" style="width: {cat.percentage}%"></div>
                        </div>
                    </div>
                {:else}
                    <p class="empty-text">No category data yet.</p>
                {/each}
            </div>

            <div class="panel-header" style="margin-top: 2rem;">
                <h3>Department Distribution</h3>
            </div>
            <div class="chart-list">
                {#each departmentDistribution as dept}
                    <div class="chart-item">
                        <div class="chart-label">
                            <span>{dept.name}</span>
                            <span class="count-badge">{dept.count} ({dept.percentage}%)</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill dept-color" style="width: {dept.percentage}%"></div>
                        </div>
                    </div>
                {:else}
                    <p class="empty-text">No department data yet.</p>
                {/each}
            </div>
        </section>

        <!-- System-wide Activity Log -->
        <section class="panel activity-panel">
            <div class="panel-header">
                <h3>Global Activity Feed</h3>
            </div>
            <div class="activity-list">
                {#each activityLog as activity}
                    <div class="activity-item">
                        <div class="activity-icon-wrapper" 
                             class:danger-bg={activity.type === 'delete'} 
                             class:success-bg={activity.type === 'join'}
                             class:warning-bg={activity.type === 'download'}>
                            <i class="fa-solid {activity.type === 'upload' ? 'fa-cloud-arrow-up' : activity.type === 'delete' ? 'fa-trash' : activity.type === 'join' ? 'fa-user-plus' : activity.type === 'download' ? 'fa-download' : 'fa-pen'}"></i>
                        </div>
                        <div class="activity-details">
                            <p class="activity-text">{@html activity.text}</p>
                            <span class="activity-time">{activity.time}</span>
                        </div>
                    </div>
                {:else}
                    <p class="empty-text">No activities logged yet.</p>
                {/each}
            </div>
        </section>
    </div>
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

    .admin-welcome {
        background: var(--bg-hero);
        border: 1px solid var(--border-hero);
        padding: 2.5rem;
        border-radius: 1rem;
        margin-bottom: 2rem;
    }
    .admin-welcome h1 { font-size: 2rem; margin-bottom: 0.5rem; color: var(--text-hero-main); }
    .admin-welcome p { color: var(--text-hero-muted); }

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
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .yellow-border { border-left: 4px solid #fbbf24; }
    .blue-border { border-left: 4px solid #3b82f6; }
    .green-border { border-left: 4px solid #10b981; }
    .red-border { border-left: 4px solid #ef4444; }

    .stat-icon {
        width: 48px; height: 48px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.25rem;
    }
    .yellow-bg { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
    .blue-bg { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .green-bg { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .red-bg { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

    .stat-info h2 { font-size: 1.75rem; color: var(--text-main); font-weight: 800; margin: 0; line-height: 1.2; }
    .stat-info p { color: var(--text-muted); font-size: 0.85rem; font-weight: 500; margin: 4px 0 0; }

    /* Analytics & Activity Grid */
    .analytics-grid {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 1.5rem;
    }
    .panel {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 1.5rem;
    }
    .panel-header {
        border-bottom: 1px solid var(--border);
        padding-bottom: 0.75rem;
        margin-bottom: 1.5rem;
    }
    .panel-header h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin: 0; }

    /* Distribution Charts */
    .chart-list { display: flex; flex-direction: column; gap: 1rem; }
    .chart-item { display: flex; flex-direction: column; gap: 0.5rem; }
    .chart-label { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
    .count-badge { background: var(--bg-panel); color: var(--text-main); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; border: 1px solid var(--border); }
    
    .progress-bar-bg { width: 100%; height: 8px; background: var(--bg-input); border-radius: 4px; overflow: hidden; }
    .progress-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease-out; }
    .cat-color { background: #fbbf24; }
    .dept-color { background: #3b82f6; }

    /* Activity Feed */
    .activity-list { display: flex; flex-direction: column; gap: 0.75rem; max-height: 500px; overflow-y: auto; padding-right: 0.25rem; }
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
        color: #fbbf24;
        font-size: 0.8rem;
        flex-shrink: 0;
    }
    .activity-icon-wrapper.danger-bg { background: rgba(239,68,68,0.1); color: var(--danger); }
    .activity-icon-wrapper.success-bg { background: rgba(16,185,129,0.1); color: var(--success); }
    .activity-icon-wrapper.warning-bg { background: rgba(59,130,246,0.1); color: var(--primary); }
    
    .activity-details { flex: 1; min-width: 0; }
    .activity-text { font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; margin: 0; }
    .activity-text :global(strong) { color: var(--text-main); font-weight: 600; }
    .activity-time { font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 0.15rem; }
    
    .empty-text { color: var(--text-muted); text-align: center; padding: 2rem; font-size: 0.9rem; margin: 0; }

    @media (max-width: 900px) {
        .stats-grid { grid-template-columns: repeat(2, 1fr); }
        .analytics-grid { grid-template-columns: 1fr; }
    }
</style>
