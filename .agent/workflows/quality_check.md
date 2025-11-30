---
description: Run quality checks including security, coverage, tests, linting, formatting, and spellcheck
---

1. Check for security vulnerabilities
   // turbo

```bash
npm audit
```

2. Run tests with code coverage
   // turbo

```bash
npm test -- --coverage
```

3. Run linting
   // turbo

```bash
npm run lint
```

4. Check formatting
   // turbo

```bash
npx prettier --check .
```

5. Check spelling
   // turbo

```bash
npx cspell lint "**" --gitignore
```
