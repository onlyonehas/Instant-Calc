# Fix: Auth state, Due Next, Sign-up tip, Analytics

## Problem Summary

1. **Due Next shows 850 (incorrect)** — `computeSummary` includes commented line `//comment: 300`
2. **Sign-out state persists** — input/output/deductionDates not cleared when user logs out
3. **No sign-up prompt** — anonymous users never nudged to sign in
4. **No analytics** — `measurementId` configured but `getAnalytics` never called

---

## Changes

### 1. `helpers/calculations.ts` — Fix Due Next total

**File:** `helpers/calculations.ts`  
**Location:** Line 101, inside `computeSummary`

Change:

```ts
if (!info || info.separator !== ":") continue;
```

To:

```ts
if (!info || info.separator !== ":" || info.isCommented) continue;
```

This prevents `//comment: 300` and any other commented `:`-separated line from contributing to `remainingTotal` or `dueNextTotal`.

---

### 2. `hooks/useCalculations.ts` — Clear state on logout

**Change:** Watch `user` in a new `useEffect`. When `user` becomes `null`, reset `calculations` to `null` and `hasFetchedCalculations` to `false` so that a fresh sign-in will re-fetch.

Add a cleanup effect:

```ts
useEffect(() => {
  if (!user) {
    setCalculations(null);
    setHasFetchedCalculations(false);
    setCalculationsRef(null);
  }
}, [user]);
```

Also remove the `off(calculationsRef)` cleanup inside the ref-building useEffect (it runs on every render and creates a side-effect in a setter).

---

### 3. `pages/index.tsx` — Reset on logout + sign-up tip

**A) Reset state on logout**

Add a new `useEffect` after line 96:

```ts
useEffect(() => {
  if (!user) {
    setInput(initialInput);
    setOutput("");
    setDeductionDates({});
    localStorage.removeItem("deductionDates");
  }
}, [user]);
```

**B) Inline sign-up tip banner**

Add above the main notebook grid (after the motion.div at the editor panel), when `!user`:

```tsx
{
  !user && (
    <div className="mx-auto mb-4 max-w-4xl flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
      <span>☁️ Sign in to save your notebook to the cloud and access it from anywhere.</span>
      <button
        onClick={() => toggleSingOutModal(true)}
        className="ml-4 rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
      >
        Sign In
      </button>
    </div>
  );
}
```

Note: `toggleSingOutModal` is the modal that shows sign-in/sign-out options, so reusing it is correct.

---

### 4. `lib/firebase-client.ts` — Init Firebase Analytics

Import and init analytics alongside auth/database:

```ts
import { Analytics, getAnalytics, isSupported } from "firebase/analytics";
```

Add a variable and init block:

```ts
let analytics: Analytics | undefined;

if (hasRequiredConfig && typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app!);
    }
  });
}
```

Export:

```ts
export { app, auth, database, analytics };
```

---

### 5. `pages/_app.tsx` — Log page views

Import `analytics` from `@/lib/firebase-client` and `logEvent` from `firebase/analytics`. Use Next.js router to log `page_view` on route changes:

```tsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { analytics } from "@/lib/firebase-client";
import { logEvent } from "firebase/analytics";

// Inside the component:
const router = useRouter();

useEffect(() => {
  const handleRouteChange = (url: string) => {
    if (analytics) {
      logEvent(analytics, "page_view", { page_path: url, page_title: document.title });
    }
  };
  router.events.on("routeChangeComplete", handleRouteChange);
  return () => router.events.off("routeChangeComplete", handleRouteChange);
}, [router.events]);
```

Also log an initial page_view on mount:

```tsx
useEffect(() => {
  if (analytics) {
    logEvent(analytics, "page_view", {
      page_path: window.location.pathname,
      page_title: document.title,
    });
  }
}, []);
```

---

## Verification

| Check | Command                            |
| ----- | ---------------------------------- |
| Build | `npm run build`                    |
| Lint  | `npm run lint`                     |
| Tests | `npm test` (should still be 41/41) |
| Audit | `npm run audit`                    |
