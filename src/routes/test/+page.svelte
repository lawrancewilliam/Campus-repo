<script>
    import { db } from '$lib/assets/firebase';
    import { collection, addDoc } from 'firebase/firestore';

    let name = '';

    async function saveData() {
        try {
            await addDoc(collection(db, 'students'), {
                name: name
            });

            alert("Data Saved Successfully");

            name = '';
        } catch (err) {
            console.log(err);
            alert("Error");
        }
    }
</script>

<h1>Firebase Test</h1>

<input bind:value={name} placeholder="Enter Name" />

<button on:click={saveData}>
    Save
</button>