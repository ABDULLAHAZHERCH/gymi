# Firebase Setup Guide

## 1. Firebase Console Setup

### Create/Setup Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Enable **Authentication**, **Firestore**, and **Storage**

### Enable Authentication Methods
- **Email/Password**: Enable in Authentication → Sign-in method
- Optional: Add Google, GitHub, etc.

### Create Firestore Database
- Go to Firestore Database
- Click "Create Database"
- Start in **Production Mode**
- Choose region closest to your users

### Create Cloud Storage
⚠️ **SKIP THIS STEP** - Storage requires Blaze (paid) plan
- Not needed for core features (auth, workout/meal logging)
- Can be added later for profile pictures when upgrading

---

## 2. Apply Security Rules

### Firestore Security Rules
1. Go to Firestore Database → Rules tab
2. Copy rules from `firebase/firestore.rules`
3. Click Publish

### Cloud Storage Rules
⚠️ **SKIP** - Storage not enabled (requires Blaze plan)
- Will be enabled when adding profile picture uploads
- For now, rules are set to block all access

---

## 3. Local Development Setup

### Add Firebase Credentials
1. Create `.env.local` in project root:
   ```bash
   cp .env.example .env.local
   ```

2. Get your Firebase config:
   - Firebase Console → Project Settings → Web app
   - Copy config values into `.env.local`

3. Add Google Analytics ID (optional):
   ```
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G_XXXXXXXXXX
   ```

### Environment Variables Required
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## 4. Deploy Firestore Rules

### Using Firebase CLI
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Deploy rules
firebase deploy --only firestore:rules,storage
```

---

## 5. Test Authentication Flow

### Register Flow
1. Start dev server: `npm run dev`
2. Go to `/register`
3. Create account with email/password
4. Verify user created in Firebase Console → Authentication

### Login Flow
1. Go to `/login`
2. Login with registered email/password
3. Redirected to `/onboarding`
4. Complete onboarding (goal, weight, height)
5. User profile created in Firestore at `/users/{uid}`

### Check Firestore Data
1. Firebase Console → Firestore → Browse
2. Verify collection structure:
   ```
   /users/{uid}/
     - name
     - email
     - goal
     - weight
     - height
     - createdAt
     - updatedAt
   ```

---

## 6. Firestore Rules Breakdown

### What These Rules Allow:
- ✅ Users can **only** read/write their own documents
- ✅ Authenticated users can create subcollections (workouts, meals)
- ✅ Users **cannot** access other users' data
- ✅ Unauthenticated users cannot access private data

### Example Valid Requests:
```javascript
// User can read/write their own profile
db.collection('users').doc(currentUser.uid).set(data);

// User can create workouts subcollection
db.collection('users').doc(currentUser.uid)
  .collection('workouts').doc('workout1').set(data);
```

### Example Blocked Requests:
```javascript
// ❌ Cannot access another user's data
db.collection('users').doc(OTHER_USER_ID).get();

// ❌ Cannot write to another user's data
db.collection('users').doc(OTHER_USER_ID).set(data);
```

---

## 7. Troubleshooting

### "Permission denied" errors
- Check if user is authenticated in AuthProvider
- Verify security rules are published
- Check Firestore rules syntax

### Users can't login
- Verify email/password auth is enabled in Firebase
- Check `.env.local` variables are correct
- Check Firebase project allows authentication

### Profile not saving
- Verify Firestore security rules are applied
- Check user UID matches in rules
- Verify data structure matches schema

---

## 8. Next Steps

After auth is working:
1. Build Phase 4: Workout/Meal logging
2. Create `/lib/workouts.ts` and `/lib/meals.ts` services
3. Build UI components for logging
4. Add stats calculation from logged data
