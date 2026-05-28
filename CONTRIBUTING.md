# Contributing

Thank you for your interest in contributing to **saas-dashboard**.

## Getting started

1. Fork the repository and clone your fork.
2. Run `npm install` and `npm run dev`.
3. Create a branch: `git checkout -b feature/your-feature-name`.

## Development checks

Before opening a pull request, run:

```bash
npm run lint
npm run build
```

CI runs the same checks on every push to `main`.

## Pull requests

- Keep changes focused and describe the **why** in the PR description.
- Link related issues when applicable.
- Do not commit secrets (`.env`, API keys).

## Reporting issues

Use [GitHub Issues](https://github.com/mkkbun/saas-dashboard/issues) and include:

- Steps to reproduce
- Expected vs actual behavior
- Node.js version and OS
