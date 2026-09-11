# Collaborative To-Do List (TaskVault)

A modern, real-time task management application powered by **Firebase** (Authentication & Cloud Firestore) and an intelligent, multi-turn **Gemini AI Copilot**.

---

## Key Features

### 1. Secure Authentication & User Isolation
- **Google Sign-In**: Quick, secure authentication powered by Firebase Auth (`signInWithPopup`).
- **Strict Data Isolation**: Enforced by Cloud Firestore security rules (`firestore.rules`), ensuring tasks under `/users/{userId}/tasks` can only be queried, written, updated, or deleted by the authenticated owner.

### 2. Real-Time Task Management
- **Instant Synchronization**: Listens directly to Firestore snapshots (`onSnapshot`), reflecting additions, completions, edits, and deletions in real time across multiple devices and browser tabs.
- **Frictionless Quick Add**: Add tasks directly from the main view with inline priority and category tagging.
- **Detailed Task Modal**: Attach extended notes/descriptions, set due dates, assign categories (*Personal*, *Work*, *Study*, *Errands*, *General*), and prioritize (*High*, *Medium*, *Low*).
- **Interactive Completion**: Smooth completion toggling with celebratory confetti effects and live progress tracking.
- **Deletion Safety**: Inline confirmation to prevent accidental loss of task records.

### 3. Filtering, Search & Organization
- **Status Tabs**: Filter by *All*, *Active*, or *Completed* tasks with live count badges.
- **Dynamic Search**: Instant full-text filtering across task titles and descriptions.
- **Category & Priority Chips**: One-click filtering by category or urgency level.
- **Flexible Sorting**: Sort by newest, oldest, upcoming due date, or priority.

### 4. Multi-Turn Gemini AI Copilot
Integrated server-side AI chat drawer powered by the official `@google/genai` SDK:
- **Role-Based Model Routing**:
  - **General Tasks** (`gemini-3.5-flash`): Everyday scheduling, daily prioritization, and motivational planning.
  - **Fast Tasks** (`gemini-3.1-flash-lite`): Rapid task categorization, tag generation, and high-speed bulleted checklists.
  - **Complex Tasks** (`gemini-3.1-pro-preview`): In-depth project breakdown, dependency analysis, and multi-phase roadmaps.
- **Context Awareness**: Toggles task-list context so the assistant can analyze and reference your actual to-dos.
- **Customizable System Instructions**: Inspect and customize the assistant's system instructions directly in the UI.
- **One-Click Task Import**: Convert task suggestions from the AI conversation directly into your to-do list.

---

## Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, `react-markdown`, `canvas-confetti`.
- **Backend / API**: Node.js Express server (`server.ts`) proxying Gemini requests to keep API keys server-side.
- **Database & Auth**: Firebase Authentication (Google Auth Provider), Cloud Firestore with security rules.
- **Build Tools**: Vite 6, `tsx` for development, `esbuild` for production server bundling.

---

## Getting Started

### Prerequisites
- Node.js 20+ installed.
- A Firebase project configured with Firestore and Google Authentication.

### Configuration
1. Clone or download the repository.
2. Ensure your Firebase configuration file is present at `firebase-applet-config.json`.
3. Set your environment variables (see `.env.example`):
   ```bash
   GEMINI_API_KEY="your-gemini-api-key"
   ```

### Development
Start the full-stack development server (Express + Vite middleware):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
Compile both the frontend assets and the backend Express bundle:
```bash
npm run build
npm start
```

---

## Security & Rules

Tasks are guarded by Firestore Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /tasks/{taskId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```
All calls to the Gemini API are handled server-side through `/api/chat` using `process.env.GEMINI_API_KEY`, ensuring credentials are never exposed in browser network traffic.
