### Contributing to SimpleBill

Thank you for your interest in contributing! This project aims to make creating invoices and quotations simple and friendly for non‑tech users.

### Ways to contribute

- **Bug reports**: Open a new issue with clear steps to reproduce, expected vs. actual behavior, screenshots, and environment details.
- **Feature requests**: Open an issue describing the use‑case, proposed solution, and alternatives considered.
- **Pull requests**: Fork the repo, create a feature branch, make your change, and submit a PR following the template.

### Development setup

1. Prerequisites: Node 18+ and a Firebase project (Firestore + Google Sign‑In).
2. Install dependencies:

```bash
npm install
```

3. Configure environment variables in `.env` (see `README.md`).
4. Run locally:

```bash
npm run dev
```

5. Run quality checks:

```bash
npm run lint
npm test
npm run build
```

### Code style and quality

- TypeScript is required for app code.
- Keep code readable with clear names and early returns.
- Prefer small, focused components and hooks.
- Ensure `npm run lint` and `npm test` pass before submitting.

### Commit and PR guidelines

- Use clear commit messages (Conventional Commits are welcome but not required).
- One logical change per PR when possible.
- Include screenshots or recordings when the UI changes.
- Update docs (`README.md`) if behavior or setup changes.

### Branching

- Feature branches: `feature/<short-description>`
- Fix branches: `fix/<short-description>`

### License

By contributing, you agree that your contributions will be licensed under the project’s MIT License. See `LICENSE`.
