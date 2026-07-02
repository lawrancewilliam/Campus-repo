<script>
    import { loginUser, getStudents } from '$lib/storage.js';
    import { themeState } from '$lib/theme.svelte.js';
    // --- STATE VARIABLES (using $state) ---
    let currentRole = $state('student'); // 'student' | 'admin'
    let identifier = $state('');
    let password = $state('');
    let rememberMe = $state(false);
    let passwordVisible = $state(false);
    let isLoading = $state(false);
    
    // Toast notification state
    let toasts = $state([]);

    // --- DERIVED VALUES (using $derived) ---
    // These automatically recalculate when 'currentRole' changes
    let formTitle = $derived(currentRole === 'admin' ? 'Admin Login' : 'Student Login');
    
    let formSubtext = $derived(
        currentRole === 'admin' 
            ? 'Access the administrative dashboard.' 
            : 'Please enter your credentials to continue.'
    );
    
    let labelIdentifier = $derived(currentRole === 'admin' ? 'Admin Username' : 'Email or Register Number');
    
    let placeholderIdentifier = $derived(
        currentRole === 'admin' ? 'Enter Admin ID (e.g., admin)' : 'student@college.edu or RegNo'
    );
    
    let iconClassIdentifier = $derived(
        currentRole === 'admin' ? 'fa-solid fa-user-shield' : 'fa-solid fa-envelope'
    );
    
    let btnText = $derived(currentRole === 'admin' ? 'Login as Admin' : 'Login as Student');

    // --- FUNCTIONS ---

    function switchRole(role) {
        currentRole = role;
    }

    function togglePassword() {
        passwordVisible = !passwordVisible;
    }

    function forgotPassword() {
        if (!identifier) {
            showToast("Please enter your ID first.", "error");
            return;
        }
        if (currentRole === 'admin') {
            alert("Admin password reset: Please contact the IT Support team.");
        } else {
            alert(`Password reset link sent to: ${identifier}`);
        }
    }

    function showToast(message, type = 'success') {
        const id = Date.now();
        // In runes mode, pushing to the state array triggers reactivity
        toasts.push({ id, message, type });

        // Remove toast after 3 seconds
        setTimeout(() => {
            toasts = toasts.filter(t => t.id !== id);
        }, 3000);
    }

    async function handleLogin(event) {
        event.preventDefault();

        if (identifier.length < 3) {
            showToast("Invalid ID entered", "error");
            return;
        }

        if (password.length < 6) {
            showToast("Password must be at least 6 characters", "error");
            return;
        }

        isLoading = true;

        // Simulating network delay for realistic feedback
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            // Guard against cross logins
            if (currentRole === 'student' && identifier === '12345' && password === 'William26') {
                showToast("This account belongs to an Administrator. Please switch to Admin Login Mode.", "error");
                isLoading = false;
                return;
            }

            if (currentRole === 'admin') {
                const studentsList = await getStudents();
                const student = studentsList.find(s => s.registerNumber === identifier || s.email === identifier);
                if (student) {
                    showToast("This account belongs to a Student. Please switch to Student Login Mode.", "error");
                    isLoading = false;
                    return;
                }
            }

            const result = await loginUser(identifier, password);

            if (result.success) {
                showToast("Login Successful!", "success");

                setTimeout(() => {
                    if (result.role === 'admin') {
                        window.location.href = "/admin/dashboard";
                    } else {
                        window.location.href = "/student/dashboard";
                    }
                }, 1000);
            } else {
                showToast(result.message || "Login failed", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("An error occurred during login", "error");
        }

        isLoading = false;
    }
</script>

<svelte:head>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</svelte:head>

<style>
    /* --- CSS VARIABLE MAPPINGS --- */
    :root {
        --border-color: var(--border);
        --error: var(--danger);
        --success: var(--success);
        --radius: 0.75rem;
        --transition: all 0.3s ease;
    }

    :global(body) {
        font-family: 'Inter', sans-serif; 
        color: var(--text-primary); 
        background-color: var(--bg-color); 
        line-height: 1.6;
        min-height: 100vh;
        margin: 0;
        padding: 0;
    }
    
    :global(a) { text-decoration: none; color: inherit; transition: var(--transition); }
    :global(ul) { list-style: none; }
    :global(button) { cursor: pointer; border: none; font-family: inherit; }

    /* --- NAVBAR --- */
    .navbar {
        background-color: var(--bg-nav);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border-nav);
        height: 80px;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    .nav-container { display: flex; justify-content: space-between; align-items: center; height: 100%; }
    .logo { font-size: 1.5rem; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 0.5rem; }
    .nav-links { display: flex; gap: 2rem; }
    .nav-links a { font-weight: 500; color: var(--text-nav-muted); }
    .nav-links a:hover { color: var(--text-nav); }
    
    .btn { padding: 0.6rem 1.25rem; border-radius: var(--radius); font-weight: 600; font-size: 0.95rem; transition: var(--transition); }
    .btn-outline { border: 1px solid var(--border-nav); color: var(--text-nav); background: transparent; }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); background: rgba(59, 130, 246, 0.1); }
    .btn-primary { background-color: var(--primary); color: white; }
    .btn-primary:hover { background-color: var(--primary-hover); transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

    /* --- LOGIN PAGE LAYOUT --- */
    .login-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        min-height: calc(100vh - 80px); 
    }

    .login-card {
        display: flex;
        width: 100%;
        max-width: 1000px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 1.5rem;
        overflow: hidden;
        box-shadow: var(--card-shadow);
    }

    /* Left Side: Visual/Branding */
    .login-visual {
        flex: 1;
        background: var(--bg-hero);
        border-right: 1px solid var(--border-color);
        padding: 3rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        position: relative;
        overflow: hidden;
    }
    .login-visual::after {
        content: "";
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background-image: linear-gradient(var(--border-color) 1px, transparent 1px),
        linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
        background-size: 30px 30px;
        opacity: 0.05;
    }
    .visual-content { position: relative; z-index: 1; }
    .visual-content h2 { font-size: 2rem; margin-bottom: 1rem; line-height: 1.2; color: var(--text-hero-main); }
    .visual-content p { color: var(--text-hero-muted); font-size: 1.1rem; margin-bottom: 2rem; }
    .visual-stats { display: flex; gap: 1.5rem; }
    .v-stat h4 { font-size: 1.5rem; color: var(--primary); font-weight: 700; }
    .v-stat span { font-size: 0.85rem; color: var(--text-hero-muted); text-transform: uppercase; }

    /* Right Side: Form */
    .login-form-container {
        flex: 1;
        padding: 3rem;
        background: var(--bg-card);
    }

    .form-header { margin-bottom: 1rem; }
    .form-header h2 { font-size: 1.75rem; margin-bottom: 0.5rem; color: var(--text-primary); }
    .form-header p { color: var(--text-secondary); }

    /* --- ROLE TABS --- */
    .role-tabs {
        display: flex;
        background: var(--bg-panel);
        padding: 6px;
        border-radius: 50px;
        margin-bottom: 2rem;
        border: 1px solid var(--border-color);
        position: relative;
    }

    .tab-btn {
        flex: 1;
        height: 48px;
        border-radius: 40px;
        color: var(--text-secondary);
        font-weight: 500;
        font-size: 0.95rem;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                    color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 0.4s ease;
    }

    .tab-btn:hover:not(.active) {
        color: var(--text-primary);
        background: rgba(255, 255, 255, 0.05);
    }

    .tab-btn.active {
        background-color: var(--primary);
        color: white;
    }

    .form-group { margin-bottom: 1.5rem; position: relative; }
    .form-label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-secondary); font-weight: 500; }
    
    .input-wrapper { position: relative; }
    .input-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
    }
    
    .form-input {
        width: 100%;
        padding: 0.8rem 1rem 0.8rem 2.8rem;
        background: var(--bg-input);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        color: var(--text-primary);
        font-size: 1rem;
        transition: var(--transition);
        box-sizing: border-box;
    }
    .form-input:focus {
        outline: none;
        border-color: var(--primary);
    }

    .password-toggle {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
        cursor: pointer;
        background: none;
    }
    .password-toggle:hover { color: var(--text-primary); }

    .form-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        font-size: 0.9rem;
    }
    .checkbox-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        color: var(--text-secondary);
    }
    .checkbox-container input { accent-color: var(--primary); }
    
    .forgot-link { color: var(--primary); font-weight: 500; }
    .forgot-link:hover { text-decoration: underline; }

    .btn-full { width: 100%; padding: 0.8rem; font-size: 1rem; display: flex; justify-content: center; align-items: center; gap: 0.5rem; }

    .form-footer {
        margin-top: 2rem;
        text-align: center;
        font-size: 0.9rem;
        color: var(--text-secondary);
    }
    .form-footer a { color: var(--primary); font-weight: 600; }

    /* --- TOAST NOTIFICATIONS --- */
    #toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .toast {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        padding: 1rem 1.5rem;
        border-radius: var(--radius);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
    }
    .toast.success { border-left: 4px solid var(--success); }
    .toast.error { border-left: 4px solid var(--error); }
    .toast i { font-size: 1.2rem; }
    .toast.success i { color: var(--success); }
    .toast.error i { color: var(--error); }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    /* --- RESPONSIVE --- */
    @media (max-width: 768px) {
        .login-card { flex-direction: column; max-width: 500px; }
        .login-visual { padding: 2rem; min-height: 200px; }
        .login-form-container { padding: 2rem; }
        .nav-links { display: none; }
    }
