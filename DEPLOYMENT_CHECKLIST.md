# Phase 3 Backend - Deployment Checklist

## Local Testing (No Firebase Console Changes Needed)

- [ ] Start dev server: `npm run dev`
- [ ] Test **Register Flow**:
  - Go to `/register`
  - Create account with test email
  - You should see in browser console any errors
  - Check if you can proceed to `/onboarding`
  
- [ ] Test **Onboarding Flow**:
  - Fill in goal, weight, height
  - Should redirect to `/` if successful
  
- [ ] Test **Login Flow**:
  - Logout from `/profile`
  - Go to `/login`
  - Login with same email/password
  - Should skip onboarding and go to `/`

- [ ] Check **Firebase Console** (Only if running):
  - Authentication → Users (should see registered user)
  - Firestore → Browse (should see user document at `/users/{uid}`)

## Firebase Console Setup (One-Time - Do This Once)

⚠️ **ONLY if you haven't already done this:**

- [ ] Go to [Firebase Console](https://console.firebase.google.com)
- [ ] Select your GYMI project
- [ ] Create Firestore Database (if not already created)
  - Start in **Production Mode**
  - Choose closest region
- [ ] Create Cloud Storage (if not already created)
- [ ] Go to **Firestore → Rules** tab
  - Copy contents of `firebase/firestore.rules`
  - Paste and click **Publish**
- [ ] Go to **Storage → Rules** tab
  - Copy contents of `firebase/storage.rules`
  - Paste and click **Publish**

## Verify Everything Works

After testing above:

- [ ] Open Firebase Console → Authentication
  - See your test user registered
  
- [ ] Open Firebase Console → Firestore
  - Navigate to `/users` collection
  - See your user document with:
    ```
    name: "Your Name"
    email: "your@email.com"
    goal: "Build strength"
    weight: 70
    height: 175
    createdAt: (timestamp)
    updatedAt: (timestamp)
    ```

## Issues Checklist

If something doesn't work:

- [ ] Check `.env.local` has all Firebase credentials filled in
- [ ] Check Firestore rules were published (not just copied)
- [ ] Check Authentication is enabled in Firebase Console
- [ ] Check email/password auth method is enabled
- [ ] Clear browser cache and try again
- [ ] Check browser console for error messages

## Success! ✅

If all tests pass:
- Auth backend is fully set up and working
- User data is being saved to Firestore securely
- Ready to start Phase 4 (Workout Logging)

---

**Questions?** Check `FIREBASE_SETUP.md` for detailed troubleshooting!
