# SimpleBill

A minimal, charming invoicing app built with React + TypeScript, Firebase, and Rough.js. Create and manage customers, items, and billing documents quickly.

## Tech Stack
- React (Vite, TypeScript)
- Firebase (Auth with Google, Firestore)
- Rough.js for sketch-style UI accents
- pdf-lib for PDF generation (planned)

## Prerequisites
- Node.js 18+
- A Firebase project with Firestore and Google Sign-In enabled

## Setup
1) Install deps
```bash
npm install
```

2) Environment variables
Create a `.env` file with your Firebase web config:
```bash
VITE_API_KEY=...
VITE_AUTH_DOMAIN=...
VITE_PROJECT_ID=...
VITE_STORAGE_BUCKET=...
VITE_MESSAGING_SENDER_ID=...
VITE_APP_ID=...
```

3) Firestore
- Create the database (Native mode, region `nam5`) in Firebase Console
- Deploy rules and indexes (requires Firebase CLI):
```bash
npm i -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules,firestore:indexes
```

Files used:
- `firebase.json` – Firestore config (database, region, files)
- `firestore.rules` – Secure, per-user access rules
- `firestore.indexes.json` – Composite index for `customers` (userId ASC, createdAt DESC)

## Development
Run the app locally:
```bash
npm run dev
```

## Features
- Google Sign-In
- Customers
  - Add/Edit in modal
  - Address supports multiple lines
  - Email is optional; validated if provided
  - `showEmail` boolean to control whether email appears on documents
- Items (scaffolded)
- Dashboard (static placeholder)

## Design Language
- Rough.js-enhanced components:
  - `PrimaryButton`, `SecondaryButton` (sketch borders/fills, hover states)
  - `StyledInput`, `StyledTextarea` (rough borders)
  - `StyledTable` (card with rough border)
- Link-style table actions for Edit/Delete

## Code Structure
- `src/components/core/*` – Reusable UI components
- `src/components/customers/CustomerModal.tsx` – Add/Edit customer modal
- `src/hooks/useAuth.tsx` – Google Auth context
- `src/hooks/useFirestore.ts` – Generic Firestore CRUD hook
- `src/pages/*` – Route pages (Dashboard, Customers, Items)

## Roadmap
- Items CRUD
- Document creation (invoice/quotation), totals, and PDF export
- Dashboard recent documents

## License
MIT