</style>

<!-- TOAST CONTAINER -->
<div id="toast-container">
    {#each toasts as toast (toast.id)}
        <div class="toast {toast.type}">
            <i class="fa-solid {toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i>
            <span>{toast.message}</span>
        </div>
    {/each}
</div>

<!-- NAVBAR -->
<header class="navbar">
    <div class="container nav-container">
        <a href="/" class="logo">
            <i class="fa-solid fa-graduation-cap"></i> CampusRepo
        </a>
        <nav class="nav-links">
            <a href="/">Home</a>
            <a href="/#about">About</a>
            <a href="/#contact">Contact</a>
        </nav>
        <div class="auth-buttons" style="display: flex; align-items: center; gap: 1rem;">
            <button onclick={() => themeState.toggle()} class="theme-toggle-btn" title="Toggle Theme">
                {#if themeState.theme === 'dark'}
                    ☀️
                {:else}
                    🌙
                {/if}
            </button>
            <a href="/Reg" class="btn btn-outline">Register</a>
        </div>
    </div>
</header>

<!-- MAIN LOGIN CONTENT -->
<main class="login-wrapper">
    <div class="login-card">
        
        <!-- Left Side: Marketing/Info -->
        <div class="login-visual">
            <div class="visual-content">
                <h2>Welcome Back!</h2>
                <p>Access your projects, upload new repositories, and connect with the academic community.</p>
                <div class="visual-stats">
                    <div class="v-stat">
                        <h4>1.2k+</h4>
                        <span>Projects</span>
                    </div>
                    <div class="v-stat">
                        <h4>3.4k+</h4>
                        <span>Students</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Side: Login Form -->
        <div class="login-form-container">
            <div class="form-header">
                <h2>{formTitle}</h2>
                <p>{formSubtext}</p>
            </div>

            <!-- ROLE TABS -->
            <div class="role-tabs">
                <button 
                    type="button" 
                    class="tab-btn" 
                    class:active={currentRole === 'student'} 
                    onclick={() => switchRole('student')}
                >
                    <i class="fa-solid fa-user-graduate"></i> Student
                </button>
                <button 
                    type="button" 
                    class="tab-btn" 
                    class:active={currentRole === 'admin'} 
                    onclick={() => switchRole('admin')}
                >
                    <i class="fa-solid fa-user-shield"></i> Admin
                </button>
            </div>

            <form onsubmit={handleLogin}>
                <!-- Identifier -->
                <div class="form-group">
                    <label class="form-label" for="identifier">{labelIdentifier}</label>
                    <div class="input-wrapper">
                        <i class="{iconClassIdentifier} input-icon"></i>
                        <input 
                            type="text" 
                            id="identifier" 
                            class="form-input" 
                            placeholder={placeholderIdentifier} 
                            bind:value={identifier} 
                            required
                        >
                    </div>
                </div>

                <!-- Password -->
                <div class="form-group">
                    <label class="form-label" for="password">Password</label>
                    <div class="input-wrapper">
                        <i class="fa-solid fa-lock input-icon"></i>
                        <input 
                            type={passwordVisible ? 'text' : 'password'} 
                            id="password" 
                            class="form-input" 
                            placeholder="Enter your password" 
                            bind:value={password} 
                            required
                        >
                        <button type="button" class="password-toggle" onclick={togglePassword} aria-label="Toggle password visibility">
                            <i class="fa-solid {passwordVisible ? 'fa-eye-slash' : 'fa-eye'}"></i>
                        </button>
                    </div>
                </div>

                <!-- Remember Me & Forgot Password -->
                <div class="form-actions">
                    <label class="checkbox-container">
                        <input type="checkbox" bind:checked={rememberMe}>
                        <span>Remember me</span>
                    </label>
                    <button type="button" class="forgot-link" style="background: none; border: none; padding: 0; font-family: inherit; font-size: inherit; cursor: pointer;" onclick={forgotPassword}>Forgot Password?</button>
                </div>

                <!-- Submit Button -->
                <button type="submit" class="btn btn-primary btn-full" disabled={isLoading}>
                    {#if isLoading}
                        <i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...
                    {:else}
                        <span>{btnText}</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    {/if}
                </button>
            </form>

            <div class="form-footer">
                {#if currentRole === 'student'}
                    <p>Don't have an account? <a href="/Reg">Register here</a></p>
                {:else}
                    <p>Authorized access only. <a href="/">Back to Home</a></p>
                {/if}
            </div>
        </div>
    </div>
</main>