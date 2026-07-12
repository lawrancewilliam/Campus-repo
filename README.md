## 🎓 CampusRepo - Student Project Management Repository

CampusRepo is a modern, responsive web application designed for students and administrators to manage, showcase, and explore academic projects. Built with **Svelte 5**, **SvelteKit**, **Tailwind CSS v4**, and **Firebase**, it delivers a seamless user experience with secure authentication and robust project uploads.

---

## 🚀 Key Features

* **Secure Student & Admin Authentication**: High-security login and registration with hashed passwords (`bcryptjs`) and JWT token verification stored in secure HTTP-only cookies.
* **Student Workspace**:
  * Upload academic projects with descriptions, tags, and files.
  * Explore and filter peer projects.
  * Personal profile customization and project management.
* **Admin Dashboard**:
  * Oversee and manage student profiles and details.
  * Review and manage all project uploads across the campus.
* **Modern Interface**: Designed with Svelte 5 state management, subtle animations, and styling powered by Tailwind CSS v4.

---

## 🛠️ Tech Stack

* **Frontend & Backend Routing**: [Svelte 5](https://svelte.dev) + [SvelteKit](https://kit.svelte.dev) (Vite-powered)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com)

## ⚙️ Getting Started

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **NPM**: `v9.0.0` or higher
* A Firebase Project with **Firestore** and **Cloud Storage** enabled.

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory and configure the following environment variables:

```env
# ==========================================
# 1. PRIVATE - Firebase Admin SDK (Server-Side)
# ==========================================
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="your-firebase-adminsdk-email"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----"
FIREBASE_STORAGE_BUCKET="your-firebase-project-id.appspot.com"

# ==========================================
# 2. PRIVATE - JWT Configuration
# ==========================================
JWT_SECRET="your-secure-jwt-secret-key"

# ==========================================
# 3. PUBLIC - Firebase Client SDK (Browser-Side)
# ==========================================
PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
PUBLIC_FIREBASE_AUTH_DOMAIN="your-firebase-project-id.firebaseapp.com"
PUBLIC_FIREBASE_PROJECT_ID="your-firebase-project-id"
PUBLIC_FIREBASE_STORAGE_BUCKET="your-firebase-project-id.appspot.com"
PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
PUBLIC_FIREBASE_APP_ID="your-firebase-app-id"
```

### 3. Deploy Firestore Rules
To apply the database security rules defined in `firestore.rules` to your Firebase project, install the Firebase CLI and run:
```bash
# Login to your Firebase account
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

### 4. Run the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser to view the application.

### 5. Build for Production
To build the application for deployment:
```bash
npm run build
```
This will compile the client and server assets using SvelteKit's configured adapter.
