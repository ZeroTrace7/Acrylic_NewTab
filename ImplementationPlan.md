# Tabs Manager Implementation Plan

## Product Fit

Acrylic is a minimal, premium new-tab extension with a few fast utility panels.

The Tabs Manager should stay:

- small
- clear
- fast
- useful in a few seconds

It should not become a full workspace app, session manager, or power-user tab suite.

## What the Tabs Manager Is For

The Tabs Manager should help users do three things well:

1. See what is open right now
2. Save the current browsing context quickly
3. Restore a saved context later

That is enough for Acrylic.

## Current Base

The current implementation already supports:

- listing open tabs from the current window
- saving the current window as a named group
- restoring saved groups
- deleting saved groups

This plan keeps that base and improves only the parts that reduce friction.

## Final Scope

## Must Keep

- Open Tabs section
- Save current tabs as a named group
- Saved Groups section
- Restore group
- Delete group

## Minimal Improvements To Add

### 1. Keep the open tabs list live while the panel is open

Why:

- The current list becomes stale immediately after tab changes
- This hurts trust in the panel

Implementation:

- refresh the open-tabs list when tabs are created, removed, updated, moved, or activated
- only keep these listeners active while the Tabs panel is mounted
- keep the list in normal browser tab order

UX rule:

- no new visible controls are needed for this

### 2. Add a simple search field for open tabs

Why:

- search is the highest-value discovery feature
- it improves usability without adding visual clutter

Implementation:

- search by tab title
- search by hostname
- search by URL

UX rule:

- one search field only
- no advanced filters
- no sort menu

### 3. Make open-tab rows actionable

Why:

- right now rows are mostly passive
- users should be able to act on a tab directly from the panel

Implementation:

- click row to focus/open that tab
- small close button on hover

Optional if it stays visually clean:

- small pin/unpin action

UX rule:

- actions must stay compact
- actions should stay hidden until hover or focus
- do not turn each row into a toolbar

### 4. Add minimal visual status hints

Why:

- users should understand tab state at a glance

Implementation:

- active tab indicator
- pinned badge

Optional:

- grouped badge only if it stays subtle

UX rule:

- do not add multiple loud badges
- prioritize readability over density

### 5. Keep saved groups simple, but improve polish

Why:

- the saved-groups feature is already useful
- it needs polish more than expansion

Implementation:

- keep restore and delete
- keep favicon preview strip
- keep save flow as one input plus one button
- add better empty states and loading states if needed

UX rule:

- no group notes
- no nested snapshots
- no workspace model
- no extra restore modes

## Explicitly Out Of Scope

The following ideas are intentionally removed to keep Acrylic minimal:

- multi-select tabs
- advanced filters
- sort dropdowns
- duplicate management
- recently closed tab recovery
- undo system
- export/import backup
- restore into new window options
- native Chrome tab-group preservation
- saved-group history or snapshots
- pinned favorite groups
- group notes, colors, icons, or metadata
- workspace or project-space model
- inbox or temporary session model

These are valid features for a dedicated tab manager, but not for Acrylic.

## Recommended Build Order

### Phase 1: Core UX Cleanup

- live tab syncing
- search field
- click row to focus tab
- close-tab action
- cleanup function on panel unmount

This should be the first and main delivery.

### Phase 2: Small Visual Refinement

- active tab hint
- pinned badge
- hover/focus polish
- better empty/loading states

Only do this if it does not make the UI busier.

## Files To Touch

### `panels/tabs.js`

- add live syncing
- add search state
- add focus-tab action
- add close-tab action
- return cleanup from `initTabs(container)`
- keep saved-group data shape unchanged

### `css/quicktools.css`

- add minimal styles for:
  - search field
  - row hover actions
  - subtle status badges
  - clearer empty states

### `background.js`

- only update this if tab actions continue to go through runtime messages
- if `chrome.tabs` is used directly from the new tab page, this file may not need changes

### `modules/storage.js`

- no storage redesign
- keep `savedTabGroups` structure as-is

## Data Model

Keep the current saved-group shape:

```js
{
  id,
  name,
  tabs: [{ title, url, favIconUrl }],
  savedAt
}
```

No schema expansion is recommended for this iteration.

## UX Rules

- Keep the Tabs Manager visually lighter than a full dashboard
- Preserve the current compact Quick Tools panel footprint
- Do not add controls that users have to learn
- Prefer invisible improvements over visible complexity
- If a feature adds more UI than value, cut it

## Acceptance Criteria

The update is successful if:

- the open-tabs list stays accurate while the panel is open
- users can find a tab quickly with search
- users can click a row to jump to a tab
- users can close a tab directly from the row
- saved groups still work exactly as before
- the panel still feels minimal and not crowded

## Final Recommendation

Only implement the essentials:

- live sync
- search
- focus tab
- close tab
- subtle active and pinned state

That gives Acrylic a clear UX upgrade without changing its identity.
