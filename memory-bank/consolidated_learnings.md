## Component Abstraction Pattern
- **Principle:** Extract complex UI logic and large components into smaller, single-responsibility components.
- **Rationale:** Improves readability, maintainability, reusability, and testability. Reduces cognitive load.
- **Application:** Applied during `SettingsModal` refactoring by creating `ToggleSwitch`, `VolumeSlider`, and `SettingsSection`.

## Custom Hooks Pattern
- **Principle:** Separate stateful logic and side effects from presentation components using custom React hooks.
- **Rationale:** Enhances reusability of logic, improves component readability by reducing boilerplate, and simplifies testing of logic in isolation.
- **Application:** Implemented `useVolumeControl`, `useDragInteraction`, and `useModalFocus` to abstract specific functionalities.

## TypeScript Generics Usage
- **Principle:** Utilize TypeScript generics to create flexible and reusable components and hooks that can work with various data types while maintaining type safety.
- **Rationale:** Reduces code duplication and increases adaptability of components to different contexts without sacrificing type checking benefits.
- **Application:** Ensured proper typing throughout new components and hooks, including handling `RefObject<HTMLElement | null>` for DOM element references.

## ESLint Suppression for Specific Patterns
- **Principle:** Use ESLint suppression comments (`// eslint-disable-next-line`) judiciously for specific lines or blocks of code where a linting rule might flag a valid and intentional pattern (e.g., variables assigned but not immediately used in hooks designed for future extensibility).
- **Rationale:** Prevents unnecessary warnings and allows for cleaner code without disabling rules globally, while still adhering to best practices.
- **Application:** Applied to `isDragging` in `VolumeSlider.tsx` and to `useRef`, `handleMouseDown`, `handleTouchStart` in `useDragInteraction.ts` where the variables are part of the hook's interface but not directly consumed within the hook's immediate scope.

## Performance Optimization: Centralized Data Fetching
- **Principle:** For frequently accessed, static or semi-static data, implement a centralized fetching and caching mechanism (e.g., a custom hook) to avoid redundant API calls (N+1 query problem).
- **Rationale:** Reduces network overhead, improves application responsiveness, and simplifies data management across components.
- **Application:** Applied by creating `useSurahNames` hook to fetch and cache surah names, used by `VerseItem` and `VerseListContainer`.

## Code Cleanliness: Removing Debugging Artifacts
- **Principle:** Remove all `console.log` statements and other debugging artifacts from production code.
- **Rationale:** Improves code readability, reduces bundle size, and prevents potential information leakage in production environments.
- **Application:** Removed `console.log` statements from `VerseItem.tsx` and `VerseListContainer.tsx`.

## React Hooks Rules: Unconditional Calls
- **Principle:** React Hooks (e.g., `useState`, `useEffect`, `useCallback`, `useMemo`) must always be called in the exact same order in every component render. They cannot be called conditionally or after early returns.
- **Rationale:** Ensures React's internal state management for hooks remains consistent and predictable.
- **Application:** Corrected `useCallback` placements in `VerseListContainer.tsx` by moving them to the top of the component, before any conditional rendering logic.

## Circular Dependency Resolution in React
- **Principle:** When React components create circular dependencies between state and event handlers, use `useRef` instead of `useState` for values that don't need to trigger re-renders.
- **Rationale:** Prevents infinite re-render loops and performance issues while maintaining functional behavior.
- **Application:** Fixed `VerseListContainer` scroll regression by replacing `useState` with `useRef` for `visibleStartIndex`, breaking the circular dependency between `handleScroll` and `handleItemsRendered`.

## Modal State Machine Pattern
- **Principle:** For complex modal restoration logic with multiple competing effects, implement a single coordinated state machine instead of multiple `useEffect` hooks.
- **Rationale:** Prevents race conditions, ensures predictable state transitions, and eliminates timing conflicts between different restoration logic paths.
- **Application:** Replaced multiple competing `useEffect` hooks in `SurahListModal` with a single state machine that handles modal restoration based on loading state, view type, and previous user context.

