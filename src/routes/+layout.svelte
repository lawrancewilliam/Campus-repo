<script>
    import { onMount } from 'svelte';
    import { themeState } from '$lib/theme.svelte.js';
    import { toastState } from '$lib/toasts.svelte.js';
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';

    let { children } = $props();

    onMount(() => {
        themeState.init();
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
</svelte:head>

{@render children()}

<!-- Global Toast Container -->
<div id="global-toast-container">
    {#each toastState.toasts as toast (toast.id)}
        <div class="global-toast {toast.type}">
            <div class="toast-icon">
                {#if toast.type === 'success'}
                    <i class="fa-solid fa-circle-check"></i>
                {:else}
                    <i class="fa-solid fa-circle-exclamation"></i>
                {/if}
            </div>
            <div class="toast-content">
                <strong class="toast-title">{toast.title}</strong>
                <p class="toast-desc">{toast.message}</p>
            </div>
        </div>
    {/each}
</div>

<style>
    #global-toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 400px;
        width: calc(100% - 48px);
        pointer-events: none;
    }

    .global-toast {
        background: #10b981;
        color: white;
        border: 1px solid #059669;
        padding: 1rem 1.25rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
        pointer-events: auto;
        animation: toast-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Inter', sans-serif;
    }

    .global-toast.error {
        background: #ef4444;
        border-color: #dc2626;
    }

    .toast-icon {
        font-size: 1.25rem;
        flex-shrink: 0;
        margin-top: 2px;
    }

    .toast-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .toast-title {
        font-size: 0.92rem;
        font-weight: 700;
    }

    .toast-desc {
        font-size: 0.85rem;
        opacity: 0.95;
        margin: 0;
        line-height: 1.4;
    }

    @keyframes toast-slide-in {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
</style>
