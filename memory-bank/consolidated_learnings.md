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