<script>
    import { db } from '$lib/assets/firebase';
    import { toastState } from '$lib/toasts.svelte.js';
    import { collection, addDoc } from 'firebase/firestore';

    let name = '';

    async function saveData() {
        try {
            await addDoc(collection(db, 'students'), {
                name: name
            });
            toastState.addToast({
                title: 'Success',
                message: 'Data saved successfully!',
                type: 'success'
            });
            name = '';
        } catch (err) {
            console.log(err);
            toastState.addToast({ title: 'Error', message: 'Could not save data.', type: 'error' });
        }
    }
</script>

<div class="container">
	<h1>Firebase Test</h1>

	<div class="form-container">
		<input bind:value={name} placeholder="Enter Name" />
		<button on:click={saveData}> Save </button>
	</div>
</div>

<style>
	.container {
		width: 100%;
		max-width: 500px;
		text-align: center; 
		padding: 1rem;
	}
	.form-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	/* On screens wider than 480px, place input and button side-by-side */
	@media (min-width: 480px) {
		.form-container {
			flex-direction: row;
		}
		input {
			flex-grow: 1; /* Allow input to take available space */
		}
	}

	input,
	button {
		padding: 0.8rem;
		font-size: 1rem;
		border-radius: 4px;
		border: 1px solid #ccc;
	}
</style>