# CURSOR.md

## Guidelines for AI Code Assistants Working on 5x5 Tracker

This file provides **specific instructions for AI coding assistants (Cursor, Codex, etc.)** working inside the 5x5 Tracker repository.

The purpose of this document is to ensure AI-generated code:

* Remains **stable**
* Matches the **existing architecture**
* Avoids unnecessary rewrites
* Produces **predictable UI behaviour**

AI assistants should **read this file before making any code changes**.

---

# 1. Project Philosophy

5x5 Tracker is intentionally:

* **Minimal**
* **Mobile-first**
* **Fast to use during workouts**
* **Focused on barbell training**

This means:

* No unnecessary features
* No complicated navigation
* No heavy UI frameworks

AI should favour **simplicity over cleverness**.

---

# 2. Core User Flow

The most important user flow is:

1. Open app
2. Start or resume workout
3. Complete sets
4. Log reps
5. Finish workout
6. Review history later

Any code change must **not disrupt this workflow**.

---

# 3. Golden Rules for AI Code Changes

## Rule 1 — Make Small Changes

Prefer **surgical modifications** instead of rewriting components.

Good:

* Adjust layout
* Add missing UI behaviour
* Fix small bugs

Bad:

* Rewriting entire screens
* Refactoring architecture
* Introducing new patterns

---

## Rule 2 — Do Not Change Data Structures

Unless explicitly instructed:

Do NOT modify:

* workout data schema
* exercise structure
* history storage format
* plate calculator logic

These systems are tightly connected.

---

## Rule 3 — Preserve Existing State Logic

Avoid altering how state flows between:

* Workout screen
* History screen
* Edit screens
* Settings

Breaking state flow can corrupt workout history.

---

## Rule 4 — Avoid New Dependencies

Do NOT install new libraries unless explicitly requested.

Use:

* Native browser APIs
* Existing utilities in the project

---

# 4. UI Layout Standards

The UI follows strict layout rules.

### Mobile-first layout

Everything must work comfortably on small screens.

Prefer:

```
vertical stacking
full width elements
large tap targets
```

Avoid:

```
side-by-side layouts
dense controls
small buttons
```

---

# 5. Button Hierarchy

The application uses **clear visual hierarchy**.

## Primary CTA

Primary actions are:

* **Full width**
* **Pinned to the bottom**
* **High contrast**

Examples:

* Start Workout
* Resume Workout
* Complete Workout

---

## Secondary Buttons

Secondary actions should be:

* Smaller
* Inline with content
* Not visually competing with the primary CTA

Examples:

* Change workout
* Plates
* Edit

---

# 6. Navigation Conventions

Navigation follows **iOS-style patterns**.

Top navigation layout:

```
Chevron Back     Screen Title     Action
```

Rules:

* Back uses a **chevron icon**
* Title is **centered**
* Actions appear **right aligned**

Examples:

```
‹ Back        History
‹ Back        Workout A        Edit
```

---

# 7. Rest Timer Behaviour

The rest timer should behave like a **floating utility element**.

Rules:

* Appears after completing a set
* Anchored near the bottom of the screen
* Always sits **above the primary CTA**
* Never overlaps the CTA

It should visually appear **layered above content**.

---

# 8. Plate Calculator Rules

Plate calculations depend on:

* Selected bar type
* Work weight
* Available plate sizes

Important constraints:

* Bar type can **only be changed in Settings**
* Plate calculations must update when settings change
* Plate calculator must remain deterministic

Do not introduce randomness or rounding changes.

---

# 9. Workout History Display

History cards summarise completed workouts.

Exercise summaries must reflect **actual performance**.

Formatting rules:

```
5x5 80kg
5/5/4/4/3 80kg
5/0/0/0/0 80kg
```

Rules:

* `x` format only when reps are identical
* `/` format when reps differ
* Missed sets must show `0`

---

# 10. Use Native Platform Components

Prefer native OS components when possible.

Examples:

Use system pickers for:

* Date selection
* Time selection

Avoid building custom versions of these controls.

---

# 11. Error Prevention

The workout tracker contains **stateful session data**.

AI must ensure:

* Set inputs remain connected to the correct exercise
* Editing history does not break previous records
* Work weights persist correctly
* Date editing does not overwrite unrelated data

---

# 12. Performance Requirements

The app must feel **instant during workouts**.

Avoid:

* heavy calculations during renders
* unnecessary state updates
* expensive re-renders

Workout set taps must always feel immediate.

---

# 13. When Unsure

If a task is ambiguous:

AI should:

1. Ask for clarification
2. Suggest minimal changes
3. Avoid assumptions about product behaviour

---

# 14. Good AI Behaviour Examples

Good tasks for AI:

* UI alignment fixes
* navigation layout improvements
* button hierarchy adjustments
* small state fixes
* styling consistency

Bad tasks for AI:

* architectural refactors
* database redesign
* framework migration
* rewriting large screens

---

# 15. Goal of AI Contributions

AI should behave like a **careful junior engineer maintaining a production app**.

Preferred traits:

* conservative
* precise
* incremental
* predictable

Avoid:

* experimentation
* creative architecture
* speculative improvements

---

# End of File
