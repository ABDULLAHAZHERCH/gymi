# GYMI — AI-Powered Fitness Web Platform

> A responsive, mobile-first fitness tracking web application with AI coaching capabilities, built as a Final Year Project.

**Live:** [gymii.vercel.app](https://gymii.vercel.app)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Authentication & Security](#authentication--security)
- [Offline & PWA Support](#offline--pwa-support)
- [Pages & Routing](#pages--routing)
- [Service Layer API](#service-layer-api)
- [Design System](#design-system)
- [Environment Setup](#environment-setup)
- [Scripts](#scripts)
- [Deployment](#deployment)

---

## Overview

GYMI is a full-stack fitness web application that lets users track workouts, log nutrition, set goals, monitor progress, and receive AI-powered form correction during exercises. It works as a Progressive Web App (PWA) — installable on mobile devices with offline support and background sync.

### Key Highlights

| Aspect | Detail |
|---|---|
| Framework | Next.js 16 (App Router) with React 19 |
| Language | TypeScript (strict mode) |
| Backend | Firebase Authentication + Cloud Firestore |
| Styling | Tailwind CSS v4, dark-mode default |
| Hosting | Vercel (auto-deploy from GitHub) |
| PWA | Service Worker, IndexedDB offline store, install prompt |
| AI Coach | MediaPipe pose detection via WebSocket |

---

## Tech Stack

### Core

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.1.6 | React framework (App Router, SSR/SSG) |
| `react` / `react-dom` | 19.2.3 | UI library |
| `typescript` | 5.x | Type safety with strict checking |
| `tailwindcss` | 4.x | Utility-first CSS (via PostCSS plugin) |

### Backend & Data

| Package | Purpose |
|---|---|
| `firebase` (10.x) | Auth (email/password + Google Sign-In), Firestore (NoSQL database) |
| `idb` | IndexedDB wrapper for offline data storage |

### UI & UX

| Package | Purpose |
|---|---|
| `lucide-react` | Icon library (consistent line icons) |
| `clsx` / `tailwind-merge` | Conditional className merging |
| `@vercel/analytics` | Page-view analytics |

### PWA & Offline

| Package | Purpose |
|---|---|
| `workbox-*` | Service worker caching strategies |
| `idb` | IndexedDB offline CRUD & sync queue |

### AI

| Package | Purpose |
|---|---|
| `@mediapipe/tasks-vision` | Real-time pose detection for form correction |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Browser                          │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │  React UI  │  │ Service      │  │  IndexedDB   ││
│  │ (Next.js   │◄─┤ Worker       │  │  (offline    ││
│  │  App Router│  │ (sw.js)      │  │   store)     ││
│  └─────┬──────┘  └──────────────┘  └───────┬──────┘│
│        │                                    │       │
│        ▼                                    ▼       │
│  ┌─────────────────────────────────────────────────┐│
│  │           Service Layer (lib/*.ts)               ││
│  │  auth · workouts · meals · goals · weightLogs   ││
│  │  stats · achievements · reports · mealTemplates ││
│  └─────────────────────┬───────────────────────────┘│
└────────────────────────┼────────────────────────────┘
                         │  Firebase SDK
                         ▼
              ┌──────────────────────┐
              │   Firebase Cloud     │
              │  ┌────────────────┐  │
              │  │ Authentication │  │
              │  └────────────────┘  │
              │  ┌────────────────┐  │
              │  │   Firestore    │  │
              │  └────────────────┘  │
              └──────────────────────┘
```

### Data Flow

1. **User Action** → React component calls service layer function
2. **Service Layer** → Validates data, calls Firestore SDK
3. **Firestore** → Applies security rules, persists data, returns result
4. **Component** → Updates local state, shows toast notification
5. **Offline** → If network unavailable, queues operation in IndexedDB → syncs on reconnect

### Rendering Strategy

- **Server Components** by default (no `'use client'` directive)
- **Client Components** for interactive pages (forms, auth state, animations)
- **Static Generation** at build time for all pages (output: `static`)

---

## Features

### 1. Workout Tracking
- Log exercises with sets, reps, weight, duration, and notes
- **Imperial unit support** — weight displayed in kg or lbs based on user preference
- Edit and delete entries with confirmation dialogs
- View workout history sorted by date (newest first)
- Search by exercise name, filter by date range
- Exercise library with 20+ predefined exercises (muscle groups, difficulty, instructions)

### 2. Nutrition Diary
- Log meals with food items, calories, and macros (protein, carbs, fat)
- Five meal types: breakfast, lunch, dinner, snack, other
- Daily calorie and macro summaries
- Meal templates for quick re-logging of frequent meals
- Search and filter by meal type, calorie range, date range

### 3. Goal Management
- Four goal types: **Weight**, **Workout Frequency**, **Calories**, **Macros**
- Visual progress bars and status tracking (active / completed / abandoned)
- Timeline with start date and target date
- Edit, complete, and delete goals

### 4. Weight Tracking
- Log weight entries over time with optional notes
- Interactive SVG line/area chart with Catmull-Rom curve smoothing
- Gradient fill, hover tooltips, grid lines, target weight line
- Stats row: current weight, change, target
- **Unit-aware display** — all values shown in user's preferred unit (kg/lbs)

### 5. Progress & Analytics
- **Achievements & Badges** — Unlock milestones for streaks, workout counts, weight changes, personal records
- **Streak Tracking** — Current and longest workout streaks
- **Smart Insights** — Contextual tips based on activity patterns (e.g., "You're on a 7-day streak!")
- **Weekly/Monthly Reports** — Workout summaries, nutrition breakdowns, progress metrics

### 6. AI Coach
- Real-time camera-based pose detection using MediaPipe
- WebSocket connection to a FastAPI backend for form analysis
- Visual pose overlay on camera feed
- Exercise-specific form feedback

### 7. Dashboard (Home)
- Time-based greeting ("Good morning/afternoon/evening")
- Stat cards: streak, weekly workouts, today's calories, monthly workouts
- Macro breakdown with link to nutrition details
- Top exercises and recent activity feed
- Empty-state CTAs for new users

### 8. Offline & PWA
- Installable on iOS and Android home screens
- Service worker with tiered caching (cache-first for assets, network-first for API)
- IndexedDB offline store for workouts, meals, goals, weight logs
- Sync queue with automatic retry on reconnect
- Offline fallback page

### 9. In-App Notifications
- **Bell icon** in header with unread badge (red dot/count, max "9+")
- **10 notification types:** achievement, streak, streak warning, goal deadline, goal completed, weekly summary, personal record, inactivity, welcome, milestone
- **Dropdown panel** — scrollable list (max 20), mark-all-read, relative timestamps
- **Auto-triggers** — notifications created after workout/meal CRUD, goal actions, dashboard load, onboarding
- **Deduplication** — prevents duplicate notifications on same day
- **In-memory caching** with TTL and prefix-based invalidation

### 10. Imperial Unit Support
- Toggle between **metric** (kg, cm) and **imperial** (lbs, ft/in) units
- Preference stored in Firestore user profile, loaded via `UnitProvider` React context
- **Always stores metric internally** — converts for display only
- Applied across: onboarding, workouts, nutrition, goals, weight chart, dashboard stats, reports, notifications, data export

### 11. Data Export
- Export workouts, meals, or weight logs as CSV
- Full backup as JSON with metadata and versioning
- **Unit-aware CSV headers** — headers and values adjust to user's unit preference

### 12. Privacy & Legal
- **Privacy Policy** page (`/privacy`) — 10 sections covering data collection, storage, third-party services, user rights
- **Terms of Service** page (`/terms`) — 12 sections covering acceptable use, health disclaimer, liability
- Links in landing page footer and auth layout footer

---

## Project Structure

```
gymi/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (fonts, theme, auth, analytics)
│   ├── page.tsx                  # Landing page (public, redirects if authenticated)
│   ├── icon.svg                  # Favicon
│   ├── globals.css               # Global styles & CSS custom properties
│   ├── (auth)/                   # Auth route group (no layout shell)
│   │   ├── layout.tsx            # Auth layout (gradient bg, footer with Privacy/Terms links)
│   │   ├── login/page.tsx        # Login page (Google + email/password, password visibility toggle)
│   │   ├── register/page.tsx     # Register page (Google + password strength meter)
│   │   └── onboarding/page.tsx   # Post-registration onboarding wizard (unit toggle)
│   └── (app)/                    # Authenticated route group
│       ├── layout.tsx            # Protected layout (auth guard, toast, error boundary)
│       ├── home/page.tsx         # Dashboard
│       ├── workouts/page.tsx     # Workout logging
│       ├── nutrition/page.tsx    # Meal logging
│       ├── coach/page.tsx        # AI Coach with camera
│       ├── progress/page.tsx     # Goals, weight chart, achievements, insights
│       ├── account/page.tsx      # Account settings (unit preference, profile, export)
│       └── achievements/page.tsx # All achievements browser
│
│   ├── privacy/page.tsx          # Privacy Policy (public)
│   └── terms/page.tsx            # Terms of Service (public)
│
├── components/
│   ├── features/                 # Domain-specific components
│   │   ├── WorkoutList.tsx       # Workout list with cards
│   │   ├── WorkoutForm.tsx       # Add/edit workout form
│   │   ├── WorkoutCard.tsx       # Single workout display
│   │   ├── MealList.tsx          # Meal list with date grouping
│   │   ├── MealForm.tsx          # Add/edit meal form
│   │   ├── MealCard.tsx          # Single meal display
│   │   ├── GoalCard.tsx          # Goal with progress bar
│   │   ├── GoalForm.tsx          # Add/edit goal form
│   │   ├── WeightChart.tsx       # SVG line/area weight chart
│   │   ├── AchievementCard.tsx   # Achievement badge (locked/unlocked)
│   │   ├── StreakIndicator.tsx    # Streak display
│   │   ├── StatCard.tsx          # Dashboard stat card
│   │   ├── RecentActivity.tsx    # Activity feed
│   │   ├── ExerciseLibrary.tsx   # Exercise browser
│   │   ├── ExerciseDetailModal.tsx
│   │   ├── MealTemplateCard.tsx  # Meal template display
│   │   ├── MealTemplateForm.tsx  # Template editor
│   │   ├── FilterPanel.tsx       # Search/filter controls
│   │   ├── CameraView.tsx        # Camera feed for AI Coach
│   │   ├── PoseCanvas.tsx        # Pose skeleton overlay
│   │   └── FormFeedbackCard.tsx  # AI form correction feedback
│   │
│   ├── layout/                   # Layout & navigation
│   │   ├── AppLayout.tsx         # Main app shell (sidebar + header + bottom nav)
│   │   ├── BottomNav.tsx         # Mobile bottom navigation
│   │   ├── SideNav.tsx           # Desktop sidebar navigation
│   │   ├── PageHeader.tsx        # Top header with GYMI branding + notifications + user menu
│   │   ├── UserMenu.tsx          # Avatar dropdown (settings, theme, logout)
│   │   ├── NotificationBell.tsx  # Bell icon with unread badge (polls every 60s)
│   │   ├── NotificationPanel.tsx # Notification dropdown panel (max 20 items)
│   │   ├── NotificationItem.tsx  # Single notification row (icon, message, relative time)
│   │   └── MobileLayout.tsx      # Mobile-specific layout wrapper
│   │
│   ├── providers/                # Context providers & wrappers
│   │   ├── AuthProvider.tsx      # Firebase auth context
│   │   ├── ProtectedRoute.tsx    # Auth guard (redirects to landing if unauthenticated)
│   │   ├── UnitProvider.tsx      # Unit system context (metric/imperial preference)
│   │   ├── ThemeProvider.tsx     # Theme context
│   │   ├── ErrorBoundary.tsx     # React error boundary with fallback UI
│   │   └── PageTransition.tsx    # Page transition animation
│   │
│   └── ui/                       # Reusable UI primitives
│       ├── Button.tsx            # Button with loading state
│       ├── Modal.tsx             # Dialog modal
│       ├── SearchBar.tsx         # Search input
│       ├── FilterChip.tsx        # Toggle chip for filters
│       ├── Skeleton.tsx          # Loading skeleton variants
│       ├── ToastContainer.tsx    # Toast notification renderer
│       ├── ThemeToggle.tsx       # Light/dark toggle
│       ├── OfflineIndicator.tsx  # Offline/sync status banner
│       ├── InstallPrompt.tsx     # PWA install banner
│       └── PullToRefresh.tsx     # Pull-to-refresh for mobile
│
├── lib/                          # Business logic & services
│   ├── firebase.ts               # Firebase app initialization
│   ├── auth.ts                   # Auth functions (register, login, logout, Google sign-in, profile CRUD)
│   ├── workouts.ts               # Workout CRUD operations
│   ├── meals.ts                  # Meal CRUD + daily calorie/macro totals
│   ├── goals.ts                  # Goal CRUD + progress calculation
│   ├── weightLogs.ts             # Weight log CRUD + change tracking
│   ├── stats.ts                  # Dashboard aggregation (streak, counts, favorites) — unit-aware
│   ├── achievements.ts           # Achievement unlock logic + milestone progress
│   ├── reports.ts                # Weekly/monthly report generation + insights — unit-aware
│   ├── notifications.ts          # Notification CRUD + unread count + caching
│   ├── notificationTriggers.ts   # Notification generation logic with deduplication
│   ├── cache.ts                  # In-memory cache with TTL + prefix invalidation
│   ├── mealTemplates.ts          # Meal template CRUD
│   ├── types/firestore.ts        # TypeScript interfaces for all Firestore documents
│   ├── contexts/ToastContext.tsx  # Toast notification context
│   ├── hooks/
│   │   ├── useOffline.ts         # Service worker lifecycle + online/offline detection
│   │   ├── useKeyboardShortcut.ts# Keyboard shortcut hook
│   │   └── usePoseWebSocket.ts   # WebSocket hook for AI pose detection
│   ├── services/
│   │   └── poseDetection.ts      # MediaPipe pose detection service
│   ├── offline/
│   │   ├── offlineStore.ts       # IndexedDB CRUD for offline data
│   │   └── syncManager.ts        # Sync queue execution + conflict resolution
│   ├── data/
│   │   └── exercises.ts          # Exercise library dataset (20+ exercises)
│   └── utils/
│       ├── units.ts              # kg/lbs, cm/ft-in conversion utilities
│       ├── timeAgo.ts            # Relative time formatting ("2h ago", "Yesterday")
│       ├── errorMessages.ts      # Firebase error code → user-friendly message
│       ├── export.ts             # CSV/JSON export utilities — unit-aware
│       ├── search.ts             # Search and filter functions
│       └── validation.ts         # Form validation rules
│
├── firebase/
│   ├── firestore.rules           # Firestore security rules
│   └── storage.rules             # Storage security rules (unused currently)
│
├── public/
│   ├── manifest.json             # PWA web app manifest
│   ├── sw.js                     # Service worker (cache-first + network-first)
│   ├── offline.html              # Offline fallback page
│   ├── logo-120.png              # GCP OAuth consent screen logo (120×120)
│   ├── icon-192.svg              # PWA icon (192×192)
│   ├── icon-512.svg              # PWA icon (512×512)
│   └── icon-maskable.svg         # Maskable PWA icon
│
├── docs/
│   ├── README.md                 # This document
│   └── DEV_PLAN.md               # Detailed development roadmap
│
├── .env.example                  # Environment variable template
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration (strict)
├── next.config.ts                # Next.js configuration
├── postcss.config.mjs            # PostCSS with Tailwind v4 plugin
├── eslint.config.mjs             # ESLint with Next.js + TypeScript rules
└── tailwind.config.ts            # Tailwind CSS configuration
```

---

## Data Model

All user data is stored in Firestore under `/users/{uid}/` with per-user isolation.

### Collections

```
/users/{uid}                      → UserProfile
/users/{uid}/workouts/{id}        → Workout
/users/{uid}/meals/{id}           → Meal
/users/{uid}/goals/{id}           → Goal
/users/{uid}/weightLogs/{id}      → WeightLog
/users/{uid}/achievements/{id}    → Achievement
/users/{uid}/mealTemplates/{id}   → MealTemplate
/users/{uid}/notifications/{id}   → Notification
```

### Entity Schemas

#### UserProfile
| Field | Type | Description |
|---|---|---|
| `name` | string | Display name |
| `email` | string | Email address |
| `goal` | enum | Fitness goal (build strength / lose weight / improve endurance / stay consistent) |
| `weight` | number | Current weight in kg |
| `height` | number | Height in cm |
| `unitSystem` | enum? | `'metric'` or `'imperial'` (default: `'metric'`) |
| `createdAt` | Date | Profile creation timestamp |
| `updatedAt` | Date | Last update timestamp |

#### Workout
| Field | Type | Description |
|---|---|---|
| `exercise` | string | Exercise name (e.g., "Bench Press") |
| `sets` | number | Number of sets |
| `reps` | number | Reps per set |
| `weight` | number | Weight in kg |
| `duration` | number? | Duration in minutes (optional) |
| `notes` | string? | Free-text notes (optional) |
| `date` | Date | Workout date |
| `createdAt` | Date | Entry creation timestamp |
| `updatedAt` | Date | Last edit timestamp |

#### Meal
| Field | Type | Description |
|---|---|---|
| `mealName` | string | Meal label (e.g., "Chicken & Rice") |
| `items` | string | Comma-separated food items |
| `mealType` | enum | breakfast / lunch / dinner / snack / other |
| `calories` | number | Calorie count |
| `protein` | number? | Protein in grams (optional) |
| `carbs` | number? | Carbohydrates in grams (optional) |
| `fat` | number? | Fat in grams (optional) |
| `notes` | string? | Notes (optional) |
| `date` | Date | Meal date |

#### Goal
| Field | Type | Description |
|---|---|---|
| `type` | enum | weight / workout_frequency / calories / macros |
| `title` | string | Goal title |
| `description` | string | Goal description |
| `targetWeight` | number? | Target weight kg (weight goals) |
| `targetWorkoutsPerWeek` | number? | Weekly target (frequency goals) |
| `targetCaloriesPerDay` | number? | Daily calorie target |
| `targetProtein/Carbs/Fat` | number? | Macro targets in grams |
| `startDate` | Date | Goal start date |
| `targetDate` | Date | Goal deadline |
| `status` | enum | active / completed / abandoned |
| `currentValue` | number? | Current progress value |

#### WeightLog
| Field | Type | Description |
|---|---|---|
| `weight` | number | Weight in kg |
| `date` | Date | Log date |
| `notes` | string? | Optional notes |

#### Achievement
| Field | Type | Description |
|---|---|---|
| `type` | enum | streak / workout_count / weight_milestone / personal_record |
| `title` | string | Achievement name |
| `description` | string | How it was earned |
| `icon` | string | Emoji or icon identifier |
| `milestone` | number | Milestone value (e.g., 7 for 7-day streak) |
| `achievedAt` | Date | When the achievement was unlocked |

#### Notification
| Field | Type | Description |
|---|---|---|
| `type` | enum | achievement / streak / streak_warning / goal_deadline / goal_completed / weekly_summary / personal_record / inactivity / welcome / milestone |
| `title` | string | Short heading |
| `message` | string | Description text |
| `icon` | string | Emoji icon |
| `read` | boolean | Has user seen it |
| `linkTo` | string? | Route to navigate on click |
| `createdAt` | Date | When notification was created |
| `readAt` | Date? | When it was marked read |

---

## Authentication & Security

### Authentication Flow

```
Landing (/) ──► Register (/register) ──► Onboarding (/onboarding) ──► Home (/home)
     │                                        ▲
     └──► Login (/login) ─────────────────────┘
                                    (skips onboarding if profile exists)
```

- **Provider:** Firebase Authentication (email/password + **Google Sign-In** via `GoogleAuthProvider`)
- **Google OAuth:** `signInWithPopup` — auto-detects new users, routes to onboarding if no profile exists
- **State Management:** `AuthProvider` context wraps the entire app; exposes `user` and `loading`
- **Route Protection:** `ProtectedRoute` component redirects unauthenticated users to `/`
- **Session:** Firebase manages session tokens automatically; persists across browser restarts

### Firestore Security Rules

All data access is scoped to the authenticated user:

```javascript
match /users/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;

  match /{subcollection}/{docId} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
}
```

No user can read or modify another user's data.

---

## Offline & PWA Support

### Service Worker (`public/sw.js`)

- **Static assets** → Cache-first strategy (JS, CSS, fonts, images)
- **API/navigation** → Network-first with cache fallback
- **Offline fallback** → Serves `offline.html` when network and cache both miss
- **Version management** → Cache versioned as `gymi-v3`; old caches auto-cleaned

### IndexedDB Offline Store

- **Library:** `idb` (Promise-based IndexedDB wrapper)
- **Stores:** `workouts`, `meals`, `goals`, `weightLogs`, `syncQueue`
- **Operations:** Full CRUD locally; operations queued for sync
- **Sync:** Automatic sync on `online` event via `syncManager.ts`; last-write-wins conflict resolution

### PWA Installation

- **Manifest** at `/manifest.json` with app name, icons, display mode `standalone`
- **Install Prompt** component captures `beforeinstallprompt` (Chrome/Edge) and shows iOS-specific instructions
- **Icons** in SVG format (192px, 512px, maskable)

---

## Pages & Routing

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page — hero, features, CTA; redirects to `/home` if authenticated |
| `/login` | Public | Email/password + Google Sign-In login |
| `/register` | Public | New account registration (Google + password strength meter) |
| `/onboarding` | Public | Post-registration profile setup (goal, weight, height, unit preference) |
| `/privacy` | Public | Privacy Policy page |
| `/terms` | Public | Terms of Service page |
| `/home` | Protected | Dashboard with stats, activity feed, quick actions |
| `/workouts` | Protected | Workout log — CRUD, search, filters, exercise library |
| `/nutrition` | Protected | Meal log — CRUD, search, filters, templates |
| `/coach` | Protected | AI Coach — camera feed, pose detection, form feedback |
| `/progress` | Protected | Goals, weight chart, achievements, streak, insights |
| `/account` | Protected | Account settings (profile edit, unit preference, data export, danger zone) |
| `/achievements` | Protected | Full achievements gallery with filters |

### Route Groups

- **`(auth)`** — Auth pages with a minimal layout (no nav bars)
- **`(app)`** — Authenticated pages wrapped in `ProtectedRoute`, `ErrorBoundary`, and `ToastProvider`

### Navigation

- **Mobile (< 768px):** Sticky bottom nav bar with 5 items (Home, Workouts, Coach, Nutrition, Profile)
- **Desktop (≥ 768px):** Fixed left sidebar with the same links plus account access
- **User Menu:** Top-right avatar dropdown → Account Settings, Theme toggle, Log out
- **Notification Bell:** Bell icon with unread badge, opens dropdown panel with notification list

---

## Service Layer API

All service functions are `async` and interact with Firestore. They accept a `uid` (user ID) as the first parameter.

### `lib/auth.ts`
| Function | Description |
|---|---|
| `registerUser(name, email, password)` | Create Firebase user |
| `loginUser(email, password)` | Sign in with email/password |
| `signInWithGoogle()` | Sign in with Google OAuth (returns `{ user, isNewUser }`) |
| `logoutUser()` | Sign out |
| `createUserProfile(uid, data)` | Create Firestore profile doc |
| `getUserProfile(uid)` | Fetch user profile |
| `updateUserProfile(uid, updates)` | Patch profile fields |
| `hasUserProfile(uid)` | Check if profile exists |

### `lib/workouts.ts`
| Function | Description |
|---|---|
| `addWorkout(uid, data)` | Create a workout entry |
| `getWorkouts(uid, limit?)` | Fetch all workouts (sorted by date) |
| `getWorkout(uid, workoutId)` | Fetch single workout |
| `updateWorkout(uid, workoutId, updates)` | Update a workout |
| `deleteWorkout(uid, workoutId)` | Delete a workout |
| `getWorkoutsByDateRange(uid, start, end)` | Query by date range |
| `getRecentWorkouts(uid, count)` | Fetch last N workouts |

### `lib/meals.ts`
| Function | Description |
|---|---|
| `addMeal(uid, data)` | Create a meal entry |
| `getMeals(uid, limit?)` | Fetch all meals |
| `getMeal(uid, mealId)` | Fetch single meal |
| `getMealsByDate(uid, date)` | Fetch meals for a specific day |
| `updateMeal(uid, mealId, updates)` | Update a meal |
| `deleteMeal(uid, mealId)` | Delete a meal |
| `getTodayCalories(uid, date?)` | Sum today's calories |
| `getDayMacros(uid, date?)` | Aggregate daily macros |

### `lib/goals.ts`
| Function | Description |
|---|---|
| `addGoal(uid, data)` | Create a goal |
| `getGoals(uid, status?)` | Fetch goals (optionally filtered by status) |
| `getActiveGoals(uid)` | Fetch only active goals |
| `getGoal(uid, goalId)` | Fetch single goal |
| `updateGoal(uid, goalId, updates)` | Update a goal |
| `deleteGoal(uid, goalId)` | Delete a goal |
| `completeGoal(uid, goalId)` | Mark goal as completed |
| `calculateGoalProgress(uid, goal)` | Calculate current progress percentage |

### `lib/weightLogs.ts`
| Function | Description |
|---|---|
| `addWeightLog(uid, data)` | Log a weight entry |
| `getWeightLogs(uid, limit?)` | Fetch weight history |
| `getWeightLogsByDateRange(uid, start, end)` | Query by date range |
| `getLatestWeightLog(uid)` | Most recent weight entry |
| `updateWeightLog(uid, logId, updates)` | Update a log |
| `deleteWeightLog(uid, logId)` | Delete a log |
| `getWeightChange(uid, days)` | Calculate weight change over N days |

### `lib/stats.ts`
| Function | Description |
|---|---|
| `getWeeklyWorkoutCount(uid)` | Workouts this week |
| `getTodayCalories(uid)` | Calories logged today |
| `getTodayMacros(uid)` | Today's macro totals |
| `getFavoriteExercises(uid, limit?)` | Most frequently logged exercises |
| `getRecentEntries(uid, count?)` | Latest workouts + meals combined |
| `getWorkoutStreak(uid)` | Consecutive workout days |
| `getMonthlyStats(uid)` | Monthly aggregates |
| `getDashboardStats(uid, unitSystem?)` | All dashboard data in one call (unit-aware) |

### `lib/achievements.ts`
| Function | Description |
|---|---|
| `unlockAchievement(uid, achievement)` | Persist a new achievement |
| `getAchievements(uid)` | Fetch all unlocked achievements |
| `calculateStreaks(workoutDates)` | Compute current + longest streaks |
| `calculateMealStreak(mealDates)` | Compute meal logging streak |
| `gatherAchievementStats(uid)` | Collect all stats needed for achievement checks |
| `checkForNewAchievements(uid)` | Evaluate and unlock new achievements |
| `getMilestoneProgress(uid)` | Progress toward each milestone |

### `lib/reports.ts`
| Function | Description |
|---|---|
| `getWeeklyWorkoutReport(uid)` | Weekly workout summary |
| `getWeeklyNutritionReport(uid)` | Weekly nutrition summary |
| `getMonthlyReport(uid)` | Full monthly report |
| `getInsights(uid)` | Smart contextual insights |

### `lib/notifications.ts`
| Function | Description |
|---|---|
| `createNotification(uid, data)` | Add a new notification to Firestore |
| `getNotifications(uid, limit?)` | Fetch notifications (newest first, default 20) |
| `getUnreadCount(uid)` | Count unread notifications |
| `markAsRead(uid, notificationId)` | Mark single notification as read |
| `markAllAsRead(uid)` | Mark all notifications as read |
| `deleteNotification(uid, notificationId)` | Remove a notification |
| `deleteOldNotifications(uid, daysOld)` | Cleanup notifications older than N days |

### `lib/notificationTriggers.ts`
| Function | Description |
|---|---|
| `checkWorkoutNotifications(uid, unitSystem?)` | Check for streak, milestone, PR notifications after workout CRUD |
| `checkMealNotifications(uid)` | Check for calorie goal notifications after meal CRUD |
| `checkDashboardNotifications(uid)` | Weekly summary, inactivity, streak warnings on dashboard load |
| `checkGoalNotifications(uid)` | Goal completion and deadline notifications |
| `createWelcomeNotification(uid)` | Welcome notification after onboarding |

### `lib/cache.ts`
| Function | Description |
|---|---|
| `cacheGet(key)` | Get cached value (returns `undefined` if expired) |
| `cacheSet(key, value, ttlMs?)` | Set cached value with optional TTL (default 5 min) |
| `cacheInvalidate(keyOrPrefix)` | Invalidate exact key or prefix (if ends with `:`) |

### `lib/mealTemplates.ts`
| Function | Description |
|---|---|
| `addMealTemplate(uid, data)` | Save a meal template |
| `getMealTemplates(uid)` | Fetch all templates |
| `getMealTemplatesByType(uid, type)` | Filter by meal type |
| `getMealTemplate(uid, templateId)` | Fetch single template |
| `updateMealTemplate(uid, templateId, updates)` | Update a template |
| `deleteMealTemplate(uid, templateId)` | Delete a template |
| `templateToMeal(template)` | Convert template to meal entry data |

---

## Design System

### Theme

- **Palette:** Minimalist black and white, professional tone
- **Default:** Dark mode (applied via `dark` class on `<html>`)
- **Toggle:** Inline sun/moon icons in the user menu dropdown
- **Persistence:** Theme stored in `localStorage` as `gymi-theme`; applied before hydration via inline `<script>`

### Typography

- **Primary:** Geist Sans (variable font via `next/font/google`)
- **Monospace:** Geist Mono (for code-like elements)

### Responsive Strategy

| Breakpoint | Layout |
|---|---|
| < 768px (Mobile) | Full-width content, bottom nav bar, stacked cards, full-screen modals |
| ≥ 768px (Desktop) | Fixed left sidebar, max-width content container, modal dialogs, grid layouts |

### Component Patterns

- **Cards:** White background with subtle `border-zinc-200` / dark `border-zinc-800`
- **Buttons:** `Button.tsx` component with loading spinner, variant support
- **Modals:** `Modal.tsx` with backdrop, escape-to-close, click-outside-to-close
- **Toast Notifications:** 4 variants (success / error / info / warning), auto-dismiss, stackable
- **Skeletons:** Pulsing placeholder shapes for workout, meal, stat, and activity loading states
- **Error Boundary:** Catch-all with "Try again" and "Reload page" recovery actions

---

## Environment Setup

### Prerequisites
- Node.js 18+ (built with Node 24.x)
- npm
- Firebase project with Auth and Firestore enabled

### Installation

```bash
git clone https://github.com/ABDULLAHAZHERCH/gymi.git
cd gymi
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase project credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

All variables are prefixed with `NEXT_PUBLIC_` — they are embedded in the client bundle (this is safe for Firebase web SDKs; security is enforced by Firestore rules, not API key secrecy).

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (localhost:3000, hot reload) |
| `npm run build` | Create optimized production build |
| `npm run start` | Run production server locally |
| `npm run lint` | Run ESLint with Next.js + TypeScript rules |

---

## Deployment

### Vercel (Current)

The app is deployed on Vercel with automatic deploys from the `main` branch on GitHub.

- **Production URL:** [gymii.vercel.app](https://gymii.vercel.app)
- **Framework:** Auto-detected as Next.js
- **Build Command:** `next build`
- **Output:** Static (all 16 pages pre-rendered)
- **Environment Variables:** Configured in Vercel Dashboard → Settings → Environment Variables

### Build Output

```
Route (app)             Size
/                       Landing page
/home                   Dashboard
/workouts               Workout logger
/nutrition              Nutrition diary
/coach                  AI Coach
/progress               Progress tracking
/account                Account settings
/achievements           Achievement gallery
/privacy                Privacy Policy
/terms                  Terms of Service
/login                  Login (Google + email/password)
/register               Register (Google + password strength)
/onboarding             Onboarding wizard (unit toggle)
/icon.svg               Favicon
```

All routes are statically generated at build time. Client-side data fetching happens after hydration via Firebase SDK.
