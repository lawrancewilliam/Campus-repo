import { getApps, initializeApp, cert as firebaseCert } from 'firebase-admin/app';
import { getFirestore, FieldValue as AdminFieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { 
    FIREBASE_PROJECT_ID, 
    FIREBASE_STORAGE_BUCKET 
} from '$env/static/private';
import { env } from '$env/dynamic/private';
import fs from 'fs';
import path from 'path';

const clientEmail = env.FIREBASE_CLIENT_EMAIL || '';
// Replace escaped newlines in private key
const privateKey = env.FIREBASE_PRIVATE_KEY 
    ? env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : '';

let app = null;
let adminDbVal = null;
let adminStorageVal = null;

// --- Mock Firestore & Storage Implementation ---
class MockDocSnapshot {
    constructor(id, data, ref = null) {
        this.id = id;
        this._data = data;
        this.exists = data !== undefined;
        this.ref = ref;
    }
    data() {
        return this._data;
    }
}

class MockQuerySnapshot {
    constructor(docs) {
        this.docs = docs;
        this.empty = docs.length === 0;
    }
}

class MockDoc {
    constructor(db, collectionName, docId) {
        this.db = db;
        this.collectionName = collectionName;
        this.docId = docId;
    }
    async get() {
        const dbData = this.db.readDb();
        const collectionDocs = dbData[this.collectionName] || {};
        const data = collectionDocs[this.docId];
        return new MockDocSnapshot(this.docId, data, this);
    }
    async set(data) {
        const dbData = this.db.readDb();
        if (!dbData[this.collectionName]) dbData[this.collectionName] = {};
        const currentData = dbData[this.collectionName][this.docId] || {};
        const mergedData = { ...currentData, ...data };
        for (const [key, value] of Object.entries(mergedData)) {
            if (value && value._type === 'delete') {
                delete mergedData[key];
            } else if (value && value._type === 'increment') {
                const prev = currentData[key] || 0;
                mergedData[key] = prev + value._val;
            }
        }
        dbData[this.collectionName][this.docId] = mergedData;
        this.db.writeDb(dbData);
    }
    async update(data) {
        const dbData = this.db.readDb();
        if (!dbData[this.collectionName]) dbData[this.collectionName] = {};
        const currentData = dbData[this.collectionName][this.docId] || {};
        const mergedData = { ...currentData };
        for (const [key, value] of Object.entries(data)) {
            if (value && value._type === 'delete') {
                delete mergedData[key];
            } else if (value && value._type === 'increment') {
                const prev = mergedData[key] || 0;
                mergedData[key] = prev + value._val;
            } else {
                mergedData[key] = value;
            }
        }
        dbData[this.collectionName][this.docId] = mergedData;
        this.db.writeDb(dbData);
    }
    async delete() {
        const dbData = this.db.readDb();
        if (dbData[this.collectionName]) {
            delete dbData[this.collectionName][this.docId];
            this.db.writeDb(dbData);
        }
    }
}

class MockCollection {
    constructor(db, name) {
        this.db = db;
        this.name = name;
        this.filters = [];
        this.limitVal = null;
    }
    doc(docId) {
        return new MockDoc(this.db, this.name, String(docId));
    }
    where(field, operator, val) {
        const query = new MockCollection(this.db, this.name);
        query.filters = [...this.filters, { field, operator, val }];
        query.limitVal = this.limitVal;
        return query;
    }
    limit(n) {
        const query = new MockCollection(this.db, this.name);
        query.filters = [...this.filters];
        query.limitVal = n;
        return query;
    }
    async add(data) {
        const dbData = this.db.readDb();
        if (!dbData[this.name]) dbData[this.name] = {};
        const id = Math.random().toString(36).substring(2, 15);
        const docData = { ...data, id };
        dbData[this.name][id] = docData;
        this.db.writeDb(dbData);
        return new MockDoc(this.db, this.name, id);
    }
    async get() {
        const dbData = this.db.readDb();
        const collectionDocs = dbData[this.name] || {};
        let docs = Object.entries(collectionDocs).map(([id, data]) => {
            return new MockDocSnapshot(id, data);
        });
        for (const filter of this.filters) {
            const { field, operator, val } = filter;
            docs = docs.filter(docSnap => {
                const data = docSnap.data();
                if (!data) return false;
                const actualVal = data[field];
                if (operator === '==') {
                    return actualVal === val;
                }
                return true;
            });
        }
        if (this.limitVal !== null) {
            docs = docs.slice(0, this.limitVal);
        }
        return new MockQuerySnapshot(docs);
    }
}

class MockBatch {
    constructor(db) {
        this.db = db;
        this.operations = [];
    }
    delete(docRef) {
        this.operations.push({ type: 'delete', ref: docRef });
        return this;
    }
    async commit() {
        for (const op of this.operations) {
            if (op.type === 'delete') {
                await op.ref.delete();
            }
        }
    }
}

class MockFirestore {
    constructor() {
        this.dbPath = path.resolve(process.cwd(), 'local-db.json');
        this.initDb();
        console.log(`ℹ️ [Mock Database Path] Resolving database file to: ${this.dbPath}`);
    }
    initDb() {
        if (!fs.existsSync(this.dbPath)) {
            fs.writeFileSync(this.dbPath, JSON.stringify({
                students: {},
                projects: {},
                activities: {}
            }, null, 2));
        }
    }
    readDb() {
        try {
            return JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
        } catch (e) {
            return { students: {}, projects: {}, activities: {} };
        }
    }
    writeDb(data) {
        fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
    }
    collection(collectionName) {
        return new MockCollection(this, collectionName);
    }
    batch() {
        return new MockBatch(this);
    }
}

class MockFile {
    constructor(destinationPath) {
        this.destinationPath = destinationPath;
    }
    async save(buffer, options) {
        const localDir = path.resolve(process.cwd(), 'static', 'uploads');
        if (!fs.existsSync(localDir)) {
            fs.mkdirSync(localDir, { recursive: true });
        }
        const fileName = path.basename(this.destinationPath);
        const localPath = path.join(localDir, fileName);
        fs.writeFileSync(localPath, buffer);
        console.log(`✅ [Mock Storage] Saved file locally to: ${localPath}`);
    }
    async getSignedUrl(options) {
        const fileName = path.basename(this.destinationPath);
        return [`/uploads/${fileName}`];
    }
    async delete() {
        const localDir = path.resolve(process.cwd(), 'static', 'uploads');
        const fileName = path.basename(this.destinationPath);
        const localPath = path.join(localDir, fileName);
        if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
            console.log(`✅ [Mock Storage] Deleted local file: ${localPath}`);
        }
    }
}

