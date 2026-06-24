<script>
    import { onMount } from 'svelte';
    import { themeState } from '$lib/theme.svelte.js';

    // --- STATE VARIABLES ---
    let mobileMenuOpen = $state(false);

    // --- REFS ---
    let statsSection;
    let counters = [];

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

    // --- STATS ANIMATION LOGIC ---
    const animateValue = (obj, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    const startStatistics = () => {
        if (!counters.length) return;
        
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            animateValue(counter, 0, target, 2000);
        });
    };

    // --- LIFECYCLE ---
    onMount(() => {
        // Initialize counters array
        counters = document.querySelectorAll('.stat-card h3');

        // Intersection Observer to trigger animation when scrolled into view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startStatistics();
                    observer.disconnect(); // Run once
                }
            });
        }, { threshold: 0.5 });

        if (statsSection) {
            observer.observe(statsSection);
        }

        return () => {
            if (statsSection) observer.unobserve(statsSection);
        };
    });
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
                <i class="fa-solid fa-graduation-cap"></i> CampusRepo
            </a>
            
            <!-- Mobile Menu Button -->
            <button class="mobile-menu-btn" onclick={toggleMobileMenu} aria-label="Toggle menu">
                <i class="fa-solid fa-bars"></i>
            </button>

            <!-- Nav Links (Responsive) -->
            <nav class="nav-links" class:active={mobileMenuOpen}>
                <a href="/" class="active">Home</a>
                <a href="/Login">Browse Projects</a>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
            </nav>
            
            <div class="auth-buttons" style="display: flex; align-items: center; gap: 1rem;">
                <button onclick={() => themeState.toggle()} class="theme-toggle-btn" title="Toggle Theme">
                    {#if themeState.theme === 'dark'}
                        ☀️
                    {:else}
                        🌙
                    {/if}
                </button>
                <button class="btn btn-outline" onclick={navigateToLogin}>Login</button>
                <button class="btn btn-primary" onclick={navigateToRegister}>Register</button>
            </div>
        </div>
    </header>

    <main>
        <!-- 2. Hero Section -->
        <section class="hero" id="home">
            <div class="container hero-content">
                <div class="hero-text">
                    <h1>Preserve & Share <br><span>Academic Excellence</span></h1>
                    <p>The centralized project repository for your college. Securely store your code and access thousands of reference projects from seniors.</p>
                    <div class="hero-buttons">
                        <button class="btn btn-primary" onclick={navigateToRegister}>Get Started</button>
                        <button class="btn btn-outline" onclick={navigateToBrowse}>Browse Projects</button>
                    </div>
                </div>
                <div class="hero-image">
                    <!-- Placeholder image adjusted for dark mode context -->
                    <img src="https://cdn-icons-png.flaticon.com/512/17404/17404308.png" alt="Student working on project" width="600" height="400" />
                </div>
            </div>
        </section>

        <!-- 3. Statistics Section -->
        <section class="stats-section section-padding" bind:this={statsSection}>
            <div class="container">
                <div class="stats-grid" id="statsContainer">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fa-solid fa-code-branch"></i></div>
                        <h3 data-target="1250">0</h3>
                        <p>Total Projects</p>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
                        <h3 data-target="3400">0</h3>
                        <p>Registered Students</p>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fa-solid fa-building-columns"></i></div>
                        <h3 data-target="12">0</h3>
                        <p>Departments</p>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fa-solid fa-download"></i></div>
                        <h3 data-target="8900">0</h3>
                        <p>Total Downloads</p>
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
                    <h2>Access Restricted</h2>
                    <p>The project repository is exclusive to registered college students. Please log in to view source codes, download reports, and explore projects uploaded by your peers.</p>
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn btn-primary" onclick={navigateToLogin}>Login to View Projects</button>
                        <button class="btn btn-outline" onclick={navigateToRegister}>Create New Account</button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Call to Action -->
        <div class="container">
            <section class="cta-section">
                <h2>Ready to showcase your work?</h2>
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
                        <li><a href="/">Home</a></li>
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
                <p>&copy; 2023 CampusRepo. All rights reserved. | MCA Mini Project</p>
            </div>
        </div>
    </footer>

</div>

<style>
    /* --- GLOBAL RESET & VARS --- */
    :global(body) {
        font-family: 'Inter', sans-serif; 
        color: var(--text-primary); 
        background-color: var(--bg-color); 
        line-height: 1.6;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        overflow-x: hidden;
    }

    :global(*) { margin: 0; padding: 0; box-sizing: border-box; }
    
    a { text-decoration: none; color: inherit; }
    ul { list-style: none; }
    button { cursor: pointer; border: none; font-family: inherit; background: none; }

    /* --- UTILITIES --- */
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    .section-padding { padding: 5rem 0; }
    .flex-center { display: flex; align-items: center; justify-content: center; }

    /* --- NAVBAR --- */
    .navbar {
        background-color: var(--bg-nav);
        backdrop-filter: blur(12px);
        position: sticky;
        top: 0;
        z-index: 1000;
        border-bottom: 1px solid var(--border-nav);
        height: 80px;
    }
    .nav-container { display: flex; justify-content: space-between; align-items: center; height: 100%; }
    .logo { font-size: 1.5rem; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 0.5rem; }
    .nav-links { display: flex; gap: 2rem; }
    .nav-links a { font-weight: 500; color: var(--text-nav-muted); transition: var(--transition); }
    .nav-links a:hover, .nav-links a.active { color: var(--text-nav); }
    
    .auth-buttons { display: flex; gap: 1rem; }
    .btn { padding: 0.6rem 1.25rem; border-radius: var(--radius); font-weight: 600; font-size: 0.95rem; transition: var(--transition); }
    
    /* Dark Mode Button Styles */
    .btn-outline { border: 1px solid var(--border-nav); color: var(--text-nav); background: transparent; }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); background: rgba(59, 130, 246, 0.1); }
    
    .btn-primary { background-color: var(--primary); color: white; }
    .btn-primary:hover { background-color: var(--primary-hover); transform: translateY(-1px); }
    
    .mobile-menu-btn { display: none; font-size: 1.5rem; color: var(--text-nav); }

    /* --- HERO --- */
    .hero { 
        background: var(--bg-hero);
        border-bottom: 1px solid var(--border-color);
        padding: 6rem 0; 
        position: relative; 
        overflow: hidden; 
    }
    /* Subtle grid pattern overlay */
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

    .hero-content { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; position: relative; z-index: 1; }
    .hero-text h1 { font-size: 3.5rem; font-weight: 800; line-height: 1.1; margin-bottom: 1.5rem; color: var(--text-hero-main); }
    .hero-text span { color: var(--primary); }
    .hero-text p { font-size: 1.125rem; color: var(--text-hero-muted); margin-bottom: 2.5rem; max-width: 500px; }
    .hero-buttons { display: flex; gap: 1rem; }
    
    .hero-image { position: relative; }
    .hero-image img { 
        width: 420px; 
        border-radius: 1rem; 
        box-shadow: var(--card-shadow);
        border: 1px solid var(--border-color);
        transform: perspective(1000px) rotateY(-5deg); 
        transition: var(--transition); 
    }
    .hero-image img:hover { transform: perspective(1000px) rotateY(0deg); border-color: var(--primary); }

    /* --- STATS --- */
    .stats-section { background-color: var(--bg-panel); border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; text-align: center; }
    .stat-card h3 { font-size: 2.5rem; font-weight: 800; color: var(--primary); margin-bottom: 0.5rem; }
    .stat-card p { font-size: 1rem; color: var(--text-secondary); font-weight: 500; text-transform: uppercase; letter-spacing: 1px; font-size: 0.85rem; }
    .stat-icon { font-size: 1.5rem; color: var(--accent); margin-bottom: 0.5rem; }

    /* --- FEATURES --- */
    .features { background-color: var(--bg-color); text-align: center; }
    .section-header { margin-bottom: 4rem; }
    .section-header h2 { font-size: 2.25rem; margin-bottom: 1rem; color: var(--text-primary); }
    .section-header p { color: var(--text-secondary); max-width: 600px; margin: 0 auto; }
    
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
    .feature-card { 
        background: var(--card-bg); 
        padding: 2rem; 
        border-radius: var(--radius); 
        border: 1px solid var(--border-color);
        text-align: left; 
        transition: var(--transition); 
    }
    .feature-card:hover { 
        transform: translateY(-5px); 
        border-color: var(--primary); 
        box-shadow: var(--card-shadow); 
    }
    .feature-icon { 
        width: 50px; height: 50px; 
        background: rgba(59, 130, 246, 0.1); 
        color: var(--primary); 
        border-radius: 12px; 
        display: flex; align-items: center; justify-content: center; 
        font-size: 1.5rem; margin-bottom: 1.5rem; 
    }
    .feature-card h3 { margin-bottom: 0.75rem; font-size: 1.25rem; color: var(--text-primary); }
    .feature-card p { color: var(--text-secondary); font-size: 0.95rem; }

    /* --- LOCKED ACCESS SECTION --- */
    .locked-access {
        background-color: var(--bg-panel);
        border-top: 1px solid var(--border-color);
        border-bottom: 1px solid var(--border-color);
    }
    .locked-content-wrapper { display: flex; flex-direction: column; align-items: center; gap: 2rem; }
    .lock-icon {
        font-size: 4rem; color: var(--text-secondary);
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        width: 100px; height: 100px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
    }
    .locked-content-wrapper h2 { font-size: 2rem; margin-bottom: 0.5rem; color: var(--text-primary); }
    .locked-content-wrapper p { color: var(--text-secondary); max-width: 600px; margin-bottom: 1.5rem; text-align: center; }

    /* --- CTA SECTION --- */
    .cta-section { 
        background: var(--bg-hero); 
        border: 1px solid var(--border-hero);
        color: var(--text-hero-main); 
        text-align: center; 
        border-radius: 1.5rem; 
        margin: 4rem auto; 
        padding: 4rem 2rem; 
        max-width: 1000px; 
        box-shadow: var(--card-shadow);
    }
    .cta-section h2 { margin-bottom: 1rem; font-size: 2rem; }
    .cta-section p { margin-bottom: 2rem; opacity: 0.9; font-size: 1.1rem; color: var(--text-hero-muted); }
    .btn-white { background-color: var(--primary); color: white; }
    .btn-white:hover { background-color: var(--primary-hover); }

    /* --- FOOTER --- */
    .footer { background-color: var(--bg-nav); color: var(--text-nav-muted); padding: 4rem 0 2rem; border-top: 1px solid var(--border-nav); }
    .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: 3rem; margin-bottom: 3rem; }
    .footer-brand h2 { color: var(--text-nav); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .footer-col h4 { color: var(--text-nav); margin-bottom: 1.5rem; font-size: 1.1rem; }
    .footer-links li { margin-bottom: 0.75rem; }
    .footer-links a:hover { color: var(--primary); text-decoration: none; }
    .social-links { display: flex; gap: 1rem; margin-top: 1.5rem; }
    .social-icon { 
        width: 36px; height: 36px; 
        background: rgba(255, 255, 255, 0.05); 
        border: 1px solid var(--border-nav);
        display: flex; align-items: center; justify-content: center; 
        border-radius: 50%; 
        color: var(--text-nav);
        transition: var(--transition); 
    }
    .social-icon:hover { background: var(--primary); color: white; border-color: var(--primary); }
    .copyright { text-align: center; padding-top: 2rem; border-top: 1px solid var(--border-nav); font-size: 0.9rem; color: var(--text-nav-muted); }

    /* --- RESPONSIVE --- */
    @media (max-width: 992px) {
        .hero-content { grid-template-columns: 1fr; text-align: center; gap: 3rem; }
        .hero-text p { margin: 0 auto 2.5rem; }
        .hero-buttons { justify-content: center; }
        .hero-image { max-width: 600px; margin: 0 auto; }
        .stats-grid { grid-template-columns: repeat(2, 1fr); }
        .footer-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 768px) {
        .nav-links, .auth-buttons { display: none; }
        
        /* Svelte Class Toggle for Active State */
        .nav-links.active { 
            display: flex; 
            flex-direction: column; 
            position: absolute; 
            top: 80px; left: 0; width: 100%; 
            background: var(--bg-nav); 
            padding: 2rem; 
            box-shadow: var(--shadow-lg); 
            border-bottom: 1px solid var(--border-nav); 
        }
        
        .mobile-menu-btn { display: block; }
        .hero-text h1 { font-size: 2.5rem; }
        .footer-grid { grid-template-columns: 1fr; }
    }
</style>