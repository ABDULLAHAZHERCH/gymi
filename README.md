# GYMI

> Your intelligent fitness companion—track workouts, log nutrition, and perfect your form with AI-powered coaching.

## ✨ What It Does

**GYMI** is a modern fitness tracking platform that combines workout logging, nutrition management, and real-time AI form correction into one seamless experience.

- **Workout Tracking** — Log exercises, sets, reps, and weight with intelligent search and filtering
- **Nutrition Logging** — Track meals, macros, and calories throughout your day
- **AI Form Coach** — Real-time pose detection and feedback via computer vision (FastAPI + MediaPipe)
- **Progress Monitoring** — Weight tracking with visual charts and goal management
- **Dark Mode** — Built-in theme switching for comfortable viewing

## 🌐 Live Demo

**Visit:** [https://gymii.vercel.app](https://gymii.vercel.app) 🎉

## 🚀 Quick Start (Local)

```bash
npm install
npm run dev
```

Visit [localhost:3000](http://localhost:3000) for local development, or check out the [live demo](https://gymii.vercel.app).

## 🛠️ Built With

- **Next.js 16** — React 19, App Router, TypeScript strict mode
- **Firebase** — Authentication, Firestore database, real-time sync
- **Tailwind CSS v4** — Modern utility-first styling with dark mode
- **FastAPI Backend** — Python-based AI pose detection (WebSocket)
- **MediaPipe** — Google's ML framework for pose landmarks

## 📁 Project Structure

```
app/
  ├── (app)/
  │   ├── workouts/      # Exercise logging
  │   ├── nutrition/     # Meal tracking
  │   ├── coach/         # AI form correction
  │   ├── profile/       # User data, goals, weight logs
  │   └── page.tsx       # Dashboard
  ├── layout.tsx
  └── globals.css

lib/
  ├── firebase.ts        # Firebase config
  ├── auth.ts            # Authentication helpers
  ├── workouts.ts        # Workout CRUD
  ├── meals.ts           # Meal CRUD
  ├── weightLogs.ts      # Weight tracking
  └── goals.ts           # Goal management

components/
  ├── layout/            # Navigation, AppLayout
  ├── features/          # Domain-specific components
  └── ui/                # Reusable primitives
```

## 🔐 Environment Setup

Create `.env.local` with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🧠 AI Coach Backend

The form correction feature requires a separate FastAPI server. See [BACKEND_INTEGRATION_QUICK_START.md](BACKEND_INTEGRATION_QUICK_START.md) for setup instructions.

## 📝 License

Built as a Final Year Project (FYP) — 2025/2026

---

**Live Demo:** [https://gymii.vercel.app](https://gymii.vercel.app)  
**Repository:** [GitHub](https://github.com/ABDULLAHAZHERCH/gymi)  
**Version:** 0.1.0 • **Framework:** Next.js 16 • **License:** Private
