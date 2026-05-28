# Issues to Fix

## 1. COOP error when Google auth

Cross-Origin-Opener-Policy blocks `window.closed` during Google sign-in. Console shows:

```
Cross-Origin-Opener-Policy policy would block the window.closed call.
```

Observed in `src/auth/AuthProvider.tsx` (around `signInWithPopup`).

## 2. No logout confirmation

Signing out happens immediately with no confirmation step. Add a confirm dialog (or similar) before logging the user out.

## 3. Add Customer / Add Item form overflow

Inputs in the **Add Customer** and **Add Item** modals extend past the right edge of the modal (name, email, address, and similar fields are wider than the dialog). Constrain form fields to the modal width (e.g. `width: 100%`, `max-width: 100%`, `box-sizing: border-box` on inputs and textareas).
