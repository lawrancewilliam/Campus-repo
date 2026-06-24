<script>
    import { onMount } from 'svelte';
    import { getCurrentSession } from '$lib/storage.js';

    let session = $state(null);
    let mounted = $state(false);
    
    let adminData = $state({
        username: 'Admin',
        id: '12345',
        role: 'Administrator',
        email: 'william@sonatech.ac.in',
        joined: 'Jun 2026'
    });

    onMount(() => {
        session = getCurrentSession();
        mounted = true;
    });

    function saveSettings() {
        alert("Settings saved successfully!");
    }
</script>

<svelte:head>
    <title>CampusRepo — Admin Profile</title>
</svelte:head>

{#if mounted && session}
<main class="container main-content">
    <div class="profile-layout">
        
        <!-- SIDEBAR -->
        <aside class="sidebar">
            <div class="profile-card">
                <div class="profile-avatar-large">A</div>
                <h2>William</h2>
                <p class="role-badge">System Admin</p>
                <div class="divider"></div>
                <div class="info-row">
                    <i class="fa-solid fa-user-shield"></i>
                    <span>ID: {adminData.id}</span>
                </div>
                <div class="info-row">
                    <i class="fa-solid fa-envelope"></i>
                    <span>{adminData.email}</span>
                </div>
                <div class="info-row">
                    <i class="fa-solid fa-calendar"></i>
                    <span>Joined: {adminData.joined}</span>
                </div>
            </div>
        </aside>

        <!-- SETTINGS FORM -->
        <section class="content">
            <div class="settings-card">
                <div class="card-header">
                    <h3>Administrative Profile Settings</h3>
                </div>
                
                <form onsubmit={(e) => { e.preventDefault(); saveSettings(); }} class="form-grid">
                    <div class="input-group">
                        <label for="admin-name">Name</label>
                        <input id="admin-name" type="text" class="dark-input" value="William" disabled />
                        <small class="help-text">System display name (read-only).</small>
                    </div>

                    <div class="input-group">
                        <label for="admin-email">Email Address</label>
                        <input id="admin-email" type="email" class="dark-input" bind:value={adminData.email} required />
                    </div>

                    <div class="input-group">
                        <label for="admin-id">Admin ID</label>
                        <input id="admin-id" type="text" class="dark-input" value={adminData.id} disabled />
                        <small class="help-text">Access credentials identification number.</small>
                    </div>

                    <button type="submit" class="btn-primary">
                        Save Changes
                    </button>
                </form>
            </div>
        </section>
    </div>
</main>
{/if}

<style>
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    .main-content { padding: 2rem 0; color: var(--text-main); font-family: 'Inter', sans-serif; }

    .profile-layout {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 2rem;
        margin-top: 1rem;
    }

    /* SIDEBAR */
    .profile-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 2rem;
        text-align: center;
        height: fit-content;
    }
    .profile-avatar-large {
        width: 120px; height: 120px;
        background: linear-gradient(135deg, #fbbf24 0%, #ef4444 100%);
        border-radius: 50%;
        margin: 0 auto 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        font-weight: 700;
        color: white;
        border: 4px solid rgba(251, 191, 36, 0.3);
    }
    .profile-card h2 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .role-badge { display: inline-block; background: rgba(251, 191, 36, 0.1); color: #fbbf24; padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.8rem; font-weight: 600; margin-bottom: 1.5rem; }
    
    .divider { height: 1px; background: var(--border); margin: 1.5rem 0; }

    .info-row { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; color: var(--text-muted); justify-content: flex-start; margin-bottom: 1rem; }
    .info-row i { width: 20px; text-align: center; color: var(--text-muted); }

    /* FORM */
    .settings-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 1rem; padding: 2rem; }
    .card-header { margin-bottom: 2rem; }
    .card-header h3 { font-size: 1.25rem; font-weight: 600; }

    .form-grid { display: flex; flex-direction: column; gap: 1.5rem; }
    .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .input-group label { font-size: 0.9rem; color: var(--text-muted); font-weight: 500; }
    
    .dark-input {
        width: 100%;
        background: var(--bg-input);
        border: 1px solid var(--border);
        color: var(--text-main);
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        font-family: inherit;
        box-sizing: border-box;
    }
    .dark-input:focus { outline: none; border-color: var(--primary); }
    .dark-input:disabled { opacity: 0.6; cursor: not-allowed; background: rgba(0,0,0,0.08); }

    .help-text { font-size: 0.8rem; color: var(--text-muted); }

    .btn-primary { background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: background 0.2s; border: none; font-size: 0.9rem; margin-top: 1rem; }
    .btn-primary:hover { background: #2563eb; }

    @media (max-width: 768px) {
        .profile-layout { grid-template-columns: 1fr; }
        .profile-card { display: flex; flex-direction: column; align-items: center; }
        .profile-avatar-large { width: 80px; height: 80px; font-size: 2rem; }
    }
</style>
