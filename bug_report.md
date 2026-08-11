# Acrylic Codebase Scan Report

## 1. Event Listener Memory Leak in \`modules/preferences.js\`
**Problem:** In \`modules/preferences.js\`, the \`ensureLayoutBindings\` function sets up global pointer and keydown event listeners (\`pointerdown\`, \`pointermove\`, \`pointerup\`, \`pointercancel\`, \`keydown\`). However, there is no corresponding teardown logic or \`removeEventListener\` calls anywhere in the file. Over time, or across repeated initialization flows, this can cause listeners to stack, leading to memory leaks and performance degradation.
**Solution:** Add a global teardown function or use an \`AbortController\` to cleanly unbind these listeners when layout editor mode is toggled or when preferences re-initialize.

## 2. Empty Catch Blocks Swallowing Errors
**Problem:** In \`modules/preferences.js\` (line 351) and \`panels/clipboard.js\` (line 48), there are empty \`catch (_e) {}\` blocks. While they might be intended to silence expected failures (e.g. \`releasePointerCapture\` throws when pointer is already released, or \`navigator.clipboard.readText\` fails on permissions), silencing errors completely masks deeper runtime issues or unexpected bugs.
**Solution:** Replace the empty catch blocks with structured console warnings or log messages (e.g., \`console.warn('Pointer capture release failed', _e)\`) to ensure errors are at least visible during development and debugging without crashing the application.

## 3. Unused Imports and Dead Code
**Problem:** Several files contain unused variables or functions:
- \`panels/pomodoro.js\`: The \`toast\` module is imported but never used.
- \`panels/toolspanel.js\`: \`handleOutsideClick\` was removed/refactored out, but an empty assignment \`let handleDocumentMouseDown = null;\` and corresponding logic in lines ~206-242 still persists, which might be dead code or an incomplete implementation of the outside-click handler.
**Solution:** Remove the unused \`toast\` import in \`pomodoro.js\`. For \`toolspanel.js\`, verify if \`handleDocumentMouseDown\` is the new intended method for closing the panel on outside click. If yes, it needs to be properly bound to the lifecycle; if no, it should be removed.

## 4. Missing Unhandled Promise Rejections (from ESLint output)
**Problem:** Across the codebase (including \`background.js\` and \`onboarding.js\`), Promises are used extensively but often lack \`.catch()\` blocks or proper \`return\` chains in their \`.then()\` callbacks (e.g., \`promise/always-return\` and \`promise/catch-or-return\` violations). This means if an async operation fails (e.g. storage access or network request), the error will be swallowed silently, potentially leaving the UI in a broken state.
**Solution:** Ensure all Promise chains end with a \`.catch()\` to handle and log errors, and ensure \`.then()\` callbacks return a value or throw an error to satisfy the promise chain correctly.

## 5. Potential State Desync in \`modules/quicklinks.js\` Drag Logic
**Problem:** The drag-and-drop logic for the sidebar (\`handleSidebarPointerDown\`, \`activateSidebarPointerDrag\`) maintains several global state variables (e.g., \`draggingSidebarLinkId\`, \`sidebarDraggedItemEl\`). If a drag is interrupted unexpectedly (e.g., by the window losing focus or the panel closing), these variables might not reset cleanly, leaving the sidebar stuck in an \`is-dragging\` state.
**Solution:** Introduce a robust cleanup mechanism, perhaps tied to \`visibilitychange\` or window blur events, that forcefully calls \`resetSidebarDragState()\` to ensure UI invariants are restored if the expected \`pointerup\` event is missed.

## 6. Panel Focus and Outside Click Inconsistency
**Problem:** In `modules/tasks.js`, `handleOutsideClick` is used properly with `mousedown`, checking if `DOM.tasksBtn` was clicked. In `panels/toolspanel.js`, the older `handleOutsideClick` was partially refactored out in favor of `handleDocumentMouseDown`, but the logic is tangled with `DOM.quickToolsBtn` and potential overlapping triggers. If a user clicks between panels (e.g. from Tasks directly to Quick Tools), there can be race conditions in the DOM event propagation leading to a state where a panel appears open but the underlying state (`isOpen`) thinks it's closed, or vice versa.
**Solution:** Unify the outside-click logic across panels to use a standard event listener pattern with `e.composedPath()` to determine if a click originated inside the panel or its trigger button, avoiding race conditions.
