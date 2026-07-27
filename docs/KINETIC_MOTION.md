# Kinetic Motion Guide — Instant Calc

Kinetic motion is what makes a static page feel alive — micro-interactions, transitions, and animations that respond to the user. This guide covers everything already in place and how to push it further.

---

## Existing Motion Stack

| Technique                | Where                                                     | What it does                                                                |
| ------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Framer Motion**        | `about.tsx` — 8 `<motion.*>` elements + `AnimatePresence` | Typewriter text, hero scale-in, spring-button variants, scroll-down chevron |
| **Framer Motion**        | `index.tsx` — 4 `<motion.*>` elements                     | Staggered entrance of title → notebook bar → summary bar → editor panel     |
| **CSS `@keyframes`**     | `globals.css` — `animate-gradient`                        | 8-second gradient sweep on hero heading and typewriter text                 |
| **CSS `@keyframes`**     | `Home.module.css` — `.title`                              | 2-second gradient sweep on the Home title                                   |
| **CSS transitions**      | `Dark.css` — `.dark` / `.light` / `.tdnn` / `.moon`       | Dark/light mode color swaps (200–500 ms)                                    |
| **Tailwind transitions** | `about.tsx`, `index.tsx`, `Switch.tsx`                    | Button hovers, toggle switch dot, calendar icon opacity                     |
| **Scroll-sync**          | `index.tsx` — `handleInputScroll` / `handleOutputScroll`  | Input and output panels scroll in lockstep                                  |

---

## Architecture & How It Works

### 1. Framer Motion — Declarative Animation

Framer Motion wraps React elements in `<motion.div>`, `<motion.h1>`, etc. Every motion component accepts:

```tsx
<motion.div
  initial={{ opacity: 0, y: 50 }}       // starting state
  animate={{ opacity: 1, y: 0 }}         // end state
  transition={{ duration: 0.5, delay: 0.2 }}  // timing
>
```

**Spring physics** (used in `buttonVariants`):

```tsx
visible: {
  opacity: 1, y: 0,
  transition: { type: "spring", stiffness: 300, damping: 24 },
}
```

Springs feel organic — stiffness controls speed, damping controls bounciness. Higher stiffness = snappier.

**Variants** group named states and can cascade to children:

```tsx
const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  hover: { scale: 1.05 },
};
```

Used with `initial="hidden"` `animate="visible"` `whileHover="hover"`.

**`AnimatePresence`** (typewriter word swap):

```tsx
<AnimatePresence mode="wait">
  <motion.span
    key={displayedText}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
  >
    {displayedText}
  </motion.span>
</AnimatePresence>
```

`mode="wait"` waits for exit to finish before entering. The `key` change triggers the exit/enter cycle.

### 2. CSS `@keyframes` — The Gradient Sweep

```css
@keyframes gradient {
  0%,
  100% {
    background-size: 200% 200%;
    background-position: left center;
  }
  50% {
    background-size: 200% 200%;
    background-position: right center;
  }
}
.animate-gradient {
  animation: gradient 8s linear infinite;
}
```

A background gradient larger than the element (200%) slides left-to-right over 8 seconds. Applied to text with `background-clip: text` for the colour-shifting heading.

### 3. CSS Transitions — Dark Mode

```css
.dark {
  transition: all 0.2s ease-in-out;
}
.light {
  transition: all 0.2s ease-in-out;
}
.tdnn {
  transition: all 500ms ease-in-out;
}
```

When a class is toggled (`.dark` ↔ `.light`), every animatable property transitions over 200 ms. The toggle knob uses `transition: all 400ms ease-in-out` to slide smoothly.

### 4. Tailwind Utility Transitions

```tsx
className = "transition duration-300 ease-in-out hover:bg-blue-600";
```

Lightweight, no JS runtime cost. Best for colour shifts, opacity fades, and simple hover effects.

### 5. Typewriter Effect (Custom Hook)

Not a library — pure `setTimeout` in `useEffect`:

- Types one character at a time by slicing from the source string
- Deletes one character at a time by slicing from the displayed string
- Swaps between two words (`"Instant Calculation"` / `"Instant Feedback"`) once the cycle completes

