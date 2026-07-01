import { db } from '$lib/firebase.server.js';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { json } from '@sveltejs/kit';

export async function GET() {
    try {
        const snap = await getDocs(collection(db, 'activities'));
        const activities = snap.docs.map(doc => doc.data());
        
        // Sort in-memory by timestamp descending to avoid Firestore index setup requirement
        activities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        // Return the latest 50 events
        return json(activities.slice(0, 50));
    } catch (e) {
        console.error('Error fetching activity log:', e);
        return json({ success: false, message: e.message }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const { type, text, time } = await request.json();
        
        if (!type || !text) {
            return json({ success: false, message: 'Missing type or text.' }, { status: 400 });
        }

        const newActivity = {
            type,
            text,
            time: time || 'Just now',
            timestamp: Date.now()
        };
        
        await addDoc(collection(db, 'activities'), newActivity);
        return json({ success: true });
    } catch (e) {
        console.error('Error logging activity:', e);
        return json({ success: false, message: e.message }, { status: 500 });
    }
}
