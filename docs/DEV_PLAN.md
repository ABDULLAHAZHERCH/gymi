# GYMI: Responsive AI Fitness Web Platform - Master Plan

## 1. Project Overview
We are building a **Responsive Web Application** called **GYMI**.
- **Goal:** AI-Powered Fitness Coach with real-time form correction.
- **Reference Vibe:** Similar to `quran.com` — Clean, text-focused, responsive.
- **Platform:** Works as a native-feel app on Mobile, and a full dashboard on Desktop.

## 2. Tech Stack
- **Framework:** Next.js 16.1.6 (App Router, TypeScript, React 19.2.3).
- **Styling:** Tailwind CSS v4 (PostCSS plugin).
- **Icons:** Lucide React.
- **Backend:** Firebase (Auth, Firestore).
  - ⚠️ **Storage disabled** - requires credit card/Blaze plan
  - **Auth Providers:** Email/Password + Google Sign-In (OAuth)
- **AI:** TensorFlow.js / MediaPipe.
- **PWA:** Service Worker, IndexedDB (via `idb`), Web App Manifest.
- **Caching:** In-memory Map with TTL + prefix invalidation (`lib/cache.ts`).
- **Deployment:** Vercel (https://gymii.vercel.app).

## 3. Design System & UI Rules (Responsive Strategy)
- **Theme:** Minimalist, Black & White (Professional).
- **Typography:** Clean sans-serif (Inter or similar).
- **Layout Strategy:**
  - **Mobile (< 768px):** 
    - Full width content.
    - **Sticky Bottom Navigation Bar** (Home, Logs, Coach, Profile).
    - Stacked cards.
  - **Desktop (>= 768px):** 
    - **Left Sidebar Navigation** (Fixed).
    - Content uses a Grid layout (e.g., Dashboard cards side-by-side).
    - Max-width container for readability (like quran.com), but centered with breathing room.

- **Components:**
  - **Navigation:** Adaptive. Renders `BottomNav` on mobile, `SideNav` on desktop.
  - **Buttons:** Large and accessible.
  - **Cards:** White background with subtle border (`border-zinc-200`).

## 4. Development Roadmap

### Phase 1: Setup (DONE)
- Next.js initialized.
- Tailwind configured.
- Lucide React installed.

### Phase 2: Responsive App Shell (DONE)
- [x] Create `AppLayout` component that handles the switch between Mobile/Desktop.
- [x] Build `BottomNav` (Mobile only: `flex md:hidden`).
- [x] Build `SideNav` (Desktop only: `hidden md:flex`).
- [x] Create skeleton pages (`/`, `/workouts`, `/coach`, `/nutrition`, `/profile`).

### Phase 3: Auth & Onboarding (COMPLETE ✅)
**Frontend:**
- [x] Login page with Firebase authentication.
- [x] Register page with Firebase user creation.
- [x] **Google Sign-In** via `GoogleAuthProvider` + `signInWithPopup`.
  - `signInWithGoogle()` in `lib/auth.ts` — returns `{ user, isNewUser }`
  - Auto-detects new users (checks `hasUserProfile`) → routes to onboarding
- [x] **Auth Page Redesign:**
  - Branded logo badge, centered layout
  - Google sign-in/sign-up buttons with official SVG logo
  - Email/password inputs with Mail/Lock/User icons (Lucide)
  - **Password visibility toggle** (Eye/EyeOff icons)
  - **Password strength meter** on register page (3-bar indicator: Weak/Fair/Strong + live checklist)
  - Loader spinner states, `active:scale` press feedback
  - Styled error alerts, proper `autoComplete` attributes
  - Auth layout: subtle gradient background, refined card, footer with Privacy · Terms links
- [x] Onboarding wizard (Goal, Weight, Height) with Firestore storage.
- [x] Onboarding guard: Skip if profile already exists.
- [x] AuthProvider context for user state management.
- [x] ProtectedRoute wrapper for authenticated pages.
- [x] Logout functionality on Profile page.
- [x] Display user info on Profile and Home pages.
- [x] Dark mode default theme with no flash on load.

**Backend:**
- [x] Firebase Auth rules configured.
- [x] Firestore security rules (user-based access control).
- [x] Cloud Storage security rules.
- [x] Backend service layer (`lib/auth.ts`) for user operations.
- [x] TypeScript types for Firestore data (`lib/types/firestore.ts`).
- [x] Firestore security rules published.
- [x] Firebase setup guide (`FIREBASE_SETUP.md`).
- [x] User profile schema defined and tested.
- [x] Google OAuth configured in GCP Console (consent screen, logo, privacy/terms URLs).

**Data Structure:**
```
/users/{uid}
  - name, email, goal, weight, height
  - createdAt, updatedAt
  /workouts (future)
  /meals (future)
```

### Phase 4: Data Logging (CRUD) - COMPLETE ✅

**Goal:** Build workout and meal logging with full CRUD operations

#### 4.1: Workout Logger (Week 1) - COMPLETE ✅

**Features:**
- [x] Display list of logged workouts (sorted by date, newest first) - Now on `/workouts`
- [x] "Add Workout" button/modal
- [x] Workout entry form with fields:
  - Exercise name (text input or predefined list)
  - Sets (number)
  - Reps (number)
  - Weight (kg - number)
  - Date/Time (datetime picker)
  - Notes (optional textarea)
- [x] Edit existing workout (inline or modal)
- [x] Delete workout with confirmation
- [x] Empty state when no workouts logged
- [x] Responsive layout:
  - Mobile: Stacked cards, full-width form
  - Desktop: Table/grid view, modal form

**Backend:**
- [x] Create `lib/workouts.ts` service layer:
  - `addWorkout(uid, data)` - Create workout
  - `getWorkouts(uid, limit?)` - Fetch all workouts
  - `updateWorkout(uid, workoutId, updates)` - Edit workout
  - `deleteWorkout(uid, workoutId)` - Remove workout
  - `getWorkoutsByDateRange(uid, start, end)` - Filter by date
  - `getRecentWorkouts(uid, count)` - Last N workouts
- [x] Firestore path: `/users/{uid}/workouts/{workoutId}`
- [x] Data validation & error handling
- [x] Timezone-aware date handling

**UI Components:**
- [x] `WorkoutList` - Display workouts in responsive layout
- [x] `WorkoutCard` - Individual workout item (mobile)
- [x] `WorkoutForm` - Add/Edit form (reusable)
- [x] `Modal` - Modal wrapper for form (desktop)
- [x] Empty state when no data

#### 4.2: Nutrition Diary (Week 2) - COMPLETE ✅

**Features:**
- [x] Display list of logged meals (grouped by date) - Now on `/nutrition`
- [x] "Add Meal" button/modal
- [x] Meal entry form with fields:
  - Meal name (text)
  - Food items (comma-separated or list)
  - Calories (number)
  - Protein, Carbs, Fat (grams - numbers)
  - Meal type (breakfast/lunch/dinner/snack)
  - Date/Time
- [x] Edit existing meal
- [x] Delete meal with confirmation
- [x] Daily calorie/macro summary
- [x] Responsive layout (same pattern as workouts)

**Backend:**
- [x] Create `lib/meals.ts` service layer:
  - `addMeal(uid, data)` - Create meal
  - `getMeals(uid, limit?)` - Fetch all meals
  - `getMealsByDate(uid, date)` - Fetch by day
  - `updateMeal(uid, mealId, updates)` - Edit meal
  - `deleteMeal(uid, mealId)` - Remove meal
  - `getTodayCalories(uid)` - Calculate daily total
  - `getDayMacros(uid)` - Calculate daily macros
- [x] Firestore path: `/users/{uid}/meals/{mealId}`
- [x] Calculate daily totals

**UI Components:**
- [x] `MealList` - Display meals grouped by date
- [x] `MealCard` - Individual meal item
- [x] `MealForm` - Add/Edit form
- [x] `MacroSummary` - Show daily totals
- [x] Tabs/navigation between Workouts & Meals

#### 4.3: Dashboard Stats (Home Page)
**Page:** `/` (Home)

**Features:**
- [x] Show recent activity summary:
  - Total workouts this week/month
  - Total calories logged today
  - Favorite exercises (most logged)
  - Weekly workout streak
- [x] Quick action buttons:
  - "Log Workout" → Opens workout form
  - "Log Meal" → Opens meal form
- [x] Recent entries preview (last 3-5 items)
- [x] Macro breakdown display
- [x] Monthly stats overview

**Backend:**
- [x] Create `lib/stats.ts` service layer:
  - `getWeeklyWorkoutCount(uid)` - Count workouts
  - `getTodayCalories(uid)` - Sum calories
  - `getFavoriteExercises(uid)` - Most frequent
  - `getRecentEntries(uid, limit)` - Latest items
  - `getWorkoutStreak(uid)` - Consecutive days
  - `getDayMacros(uid)` - Daily macro totals
  - `getMonthlyStats(uid)` - Monthly aggregates
  - `getDashboardStats(uid)` - Comprehensive dashboard data
- [x] Real-time data aggregation from workouts/meals

**UI Components:**
- [x] `StatCard` - Display individual stat
- [x] `RecentActivity` - List recent entries
- [x] Quick action buttons on home
- [x] Macro summary display

#### 4.4: Technical Implementation - COMPLETE ✅

**Data Flow:**
```
User Action → UI Component → Service Layer → Firestore
                ↓
          State Update ← Response ← Promise
```

**State Management:**
- Use React hooks (useState, useEffect)
- Real-time listeners for live updates (optional)
- Optimistic UI updates for better UX

**Responsive Strategy:**
- **Mobile:** 
  - Bottom sheet/full-screen modals
  - Card-based list layout
  - Swipe actions for edit/delete
- **Desktop:**
  - Modal dialogs for forms
  - Table view with inline actions
  - Sidebar filters/sorting

**Form Validation:**
- Required fields enforcement
- Number input validation (positive values)
- Date validation (not future dates for logs)
- Error messages in red with helpful text

#### 4.5: Implementation Order

**Week 1: Workout Logger**
1. Create backend service (`lib/workouts.ts`)
2. Build workout form component
3. Build workout list/card components
4. Wire up CRUD operations
5. Add empty state & loading states
6. Test on mobile & desktop

**Week 2: Nutrition Diary**
1. Create backend service (`lib/meals.ts`)
2. Build meal form component
3. Build meal list with date grouping
4. Add macro summary calculations
5. Wire up CRUD operations
6. Create tabs for Workouts/Meals

**Week 3: Dashboard & Polish**
1. Create stats service (`lib/stats.ts`)
2. Build stat cards on home page
3. Add recent activity feed
4. Add quick action buttons
5. Polish UI/UX, fix bugs
6. Optimize performance

**Testing Checklist:**
- [x] Can create workout/meal
- [x] Can edit workout/meal
- [x] Can delete workout/meal (with confirmation)
- [x] Data persists in Firestore
- [x] Forms validate properly
- [x] Responsive on mobile/desktop
- [x] Loading states show correctly
- [x] Empty states display when no data
- [x] Security rules prevent unauthorized access
- [x] Timezone handling for GMT+5
- [x] Optional field handling (duration, notes, macros)
- [x] Dashboard stats aggregation working

### Phase 4.5: Polish, Optimization & Advanced Features - CURRENT FOCUS 🚀

**Goal:** Enhance user experience with progress tracking, performance optimization, and advanced features

#### 4.5.1: UI/UX Polish - COMPLETE ✅
**Focus:** Improve user experience and visual consistency

- [x] **Toast Notifications System**
  - Created `ToastContext.tsx` with provider and `useToast` hook
  - Built `ToastContainer.tsx` with 4 variants (success/error/info/warning)
  - Auto-dismiss with configurable duration (default 3s)
  - Supports stacking multiple toasts
  - Added slide-in-right animation
  - Replaced all inline toast messages in logs page

- [x] **Loading States Enhancement**
  - Created `Skeleton.tsx` with 4 skeleton types (workout/meal/stat/activity)
  - Added pulse animation for skeleton loaders
  - Created `Button.tsx` component with loading state (spinner + loading text)
  - Integrated skeletons into WorkoutList and MealList
  - Added spin animation for loading spinners

- [x] **Form Improvements**
  - Created `validation.ts` utility with field-level and form-level validation
  - Added real-time validation on blur in WorkoutForm
  - Red border + error messages for invalid fields
  - Error clearing on field change
  - Added keyboard shortcuts (Ctrl+Enter to submit, Escape to cancel)
  - Prevents submission when validation errors exist

- [x] **Mobile UX Enhancements**
  - Created `PullToRefresh.tsx` component for touch-based refresh
  - Added refresh functionality to logs page
  - Created `useKeyboardShortcut` hook for power users
  - Added "Pull down to refresh" hint on mobile
  - Touch target improvements in forms

- [ ] **Accessibility (a11y)** - DEFERRED
  - Add ARIA labels to all interactive elements
  - Ensure keyboard navigation works
  - Add focus indicators
  - Improve color contrast ratios
  - Add screen reader support
  - Test with accessibility tools

#### 4.5.2: Progress Tracking & Goals - COMPLETE ✅
**Focus:** Help users track their fitness journey

- [x] **Goal Management**
  - Created `goals.ts` service with full CRUD operations
  - Built `GoalForm.tsx` with type-specific fields
  - Created `GoalCard.tsx` with progress visualization
  - Integrated into Profile page with modal
  - Support for 4 goal types:
    - Weight goal (target weight, timeline)
    - Workout frequency goal (workouts per week)
    - Calorie goal (daily target)
    - Macro goals (protein/carbs/fat targets)
  - Goal status tracking (active/completed/abandoned)
  - Complete/edit/delete functionality

- [x] **Progress Charts**
  - Created `WeightChart.tsx` with bar chart visualization
  - ~~Created `WorkoutVolumeChart.tsx` for tracking workout volume~~ (Removed - not needed)
  - Created `weightLogs.ts` service for weight tracking
  - ~~Created `/progress` page~~ (Removed - merged into `/profile`)
  - Weight tracking over time with trend indicators
  - ~~Workout volume over time~~ (Removed)
  - Stats display (current, change, target)
  - Tooltips on hover for detailed data
  - Target weight line visualization
  - Weight tracker now integrated into `/profile` page

- [x] **Achievements & Milestones** - COMPLETE ✅ *(Implemented in Phase 6.2)*
  - Streak milestones (7, 14, 30, 60, 100 consecutive days)
  - Total workout milestones (10, 25, 50, 100)
  - Weight milestones (5kg, 10kg, 15kg change)
  - Personal records tracking (PRs)
  - Achievement badges display on profile + `/achievements` page
  - See Phase 6.2 for full details

- [x] **Weekly/Monthly Reports** - COMPLETE ✅ *(Implemented in Phase 6.2)*
  - Weekly workout summary reports
  - Weekly nutrition summary reports
  - Monthly progress reports
  - Smart insights and recommendations
  - See Phase 6.2 for full details
  - PDF export & email summary deferred

#### 4.5.3: Advanced Features - COMPLETE ✅
**Focus:** Add power-user features

- [x] **Search & Filters**
  - Created `SearchBar.tsx` component with clear functionality
  - Built `FilterChip.tsx` for toggle-based filtering
  - Created `FilterPanel.tsx` with date range, meal type, calorie range, and notes filters
  - Built `lib/utils/search.ts` with search and filter functions
  - Integrated into Logs page with result counts
  - Supports search by exercise name for workouts
  - Supports search by meal name and food items for meals
  - Date range filtering for both workouts and meals
  - Meal type filtering (breakfast, lunch, dinner, snack)
  - Calorie range filtering (min/max)
  - "Has notes" checkbox filter

- [x] **Exercise Library**
  - Created comprehensive exercise database with 20+ exercises
  - Exercise data model includes name, category, muscle groups, equipment, difficulty, description, instructions, and tips
  - Built `ExerciseDetailModal.tsx` with full exercise information display
  - Created `ExerciseLibrary.tsx` browser with search and filters
  - Filter by muscle group (chest, back, shoulders, legs, etc.)
  - Filter by category (strength, cardio, flexibility, sports)
  - Filter by difficulty (beginner, intermediate, advanced)
  - Created `/exercises` page for browsing library
  - "Use This Exercise" button to quick-add from library

- [x] **Meal Templates**
  - Created `lib/mealTemplates.ts` service with full CRUD operations
  - Built `MealTemplateCard.tsx` for displaying templates
  - Created `MealTemplateForm.tsx` for creating/editing templates
  - Built `/templates` page with template management
  - Templates include all meal data (name, items, macros, type, notes)
  - "Use Template" feature to quickly log saved meals
  - Templates stored in `/users/{uid}/mealTemplates/{templateId}`
  - Edit and delete functionality for templates

- [x] **Data Import/Export**
  - Created `lib/utils/export.ts` with export/import utilities
  - Export workouts to CSV with all fields
  - Export meals to CSV with macros and meal type
  - Export weight logs to CSV
  - Full backup as JSON with all user data
  - Built `/settings` page with export functionality
  - Download buttons for each data type
  - Export includes versioning and metadata
  - CSV validation functions for future import feature
  - Note: Import functionality deferred for future implementation

#### 4.5.4: Performance Optimization
**Focus:** Improve app speed and responsiveness

- [ ] **Code Optimization**
  - Implement React.memo for components
  - Use useMemo/useCallback where appropriate
  - Lazy load components (React.lazy)
  - Code splitting by route
  - Tree shaking unused code
  - Minimize bundle size

- [ ] **Database Optimization**
  - Add Firestore indexes for common queries
  - Implement pagination for large lists
  - Use Firestore query cursors
  - Cache frequently accessed data
  - Implement real-time listeners efficiently
  - Batch operations where possible

- [ ] **Image & Asset Optimization**
  - Optimize images (WebP format)
  - Lazy load images
  - Add placeholder images
  - Implement image CDN
  - Compress assets
  - Use SVGs for icons

- [x] **Caching Strategy** - PARTIALLY COMPLETE ✅
  - [x] Implement service worker (PWA) — `public/sw.js` with 3-tier caching
  - [x] Cache API responses — network-first strategy in SW
  - [x] Offline mode support — IndexedDB + sync queue (Phase 6.1)
  - [x] Background sync for offline entries — `lib/offline/syncManager.ts`
  - [x] Cache invalidation strategy — In-memory Map with TTL + prefix invalidation (`lib/cache.ts`)
  - [ ] Redis or distributed cache (not needed for current scale)

#### 4.5.5: Error Handling & Monitoring
**Focus:** Improve reliability and debugging

- [x] **Error Boundaries**
  - Created `ErrorBoundary.tsx` class component
  - User-friendly error fallback UI with icon
  - "Try again" and "Reload page" buttons
  - Error details in development mode (collapsible)
  - Integrated into app layout wrapping all content
  - Graceful error recovery

- [ ] **Analytics & Monitoring**
  - Track user interactions
  - Monitor performance metrics
  - Track error rates
  - A/B testing framework
  - User feedback collection
  - Feature usage analytics

- [ ] **Logging System**
  - Implement structured logging
  - Log important user actions
  - Log API calls and responses
  - Log performance metrics
  - Debug mode toggle
  - Export logs for debugging

#### 4.5.6: Testing & Quality Assurance
**Focus:** Ensure reliability and quality

- [ ] **Unit Tests**
  - Test service layer functions
  - Test utility functions
  - Test data transformations
  - Test validation logic
  - Achieve 80%+ coverage

- [ ] **Integration Tests**
  - Test CRUD operations end-to-end
  - Test authentication flows
  - Test form submissions
  - Test navigation flows
  - Test error scenarios

- [ ] **E2E Tests**
  - Test critical user journeys
  - Test on different browsers
  - Test on mobile devices
  - Test responsive breakpoints
  - Automated visual regression testing

#### 4.5.7: Navigation Restructuring - COMPLETE ✅
**Focus:** Reorganize app pages for better UX

**Changes Made:**
- [x] Split `/logs` page into two dedicated pages:
  - `/workouts` - Workout-only page with search/filters
  - `/nutrition` - Nutrition/meals-only page with search/filters
- [x] Moved weight tracking from `/progress` to `/profile`:
  - Added weight chart to profile
  - Added weight logging modal to profile
  - Added recent weight logs display
- [x] Deleted `/progress` page completely
  - Removed `WorkoutVolumeChart.tsx` (not needed)
  - Kept only `WeightChart.tsx` (moved to profile)
- [x] Updated navigation structure:
  - **Before:** Home → Logs → Progress → Coach → Profile
  - **After:** Home → Workout → Coach → Nutrition → Profile
- [x] Updated BottomNav and SideNav:
  - Changed icons: `BookOpen` → `Activity` (Workout), `TrendingUp` → `UtensilsCrossed` (Nutrition)
  - Removed Progress link
  - Updated href paths

**File Structure Changes:**
```
OLD:
├── app/(app)/
│   ├── logs/page.tsx (with tabs: workouts & meals)
│   ├── progress/page.tsx (weight & volume charts)
│   ├── coach/page.tsx
│   └── profile/page.tsx

NEW:
├── app/(app)/
│   ├── workouts/page.tsx (workout-only)
│   ├── nutrition/page.tsx (meals-only)
│   ├── coach/page.tsx
│   └── profile/page.tsx (with weight tracker)
```

#### Implementation Priority

**Phase 1 (Week 1): Essential Polish** ⭐⭐⭐ - COMPLETE ✅
1. ✅ Toast notification system (ToastContext + ToastContainer)
2. ✅ Loading state improvements (Skeleton components, Button loading)
3. ✅ Form validation enhancements (Real-time validation, error display)
4. ✅ Mobile UX improvements (Pull-to-refresh, keyboard shortcuts)
5. ✅ Error boundaries (ErrorBoundary component)

**Phase 2 (Week 2): Progress Tracking** ⭐⭐⭐ - COMPLETE ✅
1. ✅ Goal management system (Goals CRUD, 4 goal types)
2. ✅ Progress charts (Weight chart, Workout volume chart)
3. ✅ Weight tracking (Weight logs with notes)
4. ✅ Progress page with dual charts and stats

**Phase 3 (Week 3): Advanced Features** ⭐⭐ - COMPLETE ✅
1. ✅ Search & filters (SearchBar, FilterPanel, date/type/calorie/notes filters)
2. ✅ Exercise library (20+ exercises, muscle groups, difficulty, descriptions)
3. ✅ Meal templates (CRUD, quick-add, template management)
4. ✅ Data export (CSV/JSON, workouts/meals/weights, backup system)

**Phase 4 (Week 4): Performance & Testing** ⭐⭐
1. Code optimization
2. Database optimization
3. Caching strategy
4. Unit & integration tests

**Phase 5 (Optional): Social & Analytics** ⭐
1. Social features
2. Analytics integration
3. Monitoring setup
4. A/B testing

---

#### 4.5.8: Vercel Deployment - IN PROGRESS 🚀
**Focus:** Deploy to production on Vercel

- [x] Initialize Vercel project
  - Created `.vercel` directory
  - Linked GitHub repository (ABDULLAHAZHERCH/gymi)
  - Set project name: `gymi`
- [x] Configure build settings
  - Next.js 16 framework auto-detected
  - Node 24.x runtime
- [ ] Add environment variables to Vercel
  - NEXT_PUBLIC_FIREBASE_API_KEY
  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  - NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  - NEXT_PUBLIC_FIREBASE_APP_ID
  - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  - NEXT_PUBLIC_FORM_COACH_URL
- [x] Deploy to production
- [x] Test all features on production URL
- [x] Set up custom domain
- [x] Configure deployment protection

**Status:** ✅ DEPLOYED
**Production URL:** https://gymii.vercel.app

### Phase 5: Production & Scaling - NEXT ⭐⭐⭐

**Goal:** Launch to production and optimize for scale

#### 5.1: Vercel Deployment Completion - COMPLETE ✅
1. ✅ Added all environment variables to Vercel Console
2. ✅ Deployed to production: https://gymii.vercel.app
3. ✅ All features tested and working on production
4. ✅ GitHub integration connected for auto-deploy
5. ✅ Custom domain configured

#### 5.2: Mobile Testing & Polish (Priority)
- Test on actual iOS/Android devices
- Test responsive layouts at all breakpoints
- Test dark mode on all pages
- Optimize touch targets
- Test form inputs on mobile keyboards
- Test camera access for AI Coach
- Fix any layout regressions

#### 5.3: AI Coach WebSocket Testing
- Test connection to FastAPI backend
- Verify real-time pose detection
- Test camera feed streaming
- Implement error handling for disconnections
- Test on slow network conditions
- Add connection status indicator

#### 5.4: Performance Optimization
- Implement React.memo for heavy components
- Add pagination for large lists
- Lazy load non-critical components
- Optimize images and assets
- Monitor Core Web Vitals
- Set up performance budgets

#### 5.5: Security Hardening
- Verify Firestore security rules are deployed
- Audit Firebase configuration
- Test data isolation per user
- Verify API keys are public-safe (already NEXT_PUBLIC)
- Check for sensitive data in logs/console

#### 5.6: Analytics & Monitoring
- Set up Google Analytics
- Add error tracking (Sentry or similar)
- Monitor user flows
- Track feature usage
- Create dashboards for metrics

### Phase 6: Advanced Features - COMPLETE ✅

**Goal:** Build analytics with achievements and offline support for seamless UX

#### 6.1: Offline Support (PWA) - COMPLETE ✅
**Focus:** Enable app to work offline with sync-on-reconnect

**Features:**
- [ ] Service Worker Implementation
  - Register service worker in app layout
  - Cache static assets (JS, CSS, fonts)
  - Cache API responses with stale-while-revalidate strategy
  - Versioned cache for updates
  - Cleanup old caches on install

- [ ] Offline Data Management
  - Cache workouts/meals/goals in IndexedDB
  - Queue offline entries (create/update/delete) for sync
  - Show "Offline Mode" indicator in header
  - Track which operations are pending sync
  - Sync when connection returns (online event listener)

- [ ] Offline-First Features
  - Allow adding workouts while offline
  - Store locally, sync when online
  - Show "syncing..." spinner during sync
  - Handle sync conflicts (server vs local)
  - Toast notification for sync status

- [ ] PWA Installation
  - Web app manifest (name, icon, colors, theme)
  - Install prompt on mobile
  - App icon on homescreen
  - Full-screen mode support
  - Splash screen

**Backend:**
- [x] Create `lib/offline/offlineStore.ts` ✅
  - IndexedDB wrapper for local storage
  - Schemas for workouts, meals, goals, weights
  - CRUD operations for offline data
  - Sync queue implementation
  
- [x] Create `public/sw.js` ✅
  - Service worker with 3-tier caching strategy
  - Static asset caching (cache-first)
  - API response caching (network-first)
  - Background sync preparation

- [x] Create `lib/hooks/useOffline.ts` ✅
  - Service Worker registration
  - Online/offline event listeners
  - Update detection (60-second checks)
  - Update triggering (SKIP_WAITING)

**UI Components:**
- [x] OfflineIndicator in AppLayout ✅
  - Shows offline status with amber color
  - Shows update available with blue color
  - Fixed positioning (bottom-left mobile, bottom-right desktop)

**Implementation Steps (Week 1 - COMPLETE ✅):**
1. ✅ Install PWA dependencies (workbox, idb)
2. ✅ Create `public/manifest.json` with full PWA config
3. ✅ Create `public/sw.js` service worker with caching strategies
4. ✅ Create `lib/offline/offlineStore.ts` with IndexedDB CRUD
5. ✅ Create `lib/hooks/useOffline.ts` for SW lifecycle
6. ✅ Create `components/ui/OfflineIndicator.tsx` UI component
7. ✅ Link manifest in `app/layout.tsx` head
8. ✅ Import OfflineIndicator in AppLayout
9. ✅ Create `public/offline.html` fallback page

**Remaining Implementation (Week 2+): COMPLETE ✅**
- [x] Test offline functionality in DevTools
- [x] Create sync queue execution logic (`lib/offline/syncManager.ts`)
- [x] Handle sync conflicts (last-write-wins with retry logic)
- [x] Integrate offline CRUD into workouts/nutrition pages
- [x] PWA icons created (SVG format)
- [x] Enhanced OfflineIndicator with sync status display

**Testing:**
- [ ] Works offline (Network → Offline in DevTools)
- [ ] Data persists locally in IndexedDB
- [ ] Syncs when reconnected
- [ ] Handles sync conflicts
- [ ] PWA installable on mobile
- [ ] Works in standalone mode
- [ ] Shows offline/online indicators

---

#### 6.2: Advanced Analytics - COMPLETE ✅
**Focus:** Track achievements and provide progress insights

**Features:**

**A. Achievements & Badges**
- [x] Achievement Types (6 categories)
  - Workout Streaks (7, 14, 30, 60, 100 consecutive days)
  - Workout Milestones (10, 25, 50, 100 total workouts)
  - Weight Milestones (5kg, 10kg, 15kg weight change)
  - Personal Records (new max weight for exercise)
  - Calorie Logging (10, 25, 50 logged days)
  - Consistency (logged every day this week/month)

- [x] Achievement Data Model
  - Type (streak/milestone/record/consistency)
  - Title and description
  - Icon/emoji
  - Date earned
  - Badge color and style
  - Share-able achievement card

- [x] Backend: `lib/achievements.ts` ✅
  - `unlockAchievement(uid, achievement)` - Create achievement
  - `getAchievements(uid)` - Fetch all achievements
  - `calculateStreaks()` - Calculate current/longest streaks
  - `checkForNewAchievements(uid)` - Check after workout/meal
  - `getMilestoneProgress(uid)` - Progress to all milestones

**B. Weekly/Monthly Reports**
- [x] Report Types
  - Weekly Workout Summary
  - Weekly Nutrition Summary
  - Monthly Progress Report
  - Monthly Goals Progress

- [ ] Report Contents
  - Total workouts/meals logged
  - Most frequent exercises
  - Average weight lifted
  - Calorie trends
  - Macro breakdown
  - Goals progress percentage
  - Insights and recommendations
  - Visual charts and graphs

- [x] Backend: `lib/reports.ts` ✅
  - `getWeeklyWorkoutReport(uid)` - Summarize week
  - `getWeeklyNutritionReport(uid)` - Summarize meals
  - `getMonthlyReport(uid)` - Full month summary
  - `getInsights(uid)` - Smart recommendations
  - PDF export - Deferred

**C. Smart Insights**
- [x] Insight Types ✅
  - "You're on a 7-day streak! Keep it up!" 🔥
  - "You've completed 50 workouts. Incredible!"
  - "Your weight is trending down 📉"
  - "You're hitting your macro goals! 💪"
  - "You haven't logged in 3 days. Let's get back on track!"
  - "Your favorite exercise is Bench Press"
  - "You're most active on Mondays"

- [ ] Recommendation Engine
  - Based on workout frequency
  - Based on weight trends
  - Based on calorie intake
  - Personalized suggestions

**UI Components:**
- [x] `AchievementCard.tsx` - Display single achievement (locked/unlocked with progress bar) ✅
- [x] `StreakIndicator.tsx` - Show current/longest streak and total workouts ✅
- [x] Insights integrated directly into Profile page ✅
- [x] Achievement badges displayed in Profile page ✅

**Pages:**
- [x] `/achievements` - Browse all achievements ✅
  - Grid of achievement cards (locked/unlocked)
  - Filter by type (streaks, workouts, weight, records)
  - Overall progress bar
  - Streak indicator at top
  
- [x] Enhanced `/profile` page ✅
  - Achievement badges preview
  - Current/longest streak indicator
  - Smart insights section
  - "View All" link to achievements page

**Implementation Steps:**
1. Create achievements schema in Firestore
2. Implement achievement checking logic
3. Build achievement components
4. Add achievement unlock notifications
5. Create achievements page
6. Integrate streaks into profile
7. Build report generation functions
8. Create insights algorithm
9. Add report UI components
10. Test all achievement conditions

**Firestore Schema:**
```
/users/{uid}/achievements/{id}
  - type: 'streak' | 'milestone' | 'record' | 'consistency'
  - title, description, icon
  - unlockedAt, progressValue
  - shareableUrl (optional)

/users/{uid}/insights/{date}
  - insight: string (generated message)
  - type: 'streak' | 'milestone' | 'trend' | 'recommendation'
  - data: object (supporting metrics)
  - createdAt
```

**Testing:**
- [ ] Achievements unlock correctly
- [ ] Streaks calculated accurately
- [ ] Reports generate with correct data
- [ ] Insights are relevant and helpful
- [ ] Achievement notifications show
- [ ] Can share achievements
- [ ] Historical achievements preserved
- [ ] No duplicate achievement unlocks

---

### Phase 6.5: In-App Notifications & Alerts - COMPLETE ✅
**Focus:** Real-time notification system with bell icon in header

**Implementation Status:** All steps complete and deployed.

#### What Was Built:

**Data Layer:**
- [x] `Notification` type added to `lib/types/firestore.ts`
- [x] `lib/notifications.ts` — full CRUD service (create, get, unread count, mark read, mark all read, delete, cleanup old)
- [x] `lib/notificationTriggers.ts` — centralized trigger logic with deduplication
- [x] In-memory caching with prefix-based invalidation for notification queries
- [x] **Bug Fix:** Cache key mismatch fixed — all `cacheInvalidate` calls use trailing colon for prefix matching (`notifications:${uid}:`)

**UI Components:**
- [x] `NotificationBell.tsx` — Bell icon with unread badge (red dot/count, max "9+"), polling every 60s
- [x] `NotificationPanel.tsx` — Dropdown panel (320px, scrollable, max 20 items, mark-all-read, empty state)
- [x] `NotificationItem.tsx` — Single row (emoji icon, title/message, relative time, read/unread styling)

**Trigger Wiring:**
- [x] After workout CRUD → streak milestones, workout count milestones, personal records
- [x] After meal CRUD → calorie goals
- [x] On dashboard load → weekly summary (Monday), inactivity check, streak warnings
- [x] After goal actions → goal completion, approaching deadlines
- [x] After onboarding → welcome notification

**Header Integration:**
- [x] `NotificationBell` rendered before `UserMenu` in `PageHeader.tsx`

#### Overview
Add a notification bell icon (🔔) to the top-right corner of the header, positioned **before** the account avatar. Notifications are generated locally (client-side) based on user activity and stored in Firestore. No push notifications — everything is in-app.

#### UI Design

**Bell Icon in Header:**
- Position: `PageHeader.tsx` → between title and `UserMenu`
- Icon: `Bell` from Lucide React
- Unread badge: small red dot/count circle on the bell icon
- Click → opens a dropdown panel (similar to UserMenu pattern)
- Mobile: full-width dropdown below header
- Desktop: 320px wide dropdown, right-aligned

**Notification Panel:**
- Header: "Notifications" title + "Mark all read" button
- List: scrollable, max 20 most recent notifications
- Each item: icon + message + relative time ("2h ago", "Yesterday")
- Unread items: slightly highlighted background
- Click on notification → navigates to relevant page + marks as read
- Empty state: "No notifications yet" with subtle icon
- Footer: "View All" link → `/notifications` page (optional full page)

**Notification Item Design:**
```
┌─────────────────────────────────────────────┐
│ 🏆  You unlocked "7-Day Streak"!     2h ago│
│     Keep up the momentum.                   │
├─────────────────────────────────────────────┤
│ 🎯  Goal deadline approaching        1d ago│
│     "Lose 5kg" ends in 3 days               │
├─────────────────────────────────────────────┤
│ 💪  Weekly summary ready            3d ago │
│     5 workouts, 12,400 kcal logged          │
└─────────────────────────────────────────────┘
```

#### Notification Types

| Type | Icon | Trigger | Message Example | Links To |
|------|------|---------|-----------------|----------|
| `achievement` | 🏆 | Achievement unlocked | "You unlocked '7-Day Streak'!" | `/achievements` |
| `streak` | 🔥 | Streak milestone (7,14,30…) | "You're on a 14-day streak! 🔥" | `/progress` |
| `streak_warning` | ⚠️ | No workout logged today (evening) | "Don't break your 5-day streak! Log a workout." | `/workouts` |
| `goal_deadline` | 🎯 | Goal deadline within 3 days | "Goal 'Lose 5kg' ends in 3 days" | `/progress` |
| `goal_completed` | ✅ | Goal target reached | "You reached your weight goal!" | `/progress` |
| `weekly_summary` | 📊 | Every Monday (first login of week) | "Weekly summary: 5 workouts, 12,400 kcal" | `/progress` |
| `personal_record` | 🏅 | New PR on any exercise | "New PR! Bench Press: 100kg" | `/workouts` |
| `inactivity` | 👋 | No activity for 3+ days | "We miss you! Log a workout to stay on track." | `/workouts` |
| `welcome` | 🎉 | First login after onboarding | "Welcome to GYMI! Start by logging your first workout." | `/workouts` |
| `milestone` | ⭐ | Total workout count (10,25,50,100) | "You've completed 50 workouts!" | `/achievements` |

#### Data Model

**Firestore Path:** `/users/{uid}/notifications/{notificationId}`

```typescript
interface Notification {
  id: string;
  type: 'achievement' | 'streak' | 'streak_warning' | 'goal_deadline' 
      | 'goal_completed' | 'weekly_summary' | 'personal_record' 
      | 'inactivity' | 'welcome' | 'milestone';
  title: string;           // Short heading
  message: string;         // Description text
  icon: string;            // Emoji
  read: boolean;           // Has user seen it
  linkTo?: string;         // Route to navigate on click
  createdAt: Date;
  readAt?: Date;           // When it was marked read
}
```

**Firestore Security Rules:**
```
match /users/{uid}/notifications/{notificationId} {
  allow read, write: if isAuth() && isOwner(uid);
}
```

#### Service Layer: `lib/notifications.ts`

| Function | Description |
|----------|-------------|
| `createNotification(uid, data)` | Add a new notification to Firestore |
| `getNotifications(uid, limit?)` | Fetch notifications (newest first, default 20) |
| `getUnreadCount(uid)` | Count unread notifications |
| `markAsRead(uid, notificationId)` | Mark single notification as read |
| `markAllAsRead(uid)` | Mark all notifications as read |
| `deleteNotification(uid, notificationId)` | Remove a notification |
| `deleteOldNotifications(uid, daysOld)` | Cleanup notifications older than N days |

#### Notification Generation: `lib/notificationTriggers.ts`

Centralized logic that checks conditions and creates notifications. Called after key user actions.

| Trigger Point | When Called | What It Checks |
|---------------|------------|----------------|
| After workout CRUD | `workouts/page.tsx` after add/edit | Streak milestones, workout count milestones, personal records |
| After meal CRUD | `nutrition/page.tsx` after add/edit | Calorie goals met for the day |
| After goal update | `progress/page.tsx` after goal CRUD | Goal completion, approaching deadlines |
| On dashboard load | `home/page.tsx` on mount | Weekly summary (Monday), inactivity check, streak warnings |
| After onboarding | `onboarding/page.tsx` on complete | Welcome notification |

**Deduplication:** Before creating a notification, check if the same `type` + relevant identifier already exists for today to prevent duplicates (e.g., don't send "streak warning" twice in one day).

#### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `NotificationBell.tsx` | `components/layout/` | Bell icon with unread badge, opens dropdown |
| `NotificationPanel.tsx` | `components/layout/` | Dropdown panel with notification list |
| `NotificationItem.tsx` | `components/layout/` | Single notification row (icon, message, time, read state) |

#### Component Details

**`NotificationBell.tsx`:**
- Renders `Bell` icon from Lucide
- Shows red badge with unread count (if > 0, max display "9+")
- Click toggles `NotificationPanel`
- Polls unread count on mount + every 60 seconds (or on focus)
- Close on click-outside and Escape key (same pattern as UserMenu)

**`NotificationPanel.tsx`:**
- Positioned `absolute right-0 top-full mt-2 w-80 z-50` (same as UserMenu)
- Header with "Notifications" + "Mark all read" text button
- Scrollable list with `max-h-96 overflow-y-auto`
- Maps over notifications → renders `NotificationItem`
- Empty state with muted text and icon
- Uses `useEffect` to fetch notifications on open

**`NotificationItem.tsx`:**
- Props: `notification`, `onRead`, `onClick`
- Layout: emoji icon (left) + title/message (center) + relative time (right)
- Unread: `bg-blue-50 dark:bg-blue-950/20` background
- Read: normal background
- Click: navigate to `linkTo` route, mark as read, close panel
- Relative time: "Just now", "5m ago", "2h ago", "Yesterday", "3d ago"

#### Integration into PageHeader

```tsx
// PageHeader.tsx — updated layout
<div className="flex items-center gap-2">
  <NotificationBell />
  <UserMenu />
</div>
```

#### Implementation Plan

**Step 1: Data Layer**
1. Add `Notification` type to `lib/types/firestore.ts`
2. Create `lib/notifications.ts` service (CRUD + unread count)
3. Add Firestore security rules for notifications subcollection
4. Create `lib/notificationTriggers.ts` (generation logic with dedup)

**Step 2: UI Components**
5. Create `NotificationItem.tsx` (single notification row)
6. Create `NotificationPanel.tsx` (dropdown list)
7. Create `NotificationBell.tsx` (bell icon + badge + toggle)

**Step 3: Header Integration**
8. Update `PageHeader.tsx` to render `NotificationBell` before `UserMenu`

**Step 4: Wire Triggers**
9. Add notification checks after workout CRUD (`workouts/page.tsx`)
10. Add notification checks after meal CRUD (`nutrition/page.tsx`)
11. Add notification checks on dashboard load (`home/page.tsx`)
12. Add notification checks after goal actions (`progress/page.tsx`)
13. Add welcome notification in onboarding (`onboarding/page.tsx`)

**Step 5: Polish**
14. Add relative time utility function (`lib/utils/timeAgo.ts`)
15. Add notification cleanup (delete >30 day old notifications)
16. Test on mobile and desktop
17. Verify no duplicate notifications

#### Technical Notes
- **No push notifications** — everything is in-app only (no Firebase Cloud Messaging, no service worker push). This keeps it simple and avoids Blaze plan requirements.
- **Client-side generation** — notifications are created by the client after actions, not by a server/cloud function. This means they only generate when the user is active in the app.
- **Polling for unread count** — simple interval-based refresh (60s) rather than real-time Firestore listener to minimize reads.
- **Cleanup** — auto-delete notifications older than 30 days to prevent unbounded growth.
- **Read state** — individual and bulk "mark all read" support.

---

### Phase 6.3: Social Features - FUTURE WORK 💡

**Deferred to future versions. Includes:**
- Share workouts with friends
- Share achievements socially
- Leaderboards (friend or global)
- Workout challenges with friends
- Social feed of friend activities

**Reason:** Complex backend changes needed. Core features complete without this.

---

### Phase 6.4: Testing & CI/CD - FUTURE WORK 💡

**Deferred to future versions. Includes:**
- Unit tests (Jest)
- Integration tests (Firestore mocks)
- E2E tests (Playwright)
- GitHub Actions automation
- Pre-commit hooks and linting

**Reason:** Time-intensive but valuable for mature projects. Can be added later.

---

### Phase 7: Recent Enhancements - COMPLETE ✅

**Goal:** Polish UX, add Google Auth, imperial units, legal pages, and header refinements

#### 7.1: Imperial Unit Support - COMPLETE ✅
**Focus:** Allow users to switch between metric (kg/cm) and imperial (lbs/ft-in) units

**Strategy:** Always store metric internally in Firestore; convert for display only.

**Implementation:**
- [x] Created `lib/utils/units.ts` — Central conversion utility
  - `kgToLbs`, `lbsToKg`, `cmToFtIn`, `ftInToCm`
  - `displayWeight(kg, unitSystem)` → "70 kg" or "154.3 lbs"
  - `displayHeight(cm, unitSystem)` → "175 cm" or "5'9\""
  - `getWeightInUnit`, `weightToKg`, `weightUnit`, `heightUnit`
  - `displayWeightChange(kg, unitSystem)` → "+2.5 kg" or "+5.5 lbs"
  - Type: `UnitSystem = 'metric' | 'imperial'`

- [x] Created `components/providers/UnitProvider.tsx` — React context
  - Loads `unitSystem` from Firestore user profile on mount
  - `useUnits()` hook returns `{ unitSystem, setUnitSystem, loading }`
  - `setUnitSystem()` persists preference to Firestore
  - Wrapped in `app/layout.tsx`

- [x] Added `unitSystem?: 'metric' | 'imperial'` to `UserProfile` type

**App-Wide Integration:**
- [x] **Onboarding** — Unit toggle switch, ft/in inputs for imperial, converts to metric before store
- [x] **Account page** — Unit preference toggle section
- [x] **Progress page** — Unit-aware weight logging + display
- [x] **WeightChart** — All values/labels/tooltips converted
- [x] **WorkoutForm + WorkoutCard** — Weight label + display in user's preferred unit
- [x] **GoalForm + GoalCard** — Target weight label + display
- [x] **Dashboard stats** (`lib/stats.ts`) — `getDashboardStats(uid, unitSystem)`, cache key includes unit
- [x] **Notification triggers** — PR messages use `displayWeight()`
- [x] **Reports/Insights** — Weight insights use `displayWeightChange()`
- [x] **Data Export** — CSV headers dynamic ("Weight (kg)" vs "Weight (lbs)"), values converted

#### 7.2: Google Sign-In & Auth Redesign - COMPLETE ✅
**Focus:** Add Google OAuth and modernize auth pages

*(Details in Phase 3 update above)*

**Key Files Modified:**
- `lib/auth.ts` — Added `GoogleAuthProvider`, `signInWithPopup`, `signInWithGoogle()`
- `app/(auth)/login/page.tsx` — Complete redesign
- `app/(auth)/register/page.tsx` — Complete redesign with password strength meter
- `app/(auth)/layout.tsx` — Gradient background, footer links

#### 7.3: Header Refinement - COMPLETE ✅
**Focus:** Simplify page header

- [x] Removed page-specific title (`{title}`) from `PageHeader.tsx`
- [x] Header now only shows "GYMI" branding (larger, bolder text)
- [x] `title` prop still accepted but not rendered (backward compatible)

#### 7.4: Privacy Policy & Terms of Service - COMPLETE ✅
**Focus:** Legal pages required for Google OAuth consent screen

- [x] Created `app/privacy/page.tsx` — Comprehensive privacy policy (10 sections)
  - Data collection, usage, storage (Firebase), third-party services
  - User rights, cookies, children's privacy, contact info
- [x] Created `app/terms/page.tsx` — Comprehensive terms of service (12 sections)
  - Acceptance, service description, user accounts, acceptable use
  - Content ownership, health disclaimer, liability limitation, termination
- [x] Both pages: consistent nav header + footer, cross-links between them
- [x] Added Privacy/Terms links to landing page footer (`app/page.tsx`)
- [x] Added Privacy/Terms links to auth layout footer (`app/(auth)/layout.tsx`)

#### 7.5: GCP OAuth Assets - COMPLETE ✅
- [x] Generated `public/logo-120.png` (120×120 PNG, ~1.9KB) from `app/icon.svg` using `sharp`
- [x] For upload to GCP OAuth consent screen

---

## Implementation Timeline

**Week 1: Offline Support (PWA)**
- Service worker setup
- IndexedDB offline store
- Cache static assets
- Test offline mode

**Week 2: Offline Sync & PWA**
- Sync queue implementation
- Conflict resolution
- Online/offline detection
- PWA manifest & icons
- Mobile installation testing

**Week 3: Analytics Foundations**
- Achievement system
- Streak calculation
- Achievement unlock logic
- Achievement page UI
- Notification system

**Week 4: Analytics Reports & Insights**
- Report generation
- Insights algorithm
- Report UI components
- Integration into profile
- Final testing & polish

---

## 5. Current Status Summary

**✅ COMPLETE & PRODUCTION-READY:**
- Next.js 16.1.6 with TypeScript strict + React 19.2.3
- Firebase Auth (Email/Password + Google Sign-In) & Firestore
- Responsive mobile-first design with dark mode
- Workout logging (CRUD) with exercise library
- Nutrition logging (CRUD) with meal templates
- Weight tracking with charts (bar chart, trend indicators)
- Goal management (4 types: weight, workout frequency, calorie, macro)
- Dashboard with comprehensive stats
- Search & filtering (date range, type, calorie, notes)
- Toast notifications, form validation, error boundaries
- Achievements system (6 categories, badges, streaks)
- Weekly/monthly reports with smart insights
- In-app notification system (bell icon, 10 notification types, triggers)
- Offline support (PWA): Service Worker, IndexedDB, sync manager
- Imperial unit support (lbs/ft-in with UnitProvider context)
- Google Sign-In with redesigned auth pages
- Password visibility toggle + password strength meter
- Privacy Policy & Terms of Service pages
- Data export (CSV/JSON) with unit-aware headers
- In-memory caching with TTL + prefix invalidation
- All security rules configured & deployed

**✅ DEPLOYED:**
- Vercel production: https://gymii.vercel.app
- GCP OAuth consent screen configured (logo, privacy URL, terms URL)

**📋 NEXT PRIORITIES:**
1. Mobile device testing (iOS/Android)
2. AI Coach WebSocket testing
3. Performance optimization (React.memo, pagination, lazy loading)
4. Analytics setup (Google Analytics, error tracking)
5. Testing & CI/CD (Jest, Playwright, GitHub Actions)

**📊 CODE HEALTH:**
- 0 TypeScript errors ✅
- All pages compile successfully (16 routes) ✅
- Security rules updated for all collections ✅
- Firebase backend fully implemented ✅
- Responsive design complete ✅
- In-memory caching operational ✅

## 6. Directory Structure
```
app/
  ├── (app)/
  │   ├── home/page.tsx              # Dashboard (moved from /)
  │   ├── workouts/page.tsx          # Workout logging
  │   ├── nutrition/page.tsx         # Meal logging
  │   ├── coach/page.tsx             # AI Coach
  │   ├── profile/page.tsx           # Profile + weight tracker
  │   ├── account/page.tsx           # Account settings + unit preference
  │   ├── achievements/page.tsx      # Achievements browser
  │   ├── exercises/page.tsx         # Exercise library
  │   ├── templates/page.tsx         # Meal templates
  │   ├── settings/page.tsx          # Data export
  │   └── layout.tsx                 # App layout (nav, offline indicator)
  ├── (auth)/
  │   ├── login/page.tsx             # Login (Google + email/password)
  │   ├── register/page.tsx          # Register (Google + password strength)
  │   ├── onboarding/page.tsx        # Onboarding wizard (unit toggle)
  │   └── layout.tsx                 # Auth layout (gradient, footer)
  ├── privacy/page.tsx               # Privacy Policy
  ├── terms/page.tsx                 # Terms of Service
  ├── page.tsx                       # Landing page
  ├── layout.tsx                     # Root layout (UnitProvider)
  └── globals.css

components/
  ├── layout/
  │   ├── AppLayout.tsx
  │   ├── BottomNav.tsx
  │   ├── SideNav.tsx
  │   ├── PageHeader.tsx             # GYMI branding + notifications + user menu
  │   ├── NotificationBell.tsx       # Bell icon with unread badge
  │   ├── NotificationPanel.tsx      # Notification dropdown
  │   └── NotificationItem.tsx       # Single notification row
  ├── features/
  │   ├── WorkoutList.tsx / WorkoutCard.tsx / WorkoutForm.tsx
  │   ├── MealList.tsx / MealCard.tsx / MealForm.tsx
  │   ├── GoalCard.tsx / GoalForm.tsx
  │   ├── WeightChart.tsx            # Unit-aware weight chart
  │   ├── AchievementCard.tsx
  │   └── StreakIndicator.tsx
  ├── providers/
  │   └── UnitProvider.tsx           # Unit system context (metric/imperial)
  └── ui/
      ├── Button.tsx
      ├── Modal.tsx
      ├── SearchBar.tsx
      ├── Toast.tsx
      ├── Skeleton.tsx
      ├── ErrorBoundary.tsx
      └── OfflineIndicator.tsx

lib/
  ├── firebase.ts
  ├── auth.ts                        # Email/password + Google Sign-In
  ├── workouts.ts
  ├── meals.ts
  ├── goals.ts
  ├── weightLogs.ts
  ├── stats.ts                       # Unit-aware dashboard stats
  ├── achievements.ts
  ├── reports.ts                     # Unit-aware insights
  ├── notifications.ts               # Notification CRUD + caching
  ├── notificationTriggers.ts        # Trigger logic with dedup
  ├── cache.ts                       # In-memory cache with TTL
  ├── mealTemplates.ts
  ├── types/firestore.ts             # All types (incl. unitSystem, Notification)
  ├── utils/
  │   ├── units.ts                   # kg/lbs, cm/ft-in conversion utilities
  │   ├── export.ts                  # Unit-aware CSV/JSON export
  │   ├── search.ts
  │   ├── validation.ts
  │   └── timeAgo.ts
  ├── hooks/
  │   └── useOffline.ts
  └── offline/
      ├── offlineStore.ts            # IndexedDB wrapper
      └── syncManager.ts             # Sync queue execution

public/
  ├── manifest.json                  # PWA manifest
  ├── sw.js                          # Service worker (gymi-v3)
  ├── offline.html                   # Offline fallback
  ├── logo-120.png                   # GCP OAuth consent screen logo
  └── icons/                         # PWA icons (SVG)

firebase/
  ├── firestore.rules
  └── storage.rules
```