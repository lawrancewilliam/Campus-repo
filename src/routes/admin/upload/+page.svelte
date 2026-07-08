<script>
    import { onMount } from 'svelte';
    import { getCurrentSession, getStudents, uploadProject } from '$lib/storage.js';
    import { toastState } from '$lib/toasts.svelte.js';

    let session = $state(null);
    let students = $state([]);
    let mounted = $state(false);
    let isUploading = $state(false);

    let formData = $state({
        title: '',
        abstract: '',
        domain: '',
        semester: '',
        academicYear: '',
        teamLeader: '',
        teamMembers: '',
        frontendTech: '',
        backendTech: '',
        database: '',
        toolsUsed: '',
        tags: '',
        visibility: 'Public',
        selectedAuthor: 'admin' // default to Admin
    });

    let customDomain = $state('');

    let files = $state({
        sourceCode: null,
        report: null,
        presentation: null,
        readme: null
    });

    const domains = [
        "Web Development", "Mobile Applications", "Artificial Intelligence", 
        "Machine Learning", "Cloud Computing", "Data Science", 
        "Internet of Things", "Cyber Security", "Others"
    ];

    onMount(async () => {
        session = getCurrentSession();
        students = await getStudents();
        mounted = true;
    });

    function handleFileSelect(event, type) {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            // Check file size (100MB limit)
            const maxFileSize = 100 * 1024 * 1024;
            if (selectedFile.size > maxFileSize) {
                alert("File size exceeds 100MB limit.");
                return;
            }
            files[type] = selectedFile;
        }
    }

    function triggerFileInput(inputId) {
        document.getElementById(inputId).click();
    }

    async function handleSubmit() {
        const finalDomain = formData.domain === 'Others' ? customDomain : formData.domain;
        if (!formData.title || !formData.abstract || !finalDomain) {
            alert("Please fill in the required fields (Title, Abstract, Domain).");
            return;
        }

        // Determine which file is the primary file to upload
        const fileToUpload = files.sourceCode || files.report || files.presentation || files.readme;
        if (!fileToUpload) {
            alert("Please select at least one file to upload (Source Code ZIP, Report PDF, or Presentation PPT).");
            return;
        }

        isUploading = true;

        try {
            let authorUser = { name: 'Admin', registerNumber: '12345', department: 'Admin' };
            
            if (formData.selectedAuthor !== 'admin') {
                const found = students.find(s => s.registerNumber === formData.selectedAuthor);
                if (found) {
                    authorUser = found;
                }
            }

            const projectData = {
                title: formData.title,
                abstract: formData.abstract,
                domain: finalDomain,
                visibility: formData.visibility
            };

            const result = await uploadProject(projectData, fileToUpload, authorUser);
            isUploading = false;
            
            if (result.success) {
                toastState.show("Your project has been saved and is now available for viewing.", "success");
                window.location.href = '/admin/dashboard';
            } else {
                alert(result.message || "Upload failed. Please try again.");
            }
        } catch (err) {
            isUploading = false;
            console.error(err);
            alert("An error occurred during upload.");
        }
    }

    function handleTagKeydown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const newTag = event.target.value.trim();
            if (newTag && !formData.tags.includes(newTag)) {
                formData.tags += (formData.tags ? ', ' : '') + newTag;
                event.target.value = '';
            }
        }
    }
</script>

<svelte:head>
    <title>CampusRepo — Admin Upload Project</title>
</svelte:head>

