<script>
    import { onMount } from 'svelte';
    import { getCurrentSession, updateStudentProfile, deleteStudent, getStudentProjects } from '$lib/storage.js';

    let session = $state(null);
    let myProjects = $state([]);
    let mounted = $state(false);
    let isEditing = $state(false);
    let activeTab = $state('profile');

    let user = $state({
        name: '',
        email: '',
        registerNumber: '',
        department: '',
        academicYear: '',
        bio: '',
        joinedDate: ''
    });

    let passwordForm = $state({
        current: '',
        new: '',
        confirm: ''
    });

    let totalProjects = $derived(myProjects.length);
    let totalViews = $derived(myProjects.reduce((sum, p) => sum + p.views, 0));

    async function loadData() {
        session = getCurrentSession();
        if (session && session.user) {
            user = { ...session.user };
            myProjects = await getStudentProjects(session.user.registerNumber);
        }
    }

    onMount(() => {
        loadData();
        mounted = true;
    });

    function toggleEditMode() {
        isEditing = !isEditing;
        if (!isEditing) {
            // Cancel edit: reset user to session data
            if (session && session.user) {
                user = { ...session.user };
            }
        }
    }

    async function saveProfile() {
        if (!user.name || !user.email) {
            alert("Name and Email are required.");
            return;
        }
        
        const res = await updateStudentProfile(user.registerNumber, {
            name: user.name,
            email: user.email,
            department: user.department,
            academicYear: user.academicYear,
            bio: user.bio
        });

        if (res.success) {
            alert("Profile updated successfully!");
            isEditing = false;
            await loadData();
        } else {
            alert(res.message || "Failed to update profile.");
        }
    }

    async function handleChangePassword() {
        if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
            alert("Please fill all password fields.");
            return;
        }
        if (passwordForm.new !== passwordForm.confirm) {
            alert("New passwords do not match.");
            return;
        }
        if (passwordForm.new.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }
        
        const res = await updateStudentProfile(user.registerNumber, {
            currentPassword: passwordForm.current,
            newPassword: passwordForm.new
        });
        if (res.success) {
            alert("Password changed successfully!");
            passwordForm = { current: '', new: '', confirm: '' };
            await loadData();
        } else {
            alert(res.message || "Failed to change password.");
        }
    }

    async function deleteAccount() {
        if (confirm("Are you sure you want to delete your account? This will permanently delete all your uploaded projects and cannot be undone.")) {
            await deleteStudent(user.registerNumber);
            alert("Your account has been deleted.");
            window.location.href = '/Login';
        }
    }
</script>

<svelte:head>
    <title>CampusRepo — My Profile</title>
</svelte:head>

