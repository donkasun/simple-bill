# Issue: Google Authentication Doesn't Allow Account Selection

## Problem Description

When users log out of the application and return to the login screen, clicking "Sign in with Google" opens a Firebase authentication popup that automatically uses the previously selected Google account without allowing users to choose between multiple accounts.

This creates a poor user experience for users who have multiple Google accounts and need to switch between them for different purposes (e.g., personal vs work accounts).

## Current Behavior

1. User logs out of SimpleBill
2. User lands on login screen
3. User clicks "Sign in with Google" button
4. Firebase popup opens but automatically selects the previously used account
5. User cannot choose a different Google account

## Expected Behavior

1. User logs out of SimpleBill
2. User lands on login screen
3. User clicks "Sign in with Google" button
4. Firebase popup opens and shows account selection interface
5. User can choose from available Google accounts or add a new one

## Technical Details

**Current Implementation:**

- Uses `GoogleAuthProvider` with `signInWithPopup` in `src/auth/AuthProvider.tsx`
- No account selection configuration is set

**Required Changes:**

- Configure `GoogleAuthProvider` to force account selection
- Add `prompt: 'select_account'` parameter to the provider configuration

## Proposed Solution

Update the `signInWithGoogle` function in `src/auth/AuthProvider.tsx`:

```typescript
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    // ... existing error handling
  }
};
```

## Acceptance Criteria

- [ ] Google authentication popup always shows account selection interface
- [ ] Users can select from multiple Google accounts
- [ ] Users can add new Google accounts if needed
- [ ] Existing authentication flow remains functional
- [ ] No breaking changes to current user experience

## Priority

**Medium** - This affects user experience but doesn't break core functionality.

## Labels

- `enhancement`
- `authentication`
- `user-experience`
- `google-auth`

## Related Files

- `src/auth/AuthProvider.tsx`
- `src/pages/Login.tsx`
- `src/auth/useAuth.ts`
