# Instant Calc 🧮

Real-time calculation notebook with syntax highlighting, deduction tracking, and cloud sync.

## Features ✨

- **Syntax Highlighting** — headings, comments, expenses, and variables colour-coded as you type
- **Real-Time Evaluation** — results appear instantly in the output panel; no submit button needed
- **Variable Assignment** — `name = expression` or `name: expression` stores a value
- **Auto-Commenting** — set a deduction day per expense; past-due lines are commented out automatically
- **Due Next mode** — toggle to preview next month's deductions
- **Rich Text Input** — powered by Quill, with coloured formatting preserved
- **Cloud Sync** — sign in with Google to save notebooks to Firebase
- **Dark Mode** — toggle between light and dark themes
- **PWA** — installable as a progressive web app

## Usage

1. Type into the left panel (rich-text editor).
2. Each line is evaluated on the fly — output appears on the right.
3. `name: value` or `name = value` creates a variable you can reuse later.
4. `//` comments out a line, `#` creates a heading.
5. Keywords: `prev` (last result), `sum` (running total), `monthlyPayDate` (days until payday).
6. Click the calendar icon 🌿 next to an expense to set its deduction day.
7. Sign in to save automatically.

## Quick Start

```bash
npm install
npm run dev      # local dev server
npm test         # vitest
npm run build    # production build
npm run lint     # eslint + prettier
```

## Tech Stack

- **Framework:** Next.js 14 (Pages Router), React 18
- **Language:** TypeScript
- **Editor:** react-quill (Quill rich text editor)
- **Styling:** Tailwind CSS + CSS Modules
- **State:** React hooks (useState, useCallback, useEffect)
- **Database:** Firebase Realtime Database (auth + data sync)
- **Animation:** Framer Motion
- **Testing:** Vitest