{#if mounted && session}
<main class="container main-content">
    <div class="profile-layout">
        
        <!-- LEFT SIDEBAR: User Info Card -->
        <aside class="sidebar">
            <div class="profile-card">
                <div class="profile-avatar-large">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <h2>{user.name}</h2>
                <p class="role-badge">Student</p>
                <div class="divider"></div>
                
                <div class="info-row">
                    <i class="fa-solid fa-id-card"></i>
                    <span>{user.registerNumber}</span>
                </div>
                <div class="info-row">
                    <i class="fa-solid fa-building-columns"></i>
                    <span>{user.department}</span>
                </div>
                <div class="info-row">
                    <i class="fa-solid fa-envelope"></i>
                    <span>{user.email}</span>
                </div>
                <div class="info-row">
                    <i class="fa-solid fa-calendar-days"></i>
                    <span>Joined {user.joinedDate || 'Aug 2023'}</span>
                </div>

                <div class="divider"></div>

                <div class="mini-stats">
                    <div class="mini-stat">
                        <h3>{totalProjects}</h3>
                        <span>Projects</span>
                    </div>
                    <div class="mini-stat">
                        <h3>{totalViews}</h3>
                        <span>Views</span>
                    </div>
                </div>
            </div>
        </aside>

        <!-- RIGHT CONTENT: Settings -->
        <section class="content">
            <div class="tabs-header">
                <button class="tab-btn" class:active={activeTab === 'profile'} onclick={() => activeTab = 'profile'}>
                    <i class="fa-solid fa-user"></i> Profile
                </button>
                <button class="tab-btn" class:active={activeTab === 'account'} onclick={() => activeTab = 'account'}>
                    <i class="fa-solid fa-gear"></i> Account
                </button>
            </div>

            <!-- PROFILE TAB -->
            {#if activeTab === 'profile'}
                <div class="settings-card">
                    <div class="card-header">
                        <h3>Personal Information</h3>
                        {#if !isEditing}
                            <button class="btn-outline" onclick={toggleEditMode}>
                                <i class="fa-solid fa-pen"></i> Edit
                            </button>
                        {:else}
                            <div class="edit-actions">
                                <button class="btn-secondary" onclick={toggleEditMode}>Cancel</button>
                                <button class="btn-primary" onclick={saveProfile}>Save</button>
                            </div>
                        {/if}
                    </div>

                    <div class="form-grid">
                        <!-- Full Name -->
                        <div class="input-group">
                            <label for="profile-name">Full Name</label>
                            {#if isEditing}
                                <input id="profile-name" type="text" class="dark-input" bind:value={user.name} placeholder="Enter your full name" />
                            {:else}
                                <div class="display-value">{user.name}</div>
                            {/if}
                        </div>

                        <!-- Email -->
                        <div class="input-group">
                            <label for="profile-email">Email Address</label>
                            {#if isEditing}
                                <input id="profile-email" type="email" class="dark-input" bind:value={user.email} />
                            {:else}
                                <div class="display-value">{user.email}</div>
                            {/if}
                        </div>

                        <!-- Register Number -->
                        <div class="input-group">
                            <label>Register Number</label>
                            <div class="display-value disabled-val">{user.registerNumber} <span class="lock-icon"><i class="fa-solid fa-lock"></i> Locked</span></div>
                        </div>

                        <!-- Department & Year -->
                        <div class="grid-2">
                            <div class="input-group">
                                <label for="profile-dept">Department</label>
                                {#if isEditing}
                                    <select id="profile-dept" class="dark-input" bind:value={user.department}>
                                        <option>CSE</option>
                                        <option>MCA</option>
                                        <option>ECE</option>
                                        <option>IT</option>
                                        <option>EEE</option>
                                        <option>MECH</option>
                                        <option>CIVIL</option>
                                    </select>
                                {:else}
                                    <div class="display-value">{user.department}</div>
                                {/if}
                            </div>
                            <div class="input-group">
                                <label for="profile-year">Academic Year</label>
                                {#if isEditing}
                                    <select id="profile-year" class="dark-input" bind:value={user.academicYear}>
                                        <option>1st Year</option>
                                        <option>2nd Year</option>
                                        <option>3rd Year</option>
                                        <option>4th Year</option>
                                    </select>
                                {:else}
                                    <div class="display-value">{user.academicYear}</div>
                                {/if}
                            </div>
                        </div>

                        <!-- Bio -->
                        <div class="input-group full-width">
                            <label for="profile-bio">Bio</label>
                            {#if isEditing}
                                <textarea id="profile-bio" class="dark-input" rows="4" bind:value={user.bio}></textarea>
                            {:else}
                                <div class="display-value bio-text">{user.bio || 'No bio written yet.'}</div>
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}

            <!-- ACCOUNT TAB -->
            {#if activeTab === 'account'}
                <div class="settings-card">
                    <div class="card-header">
                        <h3>Account Settings</h3>
                    </div>

                    <!-- Change Password -->
                    <div class="password-section">
                        <h4><i class="fa-solid fa-lock"></i> Change Password</h4>
                        
                        <div class="input-group">
                            <label for="pass-current">Current Password</label>
                            <input id="pass-current" type="password" class="dark-input" bind:value={passwordForm.current} placeholder="Enter current password" />
                        </div>
                        
                        <div class="grid-2">
                            <div class="input-group">
                                <label for="pass-new">New Password</label>
                                <input id="pass-new" type="password" class="dark-input" bind:value={passwordForm.new} placeholder="New password" />
                            </div>
                            <div class="input-group">
                                <label for="pass-confirm">Confirm Password</label>
                                <input id="pass-confirm" type="password" class="dark-input" bind:value={passwordForm.confirm} placeholder="Confirm new password" />
                            </div>
                        </div>

                        <button class="btn-primary" style="width: auto;" onclick={handleChangePassword}>
                            Update Password
                        </button>
                    </div>

                    <div class="danger-zone">
                        <h4>Danger Zone</h4>
                        <div class="danger-actions">
                            <div class="info-text">
                                <p>Once you delete your account, there is no going back. All your projects will be deleted permanently.</p>
                            </div>
                            <button class="btn-danger" onclick={deleteAccount}>
                                <i class="fa-solid fa-trash"></i> Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            {/if}

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
        background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
        border-radius: 50%;
        margin: 0 auto 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        font-weight: 700;
        color: white;
        border: 4px solid rgba(59, 130, 246, 0.3);
    }
    .profile-card h2 { font-size: 1.5rem; margin-bottom: 0.25rem; color: var(--text-main); }
    .role-badge { display: inline-block; background: rgba(59, 130, 246, 0.1); color: var(--primary); padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.8rem; font-weight: 600; margin-bottom: 1.5rem; }
    
    .divider { height: 1px; background: var(--border); margin: 1.5rem 0; }

    .info-row { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; color: var(--text-muted); justify-content: flex-start; margin-bottom: 1rem; }
    .info-row i { width: 20px; text-align: center; color: var(--text-muted); }

    .mini-stats { display: flex; justify-content: space-around; margin-top: 1rem; }
    .mini-stat h3 { font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin: 0; }
    .mini-stat span { font-size: 0.8rem; color: var(--text-muted); }

    /* CONTENT AREA */
    .tabs-header { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    .tab-btn {
        padding: 0.75rem 1.5rem;
        background: transparent;
        color: var(--text-muted);
        font-weight: 500;
        border-radius: 0.5rem 0.5rem 0 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s ease;
    }
    .tab-btn:hover { color: var(--text-main); background: rgba(255,255,255,0.05); }
    .tab-btn.active { color: white; background: var(--primary); border-radius: 0.5rem; }

    .settings-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 1rem; padding: 2rem; }

    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .card-header h3 { font-size: 1.25rem; font-weight: 600; color: var(--text-main); }
    
    .edit-actions { display: flex; gap: 0.5rem; }

    .btn-outline { border: 1px solid var(--border); color: var(--text-muted); background: transparent; padding: 0.5rem 1rem; border-radius: 0.5rem; transition: 0.3s; }
    .btn-outline:hover { border-color: var(--text-main); color: var(--text-main); }
    
    .btn-primary { background: var(--primary); color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: background 0.2s; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-secondary { background: var(--bg-panel); border: 1px solid var(--border); color: var(--text-main); padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.05); }

    .form-grid { display: grid; gap: 1.5rem; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

    .input-group { margin-bottom: 1.5rem; }
    .input-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-muted); font-weight: 500; }
    
    .dark-input, .dark-input select, .dark-input textarea {
        width: 100%;
        background: var(--bg-input);
        border: 1px solid var(--border);
        color: var(--text-main);
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        font-family: inherit;
        box-sizing: border-box;
        transition: 0.2s;
    }
    .dark-input:focus { outline: none; border-color: var(--primary); }

    .display-value {
        background: var(--bg-input);
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        color: var(--text-muted);
        min-height: 42px; /* Match input height */
        display: flex;
        align-items: center;
        border: 1px solid var(--border);
        box-sizing: border-box;
    }
    .display-value.disabled-val {
        justify-content: space-between;
        background: var(--bg-panel);
        border-color: var(--border);
    }
    .lock-icon {
        font-size: 0.75rem;
        color: var(--danger);
        background: rgba(239, 68, 68, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
    }
    .display-value.bio-text { min-height: auto; padding: 0.75rem 1rem; line-height: 1.5; white-space: pre-wrap; display: block; }

    /* Password Section */
    .password-section { margin-bottom: 3rem; border-bottom: 1px solid var(--border); padding-bottom: 2rem; }
    .password-section h4 { font-size: 1.1rem; margin-bottom: 1.5rem; display: flex; gap: 0.5rem; align-items: center; color: var(--text-main); }

    /* Danger Zone */
    .danger-zone { margin-top: 1rem; }
    .danger-zone h4 { color: var(--danger); margin-bottom: 1rem; display: flex; gap: 0.5rem; font-size: 1.1rem; }
    .danger-actions { background: rgba(239, 68, 68, 0.05); border: 1px solid var(--danger); padding: 1.5rem; border-radius: 0.5rem; display: flex; justify-content: space-between; align-items: center; }
    .info-text { flex: 1; }
    .info-text p { font-size: 0.9rem; color: var(--text-muted); margin: 0; }
    
    .btn-danger { background: var(--danger); color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 500; display: flex; gap: 0.5rem; align-items: center; cursor: pointer; transition: background 0.2s; }
    .btn-danger:hover { background: var(--danger-hover); }

    @media (max-width: 768px) {
        .profile-layout { grid-template-columns: 1fr; }
        .profile-card { display: flex; flex-direction: column; align-items: center; }
        .profile-avatar-large { width: 80px; height: 80px; font-size: 2rem; margin-bottom: 0.5rem; }
        .mini-stats { display: none; }
        .danger-actions { flex-direction: column; gap: 1rem; text-align: center; }
    }
</style>
