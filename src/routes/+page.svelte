<script>
    import { themeState } from '$lib/theme.svelte.js';

    // --- STATE VARIABLES ---
    let mobileMenuOpen = $state(false);

    // --- NAVIGATION FUNCTIONS ---
    // Note: In a real Svelte SPA, you would use a router like 'svelte-routing' or 'svelte-navigator'.
    // These functions mimic the original behavior of navigating to new HTML pages.
    const navigateToLogin = () => {
        window.location.href = "/Login";
    }; 

    const navigateToRegister = () => {
        window.location.href = "/Reg";
    };

    const navigateToBrowse = () => {
        // Project access requires login
        window.location.href = "/Login";
    };

    const toggleMobileMenu = () => {
        mobileMenuOpen = !mobileMenuOpen;
    };
</script>

<svelte:head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CampusRepo - Student Project Management Repositories</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
</svelte:head>

<!-- Main Container -->
<div class="app-root">
    
    <!-- MODULE 1: INDEX PAGE (DARK THEME) -->
    
    <!-- 1. Navbar -->
    <header class="navbar">
        <div class="container nav-container">
            <a href="/" class="logo">
                <i class="fa-solid fa-graduation-cap"></i> <span>CampusRepo</span>
            </a>

            <!-- Nav Links (Responsive) -->
            <nav class="nav-links" class:active={mobileMenuOpen}>
                <a href="#home" class="active" onclick={() => mobileMenuOpen = false}>Home</a>
                <a href="/Login" onclick={() => mobileMenuOpen = false}>Browse Projects</a>
                <a href="#about" onclick={() => mobileMenuOpen = false}>About</a>
                <a href="#contact" onclick={() => mobileMenuOpen = false}>Contact</a>
                <a href="/Login" class="mobile-nav-only" onclick={() => mobileMenuOpen = false}>Login</a>
                <a href="/Reg" class="mobile-nav-only" onclick={() => mobileMenuOpen = false}>Register</a>
            </nav>
            
            <div class="header-right" style="display: flex; align-items: center; gap: 1rem; margin-left: auto;">
                <button onclick={() => themeState.toggle()} class="theme-toggle-btn" title="Toggle Theme">
                    {#if themeState.theme === 'dark'}
                        ☀️
                    {:else}
                        🌙
                    {/if}
                </button>
                <div class="auth-buttons" style="display: flex; align-items: center; gap: 1rem;">
                    <button class="btn btn-outline" onclick={navigateToLogin}>Login</button>
                    <button class="btn btn-primary" onclick={navigateToRegister}>Register</button>
                </div>
                <!-- Mobile Menu Button -->
                <button class="mobile-menu-btn" onclick={toggleMobileMenu} aria-label="Toggle menu">
                    {#if mobileMenuOpen}
                        <i class="fa-solid fa-xmark"></i>
                    {:else}
                        <i class="fa-solid fa-bars"></i>
                    {/if}
                </button>
            </div>
        </div>
    </header>

    <main>
        <!-- 2. Hero Section -->
        <section class="hero" id="home">
            <div class="container hero-content">
                <div class="hero-text">
                    <h1>Preserve & Share <span>Academic Excellence</span></h1>
                    <p>The centralized project repository for your college. Securely store your code and access thousands of reference projects from seniors.</p>
                    <div class="hero-buttons">
                        <button class="btn btn-primary" onclick={navigateToRegister}>Get Started</button>
                        <button class="btn btn-outline" onclick={navigateToBrowse}>Browse Projects</button>
                    </div>
                </div>
                <div class="hero-image-wrapper">
                    <div class="hero-image">
                        <img src="https://cdn-icons-png.flaticon.com/512/17404/17404308.png" alt="Illustration of a student working on a project with code and gears" />
                    </div>
                </div>
            </div>
        </section>


        <!-- Intro/Features -->
        <section class="section-padding features" id="about">
            <div class="container">
                <div class="section-header">
                    <h2>Why CampusRepo?</h2>
                    <p>Never lose your academic work again. A secure platform designed for students to backup, manage, and discover projects.</p>
                </div>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
                        <h3>Secure Backup</h3>
                        <p>Upload your source code, reports, and presentations to the cloud. Retrieve them anytime for placements or interviews.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fa-solid fa-lightbulb"></i></div>
                        <h3>Knowledge Sharing</h3>
                        <p>Help juniors understand project structures by sharing your work. Learn from the best implementations in your college.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
                        <h3>Advanced Search</h3>
                        <p>Filter projects by domain (AI, IoT), technology stack (MERN, Python), or department to find exactly what you need.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- LOCKED ACCESS SECTION -->
        <section class="section-padding locked-access" id="browse">
            <div class="container">
                <div class="locked-content-wrapper">
                    <div class="lock-icon">
                        <i class="fa-solid fa-lock"></i>
                    </div>
                    <h2 class="section-title">Access Restricted</h2>
                    <p>The project repository is exclusive to registered college students. Please log in to view source codes, download reports, and explore projects uploaded by your peers.</p>
                    <div class="locked-buttons">
                        <button class="btn btn-primary" onclick={navigateToLogin}>Login to View Projects</button>
                        <button class="btn btn-outline" onclick={navigateToRegister}>Create New Account</button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Call to Action -->
        <div class="container">
            <section class="cta-section">
                <h2 class="section-title">Ready to showcase your work?</h2>
                <p>Join CampusRepo today. Upload your first project and start building your public portfolio.</p>
                <button class="btn btn btn-white" onclick={navigateToRegister}>Create Account Now</button>
            </section>
        </div>

    </main>

    <!-- 5. Footer -->
    <footer class="footer" id="contact">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <h2><i class="fa-solid fa-graduation-cap"></i> CampusRepo</h2>
                    <p>A Student Project Management System designed to facilitate academic growth and preserve institutional knowledge.</p>
                    <div class="social-links">
                        <a href="#" class="social-icon"><i class="fa-brands fa-github"></i></a>
                        <a href="#" class="social-icon"><i class="fa-brands fa-linkedin-in"></i></a>
                        <a href="#" class="social-icon"><i class="fa-brands fa-twitter"></i></a>
                    </div>
                </div>
                <div class="footer-col">
                    <h4>Quick Links</h4>
                    <ul class="footer-links">
                        <li><a href="#home">Home</a></li>
                        <li><a href="/student/dashboard">Dashboard</a></li>
                        <li><a href="/student/upload">Upload Project</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Information</h4>
                    <ul class="footer-links">
                        <li><a href="#about">About Us</a></li>
                        <li><a href="#contact">Contact Support</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Contact Us</h4>
                    <ul class="footer-links">
                        <li><i class="fa-solid fa-location-dot"></i> College Campus, Main Block</li>
                        <li><i class="fa-solid fa-phone"></i> +91 98765 43210</li>
                        <li><i class="fa-solid fa-envelope"></i> support@campusrepo.edu</li>
                    </ul>
                </div>
            </div>
            <div class="copyright">
                <p>&copy; 2026 CampusRepo. All rights reserved. | MCA Mini Project</p>
            </div>
        </div>
    </footer>

</div>

<style>
    /*==================================================*/
    /* 1. GLOBAL STYLES & DESIGN SYSTEM                 */
    /*==================================================*/
    :root {
        /* Spacing System (8pt) */
        --space-8: 8px;
        --space-16: 16px;
        --space-24: 24px;
        --space-32: 32px;
        --space-48: 48px;
        --space-64: 64px;
        --space-100: 100px;

        /* Typography */
        --font-hero: clamp(2.25rem, 5vw, 3.75rem); /* 36px to 60px */
        --font-h2: clamp(1.875rem, 4vw, 2.5rem); /* 30px to 40px */
        --font-h3: clamp(1.25rem, 3vw, 1.375rem); /* 20px to 22px */
        --font-body-lg: 1.125rem; /* 18px */
        --font-body-md: 1rem; /* 16px */
        --font-small: 0.875rem; /* 14px */

        /* Transitions */
        --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
        --ease-out: cubic-bezier(0, 0, 0.2, 1);
    }

    :global(body) {
        font-family: 'Inter', sans-serif; 
        color: var(--text-primary); 
        background-color: var(--bg-color); 
        line-height: 1.7;
        margin: 0;
        overflow-x: hidden;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    :global(html) {
        scroll-behavior: smooth;
    }

    :global(*, *::before, *::after) { margin: 0; padding: 0; box-sizing: border-box; }
    
    a { text-decoration: none; color: inherit; }
    ul { list-style: none; }
    button { cursor: pointer; border: none; font-family: inherit; background: none; }

    /*==================================================*/
    /* 2. LAYOUT & UTILITIES                            */
    /*==================================================*/
    .container {
        width: min(92%, 1400px);
        margin-inline: auto;
    }

    .section-padding {
        padding-block: var(--space-100);
    }

    .section-header {
        text-align: center;
        margin-bottom: var(--space-64);
    }

    .section-header h2, .section-title {
        font-size: var(--font-h2);
        font-weight: 700;
        margin-bottom: var(--space-16);
        color: var(--text-primary);
    }

    .section-header p {
        font-size: var(--font-body-lg);
        color: var(--text-secondary);
        max-width: 700px;
        margin-inline: auto;
    }

    /* Animation Utilities */
    .app-root {
        opacity: 0;
        animation: fade-in 0.5s var(--ease-out) 0.2s forwards;
    }
    @keyframes fade-in { to { opacity: 1; } }

    /*==================================================*/
    /* 3. NAVBAR                                        */
    /*==================================================*/
    .navbar {
        background-color: hsla(220, 18%, 11%, 0.8); /* Glassmorphism */
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        position: sticky;
        top: 0;
        z-index: 1000;
        border-bottom: 1px solid var(--border-nav);
        height: 72px;
        transition: background-color 0.3s, border-color 0.3s;
    }

    .nav-container {
        display: flex;
        align-items: center;
        height: 100%;
        position: relative;
    }

    .logo { font-size: 1.5rem; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 0.5rem; }

    .nav-links {
        display: none; /* Hide by default on mobile */
        gap: var(--space-32);
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
    }

    .nav-links a {
        font-weight: 500;
        font-size: var(--font-body-md);
        color: var(--text-nav-muted);
        transition: color 0.2s var(--ease-out);
        padding: var(--space-8) 0;
    }

    .nav-links a:hover, .nav-links a.active { color: var(--text-nav); }
    
    .auth-buttons { margin-left: auto; display: flex; align-items: center; gap: var(--space-16); }

    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 40px;
        padding-inline: var(--space-24);
        border-radius: var(--radius);
        font-weight: 600;
        font-size: var(--font-body-md);
        transition: all 0.2s var(--ease-out);
        white-space: nowrap;
    }

    .btn-outline {
        border: 1px solid var(--border-nav);
        color: var(--text-nav);
        background: transparent;
    }

    .btn-outline:hover { border-color: var(--primary); color: var(--primary); background: rgba(59, 130, 246, 0.1); }
    
    .btn-primary {
        background-color: var(--primary);
        color: white;
        box-shadow: 0 4px 15px -5px hsla(217, 91%, 60%, 0.4);
    }

    .btn-primary:hover {
        background-color: var(--primary-hover);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px -5px hsla(217, 91%, 60%, 0.5);
    }
    
    .mobile-menu-btn {
        display: block; /* Show hamburger on mobile */
        font-size: 1.5rem;
        color: var(--text-nav);
    }

    /*==================================================*/
    /* 4. HERO SECTION                                  */
    /*==================================================*/
    .hero { 
        background: var(--bg-hero);
        border-bottom: 1px solid var(--border-color);
        position: relative; 
        overflow: hidden; 
        display: flex;
        align-items: center;
        min-height: 80vh;
        padding-block: var(--space-100);
    }

    .hero::before {
        content: "";
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background-image: linear-gradient(var(--border-color) 1px, transparent 1px),
                          linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
        background-size: 40px 40px;
        opacity: 0.05;
        z-index: 0;
    }

    .hero-content {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-64);
        align-items: center;
        position: relative;
        z-index: 1;
    }

    .hero-text { animation: slide-up 0.8s var(--ease-out) 0.3s backwards; }

    .hero-text h1 {
        font-size: var(--font-hero);
        font-weight: 800;
        line-height: 1.15;
        margin-bottom: var(--space-24);
        color: var(--text-hero-main);
        letter-spacing: -0.02em;
    }

    .hero-text span { color: var(--primary); }

    .hero-text p {
        font-size: var(--font-body-lg);
        color: var(--text-hero-muted);
        margin-bottom: var(--space-48);
        max-width: 55ch;
    }

    .hero-buttons { display: flex; gap: var(--space-16); }
    .hero-buttons .btn { height: 48px; }
    
    .hero-image-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        animation: slide-up 0.8s var(--ease-out) 0.4s backwards;
    }

    .hero-image {
        position: relative;
        transform: perspective(1500px) rotateY(-8deg);
        transition: transform 0.4s var(--ease-out), border-color 0.3s;
    }

    .hero-image:hover {
        transform: perspective(1500px) rotateY(0deg) scale(1.02);
        border-color: var(--primary);
    }

    .hero-image img {
        width: 100%;
        height: auto;
        border-radius: 16px;
        box-shadow: var(--card-shadow);
        border: 1px solid var(--border-color);
    }

    /*==================================================*/
    /* 5. STATISTICS SECTION                            */
    /*==================================================*/
    .stats-section {
        background-color: var(--bg-panel);
        border-block: 1px solid var(--border-color);
        padding-block: var(--space-64);
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-48);
        text-align: center;
    }

    .stat-card { transition: transform 0.3s var(--ease-out); }
    .stat-card:hover { transform: translateY(calc(-1 * var(--space-8))); }
    .stat-card h3 { font-size: clamp(2rem, 5vw, 2.625rem); font-weight: 700; color: var(--primary); margin-bottom: var(--space-8); }
    .stat-card p { font-size: var(--font-small); color: var(--text-secondary); font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px; }
    .stat-icon { font-size: 28px; color: var(--accent); margin-bottom: var(--space-16); }

    /*==================================================*/
    /* 6. FEATURES SECTION                              */
    /*==================================================*/
    .features-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-32);
    }

    .feature-card {
        background: hsla(220, 18%, 13%, 0.5); /* Glassmorphism */
        padding: var(--space-32);
        border-radius: 20px;
        border: 1px solid var(--border-color);
        text-align: left;
        transition: transform 0.3s var(--ease-out), box-shadow 0.3s, border-color 0.3s;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .feature-card:hover {
        transform: translateY(calc(-1 * var(--space-8)));
        border-color: hsla(217, 91%, 60%, 0.5);
        box-shadow: 0 10px 30px -10px hsla(0, 0%, 0%, 0.2);
    }

    .feature-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: radial-gradient(circle at top left, hsla(217, 91%, 60%, 0.5), transparent 40%);
        opacity: 0;
        transition: opacity 0.4s var(--ease-out);
        pointer-events: none;
    }

    .feature-card:hover::before { opacity: 0.2; }

    .feature-icon {
        width: 56px; height: 56px;
        background: rgba(59, 130, 246, 0.1);
        color: var(--primary);
        border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        font-size: 24px; margin-bottom: var(--space-24);
        flex-shrink: 0;
    }

    .feature-card h3 { margin-bottom: var(--space-8); font-size: var(--font-h3); color: var(--text-primary); }
    .feature-card p { color: var(--text-secondary); font-size: var(--font-body-md); }

    /*==================================================*/
    /* 7. ACCESS & CTA SECTIONS                         */
    /*==================================================*/
    .locked-access {
        background-color: var(--bg-panel);
        border-block: 1px solid var(--border-color);
    }

    .locked-content-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-24);
        text-align: center;
    }

    .lock-icon {
        font-size: 48px;
        color: var(--text-secondary);
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        width: 120px; height: 120px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        margin-bottom: var(--space-8);
    }

    .locked-content-wrapper p { max-width: 65ch; margin-bottom: var(--space-8); }
    .locked-content-wrapper .btn { height: 48px; }

    .cta-section { 
        background: hsla(220, 18%, 13%, 0.5);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        color: var(--text-hero-main); 
        text-align: center; 
        border-radius: 24px; 
        margin-block: var(--space-100); 
        padding: var(--space-64) var(--space-32); 
        position: relative;
        overflow: hidden;
        border: 1px solid var(--border-nav);
    }

    .cta-section p { margin-bottom: var(--space-32); font-size: var(--font-body-lg); color: var(--text-hero-muted); }
    .btn-white { background-color: white; color: var(--bg-color); height: 48px; }
    .btn-white:hover { background-color: var(--primary-hover); }

    /*==================================================*/
    /* 8. FOOTER                                        */
    /*==================================================*/
    .footer {
        background-color: var(--bg-nav);
        color: var(--text-nav-muted);
        padding: var(--space-100) 0 var(--space-32);
        border-top: 1px solid var(--border-nav);
    }

    .footer-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-48);
        margin-bottom: var(--space-64);
    }

    .footer-brand h2 { color: var(--text-nav); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .footer-brand p { max-width: 40ch; }
    .footer-col h4 { color: var(--text-nav); margin-bottom: var(--space-24); font-size: var(--font-body-md); font-weight: 600; }
    .footer-links li { margin-bottom: var(--space-16); }
    .footer-links a { font-size: var(--font-small); transition: color 0.2s var(--ease-out); }
    .footer-links a:hover { color: var(--primary); }
    .social-links { display: flex; gap: var(--space-16); margin-top: var(--space-24); }

    .social-icon {
        width: 40px; height: 40px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border-nav);
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%;
        color: var(--text-nav);
        transition: all 0.2s var(--ease-out);
    }

    .social-icon:hover { background: var(--primary); color: white; border-color: var(--primary); }

    .copyright {
        text-align: center;
        padding-top: var(--space-32);
        border-top: 1px solid var(--border-nav);
        font-size: var(--font-small);
        color: var(--text-nav-muted);
    }

    /*==================================================*/
    /* 9. RESPONSIVE BREAKPOINTS                        */
    /*==================================================*/

    .mobile-nav-only { display: none; }

    /* --- Tablet (768px+) --- */
    @media (min-width: 768px) {
        .nav-links { display: flex; }
        .mobile-menu-btn { display: none; } /* Hide hamburger on desktop */
        .mobile-nav-only { display: none; }

        .hero-content {
            grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
            text-align: left;
        }
        .hero-text p { margin-inline: 0; }
        .hero-buttons { justify-content: flex-start; }

        .stats-grid { grid-template-columns: repeat(4, 1fr); }
        .features-grid { grid-template-columns: repeat(2, 1fr); }
        .footer-grid { grid-template-columns: 2fr 1fr 1fr; gap: var(--space-32); }
    }

    /* --- Laptop (1024px+) --- */
    @media (min-width: 1024px) {
        .features-grid { grid-template-columns: repeat(3, 1fr); }
        .footer-grid { grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: var(--space-48); }
    }

    /* --- Mobile Specifics --- */
    @media (max-width: 767px) {
        .auth-buttons { display: none; } 
        .mobile-nav-only { display: block; }
        .logo span { display: none; }

        .nav-links.active {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-24);
            position: absolute;
            top: 72px; left: 0; width: 100%;
            background: var(--bg-nav);
            padding: var(--space-32);
            box-shadow: var(--shadow-lg);
            border-bottom: 1px solid var(--border-nav);
            animation: fade-in 0.3s;
            z-index: 1000;
        }

        .hero-content { text-align: center; }
        .hero-text p { margin-inline: auto; }
        .hero-buttons { justify-content: center; flex-direction: column; gap: var(--space-12); }
        .hero-buttons .btn { width: 100%; justify-content: center; box-sizing: border-box; }
        .hero-image-wrapper { max-width: 300px; margin: var(--space-32) auto 0; }
        .hero-image { transform: none !important; }
    }

    .locked-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 1.5rem;
    }

    @media (max-width: 576px) {
        .stats-grid { grid-template-columns: 1fr; gap: var(--space-24); }
        .locked-buttons { flex-direction: column; gap: 0.75rem; width: 100%; }
        .locked-buttons .btn { width: 100%; justify-content: center; }
    }

    @keyframes slide-up {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
</style>