## Enhanced Scroll Preservation with Persistence
- **Principle:** Implement cross-session scroll preservation using sessionStorage with debounced writes and proper TypeScript typing for timeout references.
- **Rationale:** Provides seamless user experience across browser sessions while optimizing performance through debouncing and preventing excessive storage writes.
- **Application:** Enhanced `useScrollPreservation` hook with sessionStorage persistence, 300ms debounced saves, proper cleanup on unmount, and `NodeJS.Timeout | null` typing for timeout references.

## React State & Persistence Patterns
**Pattern: Synchronous Persistence Helper to Avoid Race Conditions**
- When persistent state depends on the latest React state, bypass potential React batching delays by writing a helper that directly mutates a ref (`stateRef.current`) and immediately writes to storage (e.g., `sessionStorage`).
- Call this helper from event handlers where accurate, atomic persistence is critical (e.g., modal `onClose`).
- *Rationale:* Ensures consistent data between in-memory state and persisted storage, eliminating race conditions where `setState` has not yet flushed.

**Pattern: Default Collapsed State for Optional UI Overlays**
- Components containing optional overlays (e.g., description panels) SHOULD default to the collapsed/hidden state (`false`) unless explicitly opened by the user.
- Restoring UI after navigation or modal reopen then faithfully reflects prior user interactions instead of forcing visibility.
- *Application:* `SurahListModal` sets `isDescriptionExpanded` initial state to `false`, preventing automatic description popup on restoration.

## Glassmorphism Design System Consistency
- **Principle:** Maintain consistent glassmorphism styling patterns across all UI components using established Tailwind CSS classes and design tokens.
- **Rationale:** Ensures visual coherence throughout the application and reduces design debt by following established patterns.
- **Application:** Successfully applied glassmorphism styling (`bg-white/10 backdrop-blur-lg border border-white/15`) to `BottomNavBar` and `PaginationBar` components, maintaining consistency with existing design system.

## Complex Component Integration Debugging
- **Principle:** When implementing complex UI features that integrate multiple systems (virtualized lists, modals, navigation), systematic debugging requires checking component mounting, conditional rendering logic, and integration points.
- **Rationale:** Complex integrations can fail at multiple points - component visibility, state management, event handling, or integration with existing systems.
- **Application:** Pagination implementation completed successfully but navigation buttons not appearing suggests issue in component visibility/rendering rather than logic implementation. Requires investigation of mounting conditions and modal/virtualized list integration.

## Virtualized List Integration Challenges
- **Principle:** When adding navigation features to virtualized lists within modals, pay special attention to component lifecycle, rendering conditions, and integration with existing scroll management.
- **Rationale:** Virtualized lists have complex rendering behavior and adding navigation controls requires careful consideration of when and how components are mounted and displayed.
- **Application:** Pagination components were properly implemented and integrated but not appearing in the UI, indicating potential issues with conditional rendering, z-index, positioning, or component lifecycle in the modal/virtualized list context.

## URL-Driven Modal State Synchronization
**Pattern:** Store modal view state in the URL query string (e.g. `?view=list|detail`) and update it with `router.push/replace` using `{ shallow: true }` whenever the view changes.

**Enhancement:** Add a `popstate` (or `router.beforePopState`) listener to synchronise any persisted UI state (e.g. `sessionStorage.lastActiveView`) with the URL when the user navigates via browser Back/Forward buttons.

**Rationale:**
- Eliminates loops where stale persisted state overrides fresh URL intent.
- Enables native history navigation without full reloads.
- Keeps session-persisted restoration logic in lock-step with actual navigation, improving reliability of complex modals.

**Application:** Implemented in `SurahListModal.tsx` – view state is encoded under `view` param and a `popstate` listener resets `lv_lastActiveView` to `list`, ensuring the Back button returns users from verse detail to the surah list instead of re-loading the detail view.

## Modal Close URL & State Reset Pattern
**Principle:** When a modal encodes its internal view in the URL (e.g., `?view=detail`), the modal's close handler must replace the URL back to its neutral state and persist `lastActiveView` as `list` (or equivalent) before unmounting.

**Rationale:** Prevents stale query flags and persisted view state from reopening the modal in an invalid context, avoiding blank UI or hydration mismatches.

**Application:** `handleModalClose` in `SurahListModal.tsx` now calls `updateUrlViewParam('list', true)` and `persistWithLastActiveView('list')` to guarantee a clean reopen experience.