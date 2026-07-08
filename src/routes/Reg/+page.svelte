<script>
    import { registerStudent } from '$lib/storage.js';
    import { themeState } from '$lib/theme.svelte.js';
    // --- CONSTANTS & REGEX ---
    const emailRegex = /^[a-zA-Z0-9._%+-]+@sonatech\.ac\.in$/;
    const mobileRegex = /^[0-9]{10}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    const regnoRegex = /^[a-zA-Z0-9]{5,}$/;

    // --- STATE VARIABLES ---
    let formData = $state({
        firstname: '',
        lastname: '',
        email: '',
        mobile: '',
        regno: '',
        department: '',
        year: '',
        password: '',
        confirmPassword: ''
    });

    let showPassword = $state(false);
    let showConfirmPassword = $state(false);
    let isLoading = $state(false);
    let toasts = $state([]);
    let customDept = $state('');

    // --- DERIVED VALIDATION STATES ---
    let isEmailValid = $derived(emailRegex.test(formData.email));
    let isMobileValid = $derived(mobileRegex.test(formData.mobile));
    let isRegNoValid = $derived(regnoRegex.test(formData.regno));
    let isPasswordValid = $derived(passwordRegex.test(formData.password));
    
    // Check if passwords match only if both have some value
    let doPasswordsMatch = $derived(
        formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword
    );

    // --- FUNCTIONS ---

    function handleMobileInput(event) {
        // Strip non-numeric characters immediately
        formData.mobile = event.target.value.replace(/[^0-9]/g, '');
    }

    function togglePassword(field) {
        if (field === 'password') showPassword = !showPassword;
        if (field === 'confirm') showConfirmPassword = !showConfirmPassword;
    }

    function showToast(message, type = 'success') {
        const id = Date.now();
        toasts.push({ id, message, type });

        setTimeout(() => {
            toasts = toasts.filter(t => t.id !== id);
        }, 3000);
    }

    async function handleRegister(event) {
        event.preventDefault();

        // Validate all fields before sending
        let isValid = true;

        if (!isEmailValid) {
            showToast("Email must be from @sonatech.ac.in domain", "error");
            isValid = false;
        }

        if (!isMobileValid) {
            showToast("Mobile number must be exactly 10 digits", "error");
            isValid = false;
        }

        if (!isRegNoValid) {
            showToast("Register Number seems invalid (min 5 chars)", "error");
            isValid = false;
        }

        if (!isPasswordValid) {
            showToast("Password must be min 6 chars, with 1 Upper, 1 Lower, 1 Number, and 1 Special char.", "error");
            isValid = false;
        }

        if (formData.password !== formData.confirmPassword) {
            showToast("Passwords do not match", "error");
            isValid = false;
        }

        const finalDept = formData.department === 'Others' ? customDept : formData.department;
        if (formData.department === 'Others' && !customDept.trim()) {
            showToast("Please specify your department", "error");
            return;
        }

        if (!isValid) return;

        isLoading = true;

        try {
            const result = await registerStudent({
                name: `${formData.firstname} ${formData.lastname}`,
                email: formData.email,
                mobile: formData.mobile,
                registerNumber: formData.regno,
                password: formData.password,
                department: finalDept,
                academicYear: formData.year ? `${formData.year} Year` : "3rd Year"
            });

            if (!result.success) {
                showToast(result.message, "error");
                isLoading = false;
                return;
            }

            // Simulating network delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            showToast("Registration Successful! Redirecting...", "success");

            setTimeout(() => {
                // Redirect to login page
                window.location.href = "/Login"; 
            }, 1500);

        } catch (error) {
            console.error(error);
            showToast("Registration failed. Please try again.", "error");
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
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

    /* --- REGISTER PAGE LAYOUT --- */
    .register-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        min-height: calc(100vh - 80px);
    }

    .register-card {
        display: flex;
        width: 100%;
        max-width: 1100px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 1.5rem;
        overflow: hidden;
        box-shadow: var(--card-shadow);
    }

    /* Left Side: Visual */
    .register-visual {
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
    .register-visual::after {
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
    .feature-list li {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
        color: var(--text-hero-main);
    }
    .feature-list i { color: var(--accent); }

    /* Right Side: Form */
    .register-form-container {
        flex: 1.2;
        padding: 2.5rem;
        background: var(--bg-card);
        overflow-y: auto;
        max-height: 90vh;
    }

    .form-header { margin-bottom: 2rem; }
    .form-header h2 { font-size: 1.75rem; margin-bottom: 0.5rem; color: var(--text-primary); }
    .form-header p { color: var(--text-secondary); font-size: 0.9rem; }

    /* Form Grid */
    .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
    }
    
    .form-group { margin-bottom: 0.5rem; position: relative; }
    .form-group.full-width { grid-column: span 2; }

    .form-label { display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-secondary); font-weight: 500; }
    
    .input-wrapper { position: relative; }
    .input-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
    
    /* Tick Icon Styling */
    .validation-tick {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--success);
        font-size: 1rem;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
    }
    /* Visible class for Svelte to toggle */
    .validation-tick.visible { opacity: 1; }

    /* Adjust tick position if there is a toggle button */
    .has-toggle .validation-tick {
        right: 3rem; 
    }
    
    .form-input, .form-select {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.8rem;
        padding-right: 2.5rem; /* Right padding for tick */
        background: var(--bg-input);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        color: var(--text-primary);
        font-size: 0.9rem;
        transition: var(--transition);
        appearance: none;
        box-sizing: border-box;
    }

    /* Extra padding for password fields to accommodate both Tick and Eye */
    .form-input.has-icon-right {
        padding-right: 4.5rem; 
    }

    .form-select {
        cursor: pointer;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 1rem center;
        background-size: 1rem;
    }

    .form-input:focus, .form-select:focus {
        outline: none;
        border-color: var(--primary);
    }
    
    /* Success Border State */
    .form-input.valid {
        border-color: var(--success);
    }

    .password-toggle {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
        cursor: pointer;
        background: none;
        z-index: 2;
        padding: 5px;
    }
    .password-toggle:hover { color: var(--text-primary); }

    .btn-full { width: 100%; padding: 0.8rem; font-size: 1rem; margin-top: 1rem; display: flex; justify-content: center; align-items: center; gap: 0.5rem; }

    .form-footer {
        margin-top: 1.5rem;
        text-align: center;
        font-size: 0.9rem;
        color: var(--text-secondary);
    }
    .form-footer a { color: var(--primary); font-weight: 600; }
    
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
            <a href="/Login" class="btn btn-outline">Login</a>
        </div>
    </div>
