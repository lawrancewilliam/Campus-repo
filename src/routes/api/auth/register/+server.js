import { adminDb } from '$lib/firebase-admin.server.js';
import { hashPassword } from '$lib/auth.server.js';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	try {
		const { registerNumber, name, email, password, department, academicYear, mobile } =
			await request.json();

		// 1. Validation
		if (!registerNumber || !email || !password || !name) {
			return json(
				{ success: false, message: 'Missing required registration fields.' },
				{ status: 400 }
			);
		}

		const studentsRef = adminDb.collection('students');

		// 2. Check if Register Number already exists
		const regSnap = await studentsRef.doc(registerNumber).get();
		if (regSnap.exists) {
			return json({ success: false, message: 'Already this ID has been taken.' }, { status: 400 });
		}

		// 3. Check if Email already exists
		const normalizedEmail = email.trim().toLowerCase();
		const emailSnap = await studentsRef.where('email', '==', normalizedEmail).limit(1).get();
		if (!emailSnap.empty) {
			return json({ success: false, message: 'Already this Email has been taken.' }, { status: 400 });
		}

		// 4. Securely hash password
		const passwordHash = await hashPassword(password);

		// 5. Build Student Document
		const newStudent = {
			userId: registerNumber,
			username: name,
			name: name,
			email: normalizedEmail,
			mobile: mobile || '',
			registerNumber: registerNumber,
			department: department || 'CSE',
			academicYear: academicYear || '1st Year',
			bio: 'No bio yet.',
			joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
			bookmarkedProjectIds: [],
			createdAt: new Date().toISOString(),
			// Store passwordHash only
			passwordHash: passwordHash
		};

		// 6. Save in Firestore
		await studentsRef.doc(registerNumber).set(newStudent);

		// 7. Sanitize credentials from response
		const { passwordHash: _, ...safeUser } = newStudent;

		return json({ success: true, message: 'Student registered successfully.', user: safeUser }, { status: 201 });

	} catch (error) {
		console.error('Registration error:', error);
		return json({ success: false, message: error.message || 'Internal server error during registration.' }, { status: 500 });
	}
}