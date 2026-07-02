/**
 * Secure Student Authentication System Backend
 * Node.js + Express + Firebase Admin SDK
 * 
 * Satisfies requirements:
 * 1. Removing plain-text passwords
 * 2. Hashing passwords before storing using bcryptjs (saltRounds = 10)
 * 3. Never storing original passwords
 * 4. Safe user migration on next login
 * 5. Production-grade security & Firestore sanitization
 */

import express from 'express';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-key-for-local-dev';
const SALT_ROUNDS = 10;

// ==========================================
// 1. FIREBASE ADMIN SDK INITIALIZATION
// ==========================================
// In production, ensure GOOGLE_APPLICATION_CREDENTIALS points to your service account key file
// or supply env variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            // Fallback to default credentials, or initialization using environment properties
            admin.initializeApp({
                credential: admin.credential.applicationDefault()
            });
        }
        console.log('✅ Firebase Admin SDK initialized successfully.');
    } catch (error) {
        console.warn('⚠️ Firebase initialization warning:', error.message);
        console.warn('Running with placeholder mock/local configuration. Ensure environment variables are loaded in production.');
    }
}

const db = admin.firestore();

// ==========================================
// 2. HELPER UTILITIES
// ==========================================
/**
 * Generate secure JWT token containing student information.
 */
function generateToken(student) {
    const payload = {
        userId: student.registerNumber,
        registerNumber: student.registerNumber,
        email: student.email,
        username: student.name,
        role: 'student',
        department: student.department || 'CSE'
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Middleware to authenticate JWT tokens and attach user info to the request.
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized access. Token required.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
        }
        req.user = user;
        next();
    });
}

// ==========================================
// 3. API ENDPOINTS
// ==========================================

/**
 * POST /api/auth/register
 * Register a new student account securely.
 */
app.post('/api/auth/register', async (req, res) => {
    try {
        const { registerNumber, name, email, password, department, academicYear, mobile } = req.body;

        // 1. Validation
        if (!registerNumber || !email || !password || !name) {
            return res.status(400).json({ success: false, message: 'Missing required registration fields.' });
        }

        const studentsRef = db.collection('students');

        // 2. Check if Register Number already exists
        const regSnap = await studentsRef.doc(registerNumber).get();
        if (regSnap.exists) {
            return res.status(400).json({ success: false, message: 'Register Number already exists.' });
        }

        // 3. Check if Email already exists
        const emailSnap = await studentsRef.where('email', '==', email).limit(1).get();
        if (!emailSnap.empty) {
            return res.status(400).json({ success: false, message: 'Email already exists.' });
        }

        // 4. Securely hash password using bcrypt (10 rounds)
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // 5. Build Student Document
        const newStudent = {
            userId: registerNumber,
            username: name,
            name: name,
            email: email,
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

        // 7. Generate Session JWT
        const token = generateToken(newStudent);

        // 8. Sanitize credentials from response
        const { passwordHash: _, ...safeUser } = newStudent;

        return res.status(201).json({
            success: true,
            message: 'Student registered successfully.',
            token,
            session: {
                role: 'student',
                user: safeUser
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
    }
});

/**
 * POST /api/auth/login
 * Log in a student and perform automatic, safe migration of legacy plain-text passwords on successful auth.
 */
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body; // username can be email or registerNumber

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Missing username or password.' });
        }

        const studentsRef = db.collection('students');
        let student = null;
        let studentDocRef = null;

        // Try getting by registerNumber (Document ID) first
        const docSnap = await studentsRef.doc(username).get();
        if (docSnap.exists) {
            student = docSnap.data();
            studentDocRef = docSnap.ref;
        } else {
            // Fallback: Query by email
            const querySnap = await studentsRef.where('email', '==', username).limit(1).get();
            if (!querySnap.empty) {
                student = querySnap.docs[0].data();
                studentDocRef = querySnap.docs[0].ref;
            }
        }

        if (!student) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        let isValid = false;
        let needsMigration = false;
        let targetHash = null;

        // 1. Password Verification & Safe Migration Check
        if (student.passwordHash) {
            // standard hashed case
            isValid = await bcrypt.compare(password, student.passwordHash);
        } else if (student.hashedPassword) {
            // legacy bcrypt field migration case
            isValid = await bcrypt.compare(password, student.hashedPassword);
            if (isValid) {
                needsMigration = true;
                targetHash = student.hashedPassword;
            }
        } else if (student.password) {
            // legacy plain-text migration case
            isValid = student.password === password;
            if (isValid) {
                needsMigration = true;
                // Hash with saltRounds = 10
                targetHash = await bcrypt.hash(password, SALT_ROUNDS);
            }
        }

        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // 2. Perform Migration if required (on successful login)
        if (needsMigration && targetHash) {
            await studentDocRef.update({
                passwordHash: targetHash,
                password: admin.firestore.FieldValue.delete(),
                hashedPassword: admin.firestore.FieldValue.delete()
            });
            console.log(`🔒 Safely migrated student ${student.registerNumber} to bcrypt passwordHash storage.`);

            // Update in-memory user object for this request
            student.passwordHash = targetHash;
            delete student.password;
            delete student.hashedPassword;
        }

        // 3. Generate Session Token
        const token = generateToken(student);

        // 4. Sanitize user data
        const { password: _, hashedPassword: __, passwordHash: ___, ...safeUser } = student;

        return res.status(200).json({
            success: true,
            token,
            session: {
                role: 'student',
                user: safeUser
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error during login.' });
    }
});

/**
 * PUT /api/students/password-reset
 * Secure password change API for authenticated student.
 */
app.put('/api/students/password-reset', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const regNo = req.user.registerNumber; // retrieved securely from token payload

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Missing password fields.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
        }

        const studentDocRef = db.collection('students').doc(regNo);
        const docSnap = await studentDocRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ success: false, message: 'Student account not found.' });
        }

        const student = docSnap.data();
        let isValid = false;

        // Verify existing password
        if (student.passwordHash) {
            isValid = await bcrypt.compare(currentPassword, student.passwordHash);
        } else if (student.hashedPassword) {
            isValid = await bcrypt.compare(currentPassword, student.hashedPassword);
        } else if (student.password) {
            isValid = student.password === currentPassword;
        }

        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }

        // Securely hash the new password (10 salt rounds)
        const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update to new hash and completely remove legacy password formats
        await studentDocRef.update({
            passwordHash: newPasswordHash,
            password: admin.firestore.FieldValue.delete(),
            hashedPassword: admin.firestore.FieldValue.delete()
        });

        return res.status(200).json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Password reset error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error during password reset.' });
    }
});

// ==========================================
// 4. BOOTSTRAP EXPRESS SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 Authentication Backend Server listening on port ${PORT}`);
});

export default app;
