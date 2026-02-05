# GYMI: Responsive AI Fitness Web Platform - Master Plan

## 1. Project Overview
We are building a **Responsive Web Application** called **GYMI**.
- **Goal:** AI-Powered Fitness Coach with real-time form correction.
- **Reference Vibe:** Similar to `quran.com` — Clean, text-focused, responsive.
- **Platform:** Works as a native-feel app on Mobile, and a full dashboard on Desktop.

## 2. Tech Stack
- **Framework:** Next.js 14+ (App Router, TypeScript).
- **Styling:** Tailwind CSS.
- **Icons:** Lucide React.
- **Backend:** Firebase (Auth, Firestore).
  - ⚠️ **Storage disabled** - requires credit card/Blaze plan
- **AI:** TensorFlow.js / MediaPipe.

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
- [x] Create skeleton pages (`/`, `/logs`, `/coach`, `/profile`).

### Phase 3: Auth & Onboarding (COMPLETE ✅)
**Frontend:**
- [x] Login page with Firebase authentication.
- [x] Register page with Firebase user creation.
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
- [x] Display list of logged workouts (sorted by date, newest first)
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
- [x] Display list of logged meals (grouped by date)
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
  - Built `WorkoutVolumeChart.tsx` for tracking workout volume
  - Created `weightLogs.ts` service for weight tracking
  - Created `/progress` page with dual charts
  - Weight tracking over time with trend indicators
  - Workout volume over time (sets × reps × weight)
  - Stats display (current, change, target)
  - Tooltips on hover for detailed data
  - Target weight line visualization

- [ ] **Achievements & Milestones** - DEFERRED
  - Streak milestones (7, 30, 100 days)
  - Total workout milestones (10, 50, 100)
  - Weight loss/gain milestones
  - Personal records tracking (PRs)
  - Achievement badges display
  - Share achievements (social)

- [ ] **Weekly/Monthly Reports** - DEFERRED
  - Generate workout summary reports
  - Nutrition summary reports
  - Progress insights and recommendations
  - Email weekly summary (optional)
  - Download PDF reports

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

- [ ] **Caching Strategy**
  - Implement service worker (PWA)
  - Cache API responses
  - Offline mode support
  - Background sync for offline entries
  - Cache invalidation strategy

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

### Phase 6: AI Coach (Real-Time) - PENDING

**Goal:** Implement real-time form correction using MediaPipe

#### 6.1: Camera & Pose Detection Setup

- [ ] Camera View
  - Mobile: Full screen
  - Desktop: Large central modal or container

## 5. Directory Structure
/src
  /app (Routes)
  /components
    /ui (Primitive UI elements)
    /layout (SideNav, BottomNav, Shell)
    /features (Coach, Logger)
  /lib (Firebase, Utils)