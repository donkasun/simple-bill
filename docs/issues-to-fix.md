# Issues to Fix

## 1. COOP error when Google auth — ✅ FIXED (fix/open-issues)

Cross-Origin-Opener-Policy blocks `window.closed` during Google sign-in. Console shows:

```
Cross-Origin-Opener-Policy policy would block the window.closed call.
```

**Fix:** Temporarily shadow `console.error` around the Firebase `signInWithPopup` call in
`src/auth/AuthProvider.tsx` to silently drop COOP-specific messages while letting real errors through.
Restored via `finally` block regardless of outcome. This is harmless noise that does not affect auth behavior.

## 2. No logout confirmation — ✅ ALREADY IMPLEMENTED

Logout confirmation is already implemented in `src/components/layout/AppShell.tsx`:

- Clicking **Sign out** opens a `ConfirmDialog` ("Are you sure you want to sign out of SimpleBill?")
- The dialog offers Cancel and Sign out (primary) buttons
- Signing out calls `signOut()` only after explicit confirmation

No code change needed — this was added during the usability refactor. Closing as resolved.

## 3. Add Customer / Add Item form overflow — ✅ FIXED (fix/open-issues)

Inputs in the **Add Customer** and **Add Item** modals can extend past the right edge of the modal
under certain conditions (long placeholder text, narrow viewports).

**Fix (two-pronged):**

1. Added `overflow: "hidden"` to `modalStyle` in both
   `src/components/customers/CustomerModal.tsx` and `src/components/items/ItemModal.tsx` so no content
   can visually escape the modal container.
2. Added CSS guard rules to `src/index.css`:
   - `[role="dialog"] input, textarea, select { max-width: 100%; }` — constrains all form controls
   - `.modal-error { max-width: 100%; overflow-wrap: break-word; }` — prevents error text from breaking layout
