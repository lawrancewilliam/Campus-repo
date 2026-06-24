<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { getCurrentSession, logout } from '$lib/storage.js';
    import { themeState } from '$lib/theme.svelte.js';

    let { children } = $props();
    let session = $state(null);
    let mounted = $state(false);

    onMount(() => {
        session = getCurrentSession();
        mounted = true;
        
        // Route protection
        if (!session || session.role !== 'student') {
            window.location.href = '/Login';
        }
    });
</script>

{#if mounted && session && session.role === 'student'}
    <!-- NAVBAR (Keeps dark theme in both light and dark modes) -->
    <header class="navbar">
        <div class="nav-container">
            <a href="/" class="logo">
                <i class="fa-solid fa-graduation-cap"></i> CampusRepo
            </a>
            
            <nav class="nav-menu" aria-label="Main navigation">
                <a href="/student/dashboard" class="nav-link" class:active={$page.url.pathname === '/student/dashboard'}><i class="fa-solid fa-house"></i> Home</a>
                <a href="/student/explore" class="nav-link" class:active={$page.url.pathname === '/student/explore'}><i class="fa-solid fa-compass"></i> Explore</a>
                <a href="/student/upload" class="nav-link" class:active={$page.url.pathname === '/student/upload'}><i class="fa-solid fa-cloud-arrow-up"></i> Upload</a>
                <a href="/student/my-projects" class="nav-link" class:active={$page.url.pathname === '/student/my-projects'}><i class="fa-solid fa-folder-open"></i> My Projects</a>
                <a href="/student/profile" class="nav-link" class:active={$page.url.pathname === '/student/profile'}><i class="fa-solid fa-user"></i> Profile</a>
            </nav>
            
            <div class="navbar-actions">
                <!-- Theme Toggle -->
                <button onclick={() => themeState.toggle()} class="theme-toggle-btn" title="Toggle Theme">
                    {#if themeState.theme === 'dark'}
                        ☀️
                    {:else}
                        🌙
                    {/if}
                </button>

                <!-- Profile Menu -->
                <a href="/student/profile" class="user-profile" style="text-decoration: none;">
                    <div class="user-avatar">{session.user.name ? session.user.name[0].toUpperCase() : 'S'}</div>
                    <div class="profile-details">
                        <div class="user-name">{session.user.name}</div>
                        <div class="user-name-sub">{session.user.department} '{session.user.academicYear ? session.user.academicYear.substring(0, 3) : ''}</div>
                    </div>
                </a>

                <!-- Logout Button -->
                <button onclick={() => { logout(); window.location.href = '/Login'; }} class="logout-btn-nav" title="Logout">
                    <i class="fa-solid fa-right-from-bracket"></i> Logout
                </button>
            </div>
        </div>
    </header>

    {@render children()}
{/if}

<style>
    .navbar {
        position: sticky;
        top: 0;
        z-index: 100;
        background: var(--bg-nav);
        border-bottom: 1px solid var(--border-nav);
        height: 64px;
        width: 100%;
        color: var(--text-nav);
        font-family: 'Inter', sans-serif;
        box-sizing: border-box;
        transition: background-color 0.3s ease, border-color 0.3s ease;
    }
    .nav-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 100%;
        box-sizing: border-box;
    }
    .logo {
        font-size: 1.2rem;
        font-weight: 800;
        color: var(--primary);
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        letter-spacing: -0.02em;
    }
    .logo i { font-size: 1.4rem; }
    
    .nav-menu { display: flex; gap: 0.35rem; }
    
    .nav-link {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 500;
        text-decoration: none;
        padding: 0.5rem 0.85rem;
        border-radius: 0.5rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 0.4rem;
        border: 1px solid transparent;
    }
    .nav-link:hover { color: #ffffff; background: rgba(255,255,255,0.06); }
    
    /* Navigation Active Glow Indicator */
    .nav-link.active {
        color: #ffffff;
        background: rgba(59, 130, 246, 0.15);
        box-shadow: 0 0 14px rgba(59, 130, 246, 0.35);
        border: 1px solid rgba(59, 130, 246, 0.4);
        text-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
    }
    
    .navbar-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .theme-toggle-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-nav);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        font-size: 1rem;
        transition: all 0.2s;
    }
    .theme-toggle-btn:hover {
        background: rgba(255,255,255,0.12);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .user-profile {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 2rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-nav);
    }
    .user-profile:hover { border-color: rgba(255, 255, 255, 0.3); }
    
    .user-avatar {
        width: 32px; height: 32px;
        background: linear-gradient(135deg, var(--primary), #8b5cf6);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.8rem;
        color: white;
    }
    
    .profile-details {
        display: flex;
        flex-direction: column;
        text-align: left;
    }
    .user-name { font-size: 0.82rem; font-weight: 600; color: #ffffff; }
    .user-name-sub { font-size: 0.68rem; color: rgba(255, 255, 255, 0.5); }
    
    .logout-btn-nav {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #fca5a5;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.8rem;
        border-radius: 0.5rem;
        transition: all 0.2s;
    }
    .logout-btn-nav:hover {
        background: #ef4444;
        color: white;
        border-color: #ef4444;
    }

    @media (max-width: 768px) {
        .profile-details { display: none; }
        .nav-link span { display: none; }
    }
</style>