The hook signature:

```ts
const displayedText = useTypewriter(text, speed, isDeleting, index, setIndex);
```

---

## How to Add More Kinetic Motion

### A. Scroll-Triggered Reveals (Intersection Observer)

Add Framer Motion's `whileInView` for elements that animate when they scroll into the viewport:

```tsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6 }}
>
```

- `once: true` — animate only the first time
- `margin: "-100px"` — trigger 100px before the element enters the viewport

### B. Staggered Children (List Reveal)

Wrap a container and its children with variants:

```tsx
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

<motion.ul variants={container} initial="hidden" animate="visible">
  {items.map((i) => (
    <motion.li key={i} variants={item}>
      {i}
    </motion.li>
  ))}
</motion.ul>;
```

Each child delays 80 ms after the previous one — a cascading reveal.

### C. Hover / Tap Micro-Interactions

Small feedback on interactive elements:

```tsx
<motion.button
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.97 }}
>
```

Use `whileTap` to give a "pressed" feel. Combine with a subtle colour transition using Tailwind.

### D. page Transitions (AnimatePresence + Layout)

Wrap `Component` in `_app.tsx` with `<AnimatePresence mode="wait">` and animate the page wrapper:

```tsx
// _app.tsx
<AnimatePresence mode="wait">
  <motion.div
    key={router.route}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
  >
    <Component {...pageProps} />
  </motion.div>
</AnimatePresence>
```

The `key` prop (current route) tells AnimatePresence when to swap pages. `exit` defines how the old page leaves.

### E. Gradient Animation on Panels

Add a subtle animated gradient to the editor background:

```css
@keyframes panelShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
.editor-panel {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.03) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: panelShimmer 6s ease-in-out infinite;
}
```

Best done on a pseudo-element so it doesn't interfere with content.

### F. Layout Animations (Framer Motion `layout` prop)

Add `layout` to elements that reflow so Framer Motion interpolates the position change:

```tsx
<motion.div layout>
  {items.map((item) => (
    <motion.div key={item.id} layout>
      {item.name}
    </motion.div>
  ))}
</motion.div>
```

When items are added/removed/sorted, they animate to their new position instead of snapping.

---

## Performance Considerations

| Technique                         | Cost            | Notes                                                                       |
| --------------------------------- | --------------- | --------------------------------------------------------------------------- |
| CSS `transition` / `@keyframes`   | &nbsp;🟢 Free   | Composited on the GPU if using `opacity` / `transform`                      |
| Tailwind hover transitions        | &nbsp;🟢 Free   | Same as raw CSS                                                             |
| Framer Motion `initial`/`animate` | &nbsp;🟡 Low    | Offloaded to `requestAnimationFrame`                                        |
| Framer Motion `AnimatePresence`   | &nbsp;🟡 Low    | Only expensive if many children unmount simultaneously                      |
| Scroll-sync event listeners       | &nbsp;🟡 Medium | Throttle or debounce if needed                                              |
| CSS gradient animations           | &nbsp;🟠 Medium | Causes repaints — limit to small elements or use `transform: translateZ(0)` |
| Framer Motion `layout`            | &nbsp;🔴 Higher | Triggers layout calculations; avoid on large lists                          |
| Typewriter setTimeout             | &nbsp;🟢 Free   | Only one timer active at a time                                             |

**Golden rule:** Animate only `opacity` and `transform` where possible — they run on the compositor thread and don't trigger layout or paint.

---

## Quick Wins (High Impact, Low Effort)

1. **`whileInView` on service sections** — Fade in each feature card as the user scrolls
2. **`whileTap` on all buttons** — Instant tactile feedback for every clickable element
3. **Page transition** — `AnimatePresence` in `_app.tsx` for route-level fades
4. **Staggered list** — Cascade the feature list items in the about page
5. **Smooth number counter** — Animate the running totals in the output panel from 0 to their value on change
6. **Shimmer on the ruled lines** — A subtle animated gradient overlay on `.ql-editor` that adds depth without distracting