{#if mounted && session}
<main class="container main-content">
    <div class="page-header">
        <h1>Upload New Project (Admin Control)</h1>
        <p>Publish a project repository or report on behalf of any student or administration account.</p>
    </div>

    <div class="upload-layout">
        <!-- LEFT COLUMN: FORM -->
        <div class="form-card">
            <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                
                <!-- Admin Author Picker -->
                <div class="form-section highlight-section">
                    <h3><i class="fa-solid fa-user-pen"></i> Assign Project Author</h3>
                    <div class="form-group">
                        <label for="author-select">Author Owner <span class="required">*</span></label>
                        <select id="author-select" class="dark-input highlight-select" bind:value={formData.selectedAuthor}>
                            <option value="admin">Administrator (CampusRepo Admin)</option>
                            {#each students as student}
                                <option value={student.registerNumber}>{student.name} ({student.registerNumber} - {student.department})</option>
                            {/each}
                        </select>
                    </div>
                </div>

                <!-- 1. Project Information -->
                <div class="form-section">
                    <h3><i class="fa-solid fa-circle-info"></i> Project Information</h3>
                    
                    <div class="form-group">
                        <label for="project-title">Project Title <span class="required">*</span></label>
                        <input id="project-title" type="text" class="dark-input" bind:value={formData.title} placeholder="e.g. AI Based Attendance System" required />
                    </div>

                    <div class="form-group">
                        <label for="project-abstract">Abstract <span class="required">*</span></label>
                        <textarea id="project-abstract" class="dark-input" bind:value={formData.abstract} rows="4" placeholder="Brief description of the project objectives and outcomes..." required></textarea>
                    </div>

                    <div class="grid-row-2">
                        <div class="form-group">
                            <label for="project-domain">Domain / Category <span class="required">*</span></label>
                            <select id="project-domain" class="dark-input" bind:value={formData.domain} required>
                                <option value="" disabled selected>Select Domain</option>
                                {#each domains as domain}
                                    <option value={domain}>{domain}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="project-sem">Semester</label>
                            <select id="project-sem" class="dark-input" bind:value={formData.semester}>
                                <option value="" disabled selected>Select Semester</option>
                                <option value="1">1st Semester</option>
                                <option value="2">2nd Semester</option>
                                <option value="3">3rd Semester</option>
                                <option value="4">4th Semester</option>
                                <option value="5">5th Semester</option>
                                <option value="6">6th Semester</option>
                                <option value="7">7th Semester</option>
                                <option value="8">8th Semester</option>
                            </select>
                        </div>
                    </div>

                    {#if formData.domain === 'Others'}
                        <div class="form-group animate-fade-in" style="margin-bottom: 1.5rem;">
                            <label for="custom-domain">Specify Other Domain <span class="required">*</span></label>
                            <input id="custom-domain" type="text" class="dark-input" bind:value={customDomain} placeholder="e.g. Blockchain, Bioinformatics, Cybersecurity" required />
                        </div>
                    {/if}

                    <div class="form-group">
                        <label for="project-year">Academic Year</label>
                        <input id="project-year" type="text" class="dark-input" bind:value={formData.academicYear} placeholder="e.g. 2023-2024" />
                    </div>
                </div>

                <!-- 2. Team Details -->
                <div class="form-section">
                    <h3><i class="fa-solid fa-users"></i> Team Details</h3>
                    
                    <div class="form-group">
                        <label for="project-leader">Team Leader</label>
                        <input id="project-leader" type="text" class="dark-input" bind:value={formData.teamLeader} placeholder="Your Name" />
                    </div>

                    <div class="form-group">
                        <label for="project-members">Team Members</label>
                        <input id="project-members" type="text" class="dark-input" bind:value={formData.teamMembers} placeholder="Comma separated names" />
                        <small class="help-text">e.g. John Doe, Jane Smith</small>
                    </div>
                </div>

                <!-- 3. Technology Stack -->
                <div class="form-section">
                    <h3><i class="fa-solid fa-code"></i> Technology Stack</h3>
                    
                    <div class="grid-row-2">
                        <div class="form-group">
                            <label for="project-frontend">Frontend</label>
                            <input id="project-frontend" type="text" class="dark-input" bind:value={formData.frontendTech} placeholder="e.g. React, HTML, Tailwind" />
                        </div>
                        <div class="form-group">
                            <label for="project-backend">Backend</label>
                            <input id="project-backend" type="text" class="dark-input" bind:value={formData.backendTech} placeholder="e.g. Node.js, Express, Flask" />
                        </div>
                    </div>
                    <div class="grid-row-2">
                        <div class="form-group">
                            <label for="project-db">Database</label>
                            <input id="project-db" type="text" class="dark-input" bind:value={formData.database} placeholder="e.g. MongoDB, MySQL" />
                        </div>
                        <div class="form-group">
                            <label for="project-tools">Tools / Other</label>
                            <input id="project-tools" type="text" class="dark-input" bind:value={formData.toolsUsed} placeholder="e.g. Git, VS Code, Postman" />
                        </div>
                    </div>
                </div>

                <!-- 4. Files Upload -->
                <div class="form-section">
                    <h3><i class="fa-solid fa-file-arrow-up"></i> Upload Files</h3>
                    
                    <div class="file-grid">
                        <!-- Source Code -->
                        <div class="file-upload-box" onclick={() => triggerFileInput('file-source')} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && triggerFileInput('file-source')}>
                            <input type="file" id="file-source" accept=".zip,.rar,.7z" hidden onchange={(e) => handleFileSelect(e, 'sourceCode')} />
                            <i class="fa-solid fa-file-zipper" aria-hidden="true"></i>
                            <div class="file-info">
                                <h4>Source Code (ZIP)</h4>
                                <p>{files.sourceCode ? files.sourceCode.name : 'Max 100MB'}</p>
                            </div>
                            <i class="fa-solid fa-upload" aria-hidden="true"></i>
                        </div>

                        <!-- Report -->
                        <div class="file-upload-box" onclick={() => triggerFileInput('file-report')} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && triggerFileInput('file-report')}>
                            <input type="file" id="file-report" accept=".pdf" hidden onchange={(e) => handleFileSelect(e, 'report')} />
                            <i class="fa-solid fa-file-pdf" aria-hidden="true"></i>
                            <div class="file-info">
                                <h4>Final Report (PDF)</h4>
                                <p>{files.report ? files.report.name : 'Required'}</p>
                            </div>
                            <i class="fa-solid fa-upload" aria-hidden="true"></i>
                        </div>

                        <!-- Presentation -->
                        <div class="file-upload-box" onclick={() => triggerFileInput('file-ppt')} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && triggerFileInput('file-ppt')}>
                            <input type="file" id="file-ppt" accept=".ppt,.pptx" hidden onchange={(e) => handleFileSelect(e, 'presentation')} />
                            <i class="fa-solid fa-file-powerpoint" aria-hidden="true"></i>
                            <div class="file-info">
                                <h4>Presentation (PPT)</h4>
                                <p>{files.presentation ? files.presentation.name : 'Optional'}</p>
                            </div>
                            <i class="fa-solid fa-upload" aria-hidden="true"></i>
                        </div>

                        <!-- README -->
                        <div class="file-upload-box" onclick={() => triggerFileInput('file-readme')} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && triggerFileInput('file-readme')}>
                            <input type="file" id="file-readme" accept=".md,.txt" hidden onchange={(e) => handleFileSelect(e, 'readme')} />
                            <i class="fa-solid fa-file-lines" aria-hidden="true"></i>
                            <div class="file-info">
                                <h4>README File</h4>
                                <p>{files.readme ? files.readme.name : 'Recommended'}</p>
                            </div>
                            <i class="fa-solid fa-upload" aria-hidden="true"></i>
                        </div>
                    </div>
                </div>

                <!-- 5. Tags & Visibility -->
                <div class="form-section">
                    <h3><i class="fa-solid fa-tags"></i> Settings</h3>
                    
                    <div class="form-group">
                        <label for="project-tags">Tags (Press Enter to add)</label>
                        <input 
                            id="project-tags"
                            type="text" 
                            class="dark-input" 
                            placeholder="e.g. Python, MERN, IoT" 
                            onkeydown={handleTagKeydown} 
                        />
                        <div class="tags-display">
                            {#each formData.tags.split(',').filter(t => t.trim() !== '') as tag}
                                <span class="tag-chip">{tag}</span>
                            {/each}
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Visibility</label>
                        <div class="visibility-options">
                            <label class="radio-option">
                                <input type="radio" bind:group={formData.visibility} value="Public" />
                                <span class="radio-custom"></span>
                                <div class="radio-text">
                                    <strong>Public</strong>
                                    <small>Visible to all students and faculty.</small>
                                </div>
                            </label>
                            <label class="radio-option">
                                <input type="radio" bind:group={formData.visibility} value="Private" />
                                <span class="radio-custom"></span>
                                <div class="radio-text">
                                    <strong>Private</strong>
                                    <small>Only visible to you and admins.</small>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Submit Button -->
                <div class="form-actions">
                    <button type="submit" class="btn-primary" disabled={isUploading}>
                        {#if isUploading}
                            <i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> Uploading...
                        {:else}
                            <i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i> Publish Project
                        {/if}
                    </button>
                </div>

            </form>
        </div>

        <!-- RIGHT COLUMN: TIPS -->
        <aside class="sidebar">
            <div class="info-card">
                <h3><i class="fa-solid fa-lightbulb" aria-hidden="true"></i> Upload Guidelines</h3>
                <ul>
                    <li>Select a registered student owner to associate the project with their portfolio dashboard.</li>
                    <li>Choose "Administrator" if this is a generic template project.</li>
                    <li>Include a README.md file for installation steps.</li>
                </ul>
            </div>
        </aside>

    </div>
</main>
{/if}

<style>
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    .main-content { padding: 2rem 0 4rem; color: var(--text-main); font-family: 'Inter', sans-serif; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; margin-bottom: 0.5rem; color: var(--text-main); }
    .page-header p { color: var(--text-muted); }

    .upload-layout {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 2rem;
    }

    /* --- FORM CARD --- */
    .form-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 2rem;
    }

    .form-section {
        margin-bottom: 2.5rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid var(--border);
    }
    .form-section:last-child { border-bottom: none; margin-bottom: 0; }
    
    .highlight-section {
        background: rgba(251, 191, 36, 0.04);
        padding: 1.5rem;
        border-radius: 0.75rem;
        border: 1px solid rgba(251, 191, 36, 0.15);
    }
    .highlight-select {
        border-color: rgba(251, 191, 36, 0.3) !important;
    }

    .form-section h3 {
        font-size: 1.1rem;
        margin-bottom: 1.5rem;
        color: var(--primary);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .highlight-section h3 {
        color: #fbbf24;
    }

    .form-group { margin-bottom: 1.25rem; }
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        color: var(--text-muted);
        font-weight: 500;
    }
    .required { color: #ef4444; }

    .dark-input, .dark-input select, .dark-input textarea {
        width: 100%;
        background: var(--bg-input);
        border: 1px solid var(--border);
        color: var(--text-main);
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        font-family: inherit;
        transition: 0.2s;
        box-sizing: border-box;
    }
    .dark-input:focus, .dark-input select:focus, .dark-input textarea:focus {
        outline: none;
        border-color: var(--primary);
    }

    .grid-row-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .help-text { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; }

    /* --- FILE UPLOAD --- */
    .file-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }
    .file-upload-box {
        background: var(--bg-input);
        border: 1px dashed var(--border);
        border-radius: 0.75rem;
        padding: 1.5rem;
        text-align: center;
        cursor: pointer;
        transition: 0.2s;
        position: relative;
        overflow: hidden;
    }
    .file-upload-box:hover {
        border-color: var(--primary);
        background: rgba(59, 130, 246, 0.05);
    }
    .file-upload-box i.fa-file-zipper { color: #fbbf24; font-size: 2rem; margin-bottom: 0.5rem; }
    .file-upload-box i.fa-file-pdf { color: #ef4444; font-size: 2rem; margin-bottom: 0.5rem; }
    .file-upload-box i.fa-file-powerpoint { color: #f97316; font-size: 2rem; margin-bottom: 0.5rem; }
    .file-upload-box i.fa-file-lines { color: #3b82f6; font-size: 2rem; margin-bottom: 0.5rem; }
    
    .file-upload-box .fa-upload {
        position: absolute;
        top: 10px;
        right: 10px;
        color: var(--text-muted);
    }

    .file-info h4 { font-size: 0.95rem; margin-bottom: 0.2rem; color: var(--text-main); }
    .file-info p { font-size: 0.8rem; color: var(--text-muted); }

    /* --- TAGS --- */
    .tags-display { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .tag-chip {
        background: rgba(59, 130, 246, 0.1);
        color: var(--primary);
        padding: 0.25rem 0.75rem;
        border-radius: 50px;
        font-size: 0.8rem;
        border: 1px solid rgba(59, 130, 246, 0.2);
    }

    /* --- VISIBILITY RADIO --- */
    .visibility-options { display: flex; flex-direction: column; gap: 1rem; }
    .radio-option {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: var(--bg-input);
        padding: 1rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        cursor: pointer;
    }
    .radio-option:has(input:checked) {
        border-color: var(--primary);
        background: rgba(59, 130, 246, 0.05);
    }
    .radio-option input { display: none; }
    .radio-custom {
        width: 20px; height: 20px;
        border: 2px solid var(--text-muted);
        border-radius: 50%;
        position: relative;
    }
    .radio-option:has(input:checked) .radio-custom {
        border-color: var(--primary);
        background: var(--primary);
    }
    .radio-option:has(input:checked) .radio-custom::after {
        content: '';
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 8px; height: 8px;
        background: white;
        border-radius: 50%;
    }
    .radio-text strong { display: block; color: var(--text-main); }
    .radio-text small { display: block; color: var(--text-muted); font-size: 0.8rem; }

    /* --- BUTTONS --- */
    .btn-primary {
        background: var(--primary);
        color: white;
        border: none;
        padding: 0.8rem 1.5rem;
        border-radius: 0.75rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        cursor: pointer;
        width: 100%;
        transition: 0.2s;
    }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

    /* --- SIDEBAR --- */
    .sidebar { position: sticky; top: 100px; height: fit-content; }
    .info-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        padding: 1.5rem;
        border-radius: 0.75rem;
        margin-bottom: 1.5rem;
    }
    .info-card h3 { font-size: 1rem; margin-bottom: 1rem; color: var(--primary); }
    .info-card ul { list-style: none; padding: 0; }
    .info-card ul li {
        position: relative;
        padding-left: 1.25rem;
        margin-bottom: 0.75rem;
        font-size: 0.9rem;
        color: var(--text-muted);
        line-height: 1.4;
    }
    .info-card ul li::before {
        content: "•";
        color: var(--primary);
        position: absolute;
        left: 0;
        font-weight: bold;
    }

    @media (max-width: 900px) {
        .upload-layout { grid-template-columns: 1fr; }
        .sidebar { position: static; }
    }
</style>