</header>

<!-- MAIN REGISTER CONTENT -->
<main class="register-wrapper">
    <div class="register-card">
        
        <!-- Left Side: Info -->
        <div class="register-visual">
            <div class="visual-content">
                <h2>Join the Community</h2>
                <p>Create an account to start uploading your projects and exploring the college repository.</p>
                <ul class="feature-list">
                    <li><i class="fa-solid fa-check-circle"></i> Unlimited Project Uploads</li>
                    <li><i class="fa-solid fa-check-circle"></i> Download Reference Materials</li>
                    <li><i class="fa-solid fa-check-circle"></i> Connect with Peers</li>
                </ul>
            </div>
        </div>

        <!-- Right Side: Registration Form -->
        <div class="register-form-container">
            <div class="form-header">
                <h2>Student Registration</h2>
                <p>All fields are mandatory. Password requires special characters.</p>
            </div>

            <form onsubmit={handleRegister}>
                <div class="form-grid">
                    <!-- First Name -->
                    <div class="form-group">
                        <label class="form-label" for="firstname">First Name</label>
                        <div class="input-wrapper">
                            <i class="fa-solid fa-user input-icon"></i>
                            <input type="text" id="firstname" class="form-input" placeholder="John" bind:value={formData.firstname} required>
                        </div>
                    </div>

                    <!-- Last Name -->
                    <div class="form-group">
                        <label class="form-label" for="lastname">Last Name</label>
                        <div class="input-wrapper">
                            <i class="fa-solid fa-user input-icon"></i>
                            <input type="text" id="lastname" class="form-input" placeholder="Doe" bind:value={formData.lastname} required>
                        </div>
                    </div>

                    <!-- Email -->
                    <div class="form-group full-width">
                        <label class="form-label" for="email">Email ID (Must be @sonatech.ac.in)</label>
                        <div class="input-wrapper">
                            <i class="fa-solid fa-envelope input-icon"></i>
                            <!-- Bind valid class using derived state -->
                            <input 
                                type="email" 
                                id="email" 
                                class="form-input" 
                                class:valid={isEmailValid}
                                placeholder="student@sonatech.ac.in" 
                                bind:value={formData.email} 
                                required
                            >
                            <!-- Bind visible class using derived state -->
                            <i class="fa-solid fa-circle-check validation-tick" class:visible={isEmailValid}></i>
                        </div>
                    </div>

                    <!-- Mobile Number -->
                    <div class="form-group">
                        <label class="form-label" for="mobile">Mobile Number</label>
                        <div class="input-wrapper">
                            <i class="fa-solid fa-mobile-screen input-icon"></i>
                            <input 
                                type="tel" 
                                id="mobile" 
                                class="form-input"
                                class:valid={isMobileValid} 
                                placeholder="9876543210" 
                                maxlength="10" 
                                oninput={handleMobileInput}
                                value={formData.mobile}
                                required
                            >
                            <i class="fa-solid fa-circle-check validation-tick" class:visible={isMobileValid}></i>
                        </div>
                    </div>

                    <!-- Register Number -->
                    <div class="form-group">
                        <label class="form-label" for="regno">Register Number</label>
                        <div class="input-wrapper">
                            <i class="fa-solid fa-id-card input-icon"></i>
                            <input 
                                type="text" 
                                id="regno" 
                                class="form-input"
                                class:valid={isRegNoValid}
                                placeholder="e.g., 21MCA001" 
                                bind:value={formData.regno} 
                                required
                            >
                            <i class="fa-solid fa-circle-check validation-tick" class:visible={isRegNoValid}></i>
                        </div>
                    </div>

                    <!-- Department -->
                    <div class="form-group">
                        <label class="form-label" for="department">Department</label>
                        <div class="input-wrapper">
                            <i class="fa-solid fa-building-columns input-icon"></i>
                            <select id="department" class="form-select" bind:value={formData.department} required>
                                <option value="" disabled selected>Select Dept</option>
                                <option value="CSE">Computer Science and Engineering (CSE)</option>
                                <option value="IT">Information Technology (IT)</option>
                                <option value="AI & DS">Artificial Intelligence and Data Science (AI & DS)</option>
                                <option value="ECE">Electronics and Communication Engineering (ECE)</option>
                                <option value="EEE">Electrical and Electronics Engineering (EEE)</option>
                                <option value="MECH">Mechanical Engineering (MECH)</option>
                                <option value="CIVIL">Civil Engineering (CIVIL)</option>
                                <option value="MCT">Mechatronics Engineering (MCT)</option>
                                <option value="BME">Biomedical Engineering (BME)</option>
                                <option value="CSD">Computer Science and Design (CSD)</option>
                                <option value="FT">Fashion Technology (FT)</option>
                                <option value="MCA">MCA</option>
                                <option value="MBA">MBA</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>
                    </div>

                    <!-- Academic Year -->
                    <div class="form-group">
                        <label class="form-label" for="year">Academic Year</label>
                        <div class="input-wrapper">
                            <i class="fa-solid fa-calendar input-icon"></i>
                            <select id="year" class="form-select" bind:value={formData.year} required>
                                <option value="" disabled selected>Select Year</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                            </select>
                        </div>
                    </div>

                    {#if formData.department === 'Others'}
                        <div class="form-group full-width animate-fade-in" style="margin-bottom: 0.5rem;">
                            <label class="form-label" for="custom-dept">Specify Department <span class="required">*</span></label>
                            <div class="input-wrapper">
                                <i class="fa-solid fa-building-columns input-icon"></i>
                                <input type="text" id="custom-dept" class="form-input" bind:value={customDept} placeholder="Enter your department name" required>
                            </div>
                        </div>
                    {/if}

                    <!-- Password -->
                    <div class="form-group full-width">
                        <label class="form-label" for="password">Password (Min 6 chars: 1 Upper, 1 Lower, 1 Number, 1 Special)</label>
                        <div class="input-wrapper has-toggle">
                            <i class="fa-solid fa-lock input-icon"></i>
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                id="password" 
                                class="form-input has-icon-right"
                                class:valid={isPasswordValid}
                                placeholder="Ex: Student@123" 
                                bind:value={formData.password} 
                                required
                            >
                            <i class="fa-solid fa-circle-check validation-tick" class:visible={isPasswordValid}></i>
                            <button type="button" class="password-toggle" onclick={() => togglePassword('password')} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                <i class="fa-solid {showPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Confirm Password -->
                    <div class="form-group full-width">
                        <label class="form-label" for="confirmPassword">Confirm Password</label>
                        <div class="input-wrapper has-toggle">
                            <i class="fa-solid fa-lock input-icon"></i>
                            <input 
                                type={showConfirmPassword ? 'text' : 'password'} 
                                id="confirmPassword" 
                                class="form-input has-icon-right"
                                class:valid={doPasswordsMatch && formData.confirmPassword.length > 0}
                                placeholder="Re-enter password" 
                                bind:value={formData.confirmPassword} 
                                required
                            >
                            <!-- Only show tick if passwords match and confirm field is not empty -->
                            {#if doPasswordsMatch}
                                <i class="fa-solid fa-circle-check validation-tick visible"></i>
                            {/if}
                            
                            <button type="button" class="password-toggle" onclick={() => togglePassword('confirm')} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                                <i class="fa-solid {showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Submit Button -->
                <button type="submit" class="btn btn-primary btn-full" disabled={isLoading}>
                    {#if isLoading}
                        <i class="fa-solid fa-circle-notch fa-spin"></i> Creating Account...
                    {:else}
                        <span>Create Account</span>
                        <i class="fa-solid fa-user-plus"></i>
                    {/if}
                </button>
            </form>

            <div class="form-footer">
                <p>Already have an account? <a href="/Login">Login here</a></p>
            </div>
        </div>
    </div>
</main>