class MockBucket {
    file(destinationPath) {
        return new MockFile(destinationPath);
    }
}

class MockStorage {
    bucket() {
        return new MockBucket();
    }
}

// --- Initialization Logic ---
const isConfigured = clientEmail && privateKey;

if (isConfigured) {
    if (getApps().length === 0) {
        try {
            app = initializeApp({
                credential: firebaseCert({
                    projectId: FIREBASE_PROJECT_ID,
                    clientEmail,
                    privateKey
                }),
                storageBucket: FIREBASE_STORAGE_BUCKET
            });
            console.log('✅ Firebase Admin SDK initialized successfully with service account cert.');
        } catch (err) {
            console.error('❌ Failed to initialize Firebase Admin SDK with cert:', err);
        }
    } else {
        app = getApps()[0];
    }
    adminDbVal = app ? getFirestore(app) : new MockFirestore();
    adminStorageVal = app ? getStorage(app) : new MockStorage();
} else {
    console.warn('⚠️ FIREBASE_CLIENT_EMAIL and/or FIREBASE_PRIVATE_KEY are missing from env. Using local Mock Database & Storage fallbacks.');
    adminDbVal = new MockFirestore();
    adminStorageVal = new MockStorage();
    console.log(`ℹ️ [Local Database Config] Student details and project metadata will save to: ${path.resolve(process.cwd(), 'local-db.json')}`);
    console.log(`ℹ️ [Local Storage Config] Project files will upload to directory: ${path.resolve(process.cwd(), 'static', 'uploads')}`);
}

export const adminDb = adminDbVal;
export const adminStorage = adminStorageVal;
export const cert = isConfigured ? firebaseCert : null;

const FieldValueMock = {
    delete: () => ({ _type: 'delete' }),
    increment: (n) => ({ _type: 'increment', _val: n })
};

export const FieldValue = isConfigured ? AdminFieldValue : FieldValueMock;

