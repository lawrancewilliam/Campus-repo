<!-- This layout is now empty because the global styles are in the root layout -->
<div class="center-container">
    <slot />
</div>

<style>
    .center-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 1rem;
    }
</style>