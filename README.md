# SimpleBill

[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React Router](https://img.shields.io/badge/React%20Router-CA4245?logo=react-router&logoColor=white)](https://reactrouter.com/)
[![pdf-lib](https://img.shields.io/badge/pdf--lib-0A7EA4)](https://pdf-lib.js.org/)
[![Rough.js](https://img.shields.io/badge/Rough.js-888)](https://roughjs.com/)

A minimal, charming invoicing app built with React + TypeScript, Firebase, and Rough.js. Create and manage customers, items, and billing documents quickly.

## Why SimpleBill?

I built SimpleBill for my non‑tech‑savvy dad, who only needs to make an invoice occasionally — about once a week or every couple of weeks. The focus is a calm, uncluttered flow that makes the task quick and stress‑free when he needs it.

## Tech Stack

- React (Vite, TypeScript)
- Firebase (Auth with Google, Firestore)
- Rough.js for sketch‑style UI accents
- pdf-lib for PDF generation

## Prerequisites

- Node.js 18+
- A Firebase project with Firestore and Google Sign‑In enabled

## Setup

1. Install deps

```bash
npm install
```

2. Environment variables
   Create a `.env` file with your Firebase web config:

```bash
VITE_API_KEY=...
VITE_AUTH_DOMAIN=...
VITE_PROJECT_ID=...
VITE_STORAGE_BUCKET=...
VITE_MESSAGING_SENDER_ID=...
VITE_APP_ID=...
```

3. Firestore

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
- `config/firebase/firestore.rules` – Secure, per‑user access rules
- `config/firebase/firestore.indexes.json` – Composite index for `customers` (userId ASC, createdAt DESC)

## Development

Run the app locally:

```bash
npm run dev
```

## Features

- Google Sign‑In
- Customers
  - Add/Edit in modal
  - Address supports multiple lines
  - Email is optional; validated if provided
  - `showEmail` boolean to control whether email appears on documents
- Items (scaffolded)
- Dashboard (static placeholder)

## Design Language

- Rough.js‑enhanced components:
  - `PrimaryButton`, `SecondaryButton` (sketch borders/fills, hover states)
  - `StyledInput`, `StyledTextarea` (rough borders)
  - `StyledTable` (card with rough border)
- Link‑style table actions for Edit/Delete

## Code Structure

- `src/components/core/*` – Reusable UI components
- `src/components/customers/CustomerModal.tsx` – Add/Edit customer modal
- `src/auth/*` – Google Auth provider and hook
- `src/hooks/useFirestore.ts` – Generic Firestore CRUD hook
- `src/pages/*` – Route pages (Dashboard, Customers, Items)

## Roadmap

- Items CRUD
- Document creation (invoice/quotation), totals, and PDF export
- Dashboard recent documents

## Contributing

Contributions are welcome! See [CONTRIBUTING](.github/CONTRIBUTING.md) and [Code of Conduct](.github/CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
