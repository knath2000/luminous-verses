# Active Context

## Current Focus
**COMPLETED**: Authentication and bookmarking system is fully integrated and functional across both `quran-data-api` and `luminous-verses` projects using **Stack Auth**. Both projects are building successfully and the Vercel deployment issue has been resolved. All `quran-data-api` specific issues related to user bookmarks API have been resolved. **The AuthModal rendering issue is also resolved.**
**COMPLETED**: Implemented dynamic header fading and verse list expansion in `SurahListModal.tsx`.
**COMPLETED**: Centralized surah name fetching to resolve N+1 query problem and removed `console.log` statements from `VerseItem.tsx` and `VerseListContainer.tsx`.

## Recent Changes
- **Authentication System Migration**: Completely replaced NextAuth + custom auth with **Stack Auth** (previously done)
- **Provider Updates**: Updated ClientProviders.tsx to use **StackAuthProvider** instead of SessionProvider/AuthProvider (previously done)
- **Component Refactoring**:
  - BookmarkHeart.tsx now uses **Stack Auth's** useAuth/useUser hooks (previously done)
  - BookmarksModal.tsx updated for **Stack Auth** authentication (previously done)
  - Replaced modal-based SignInButton with navigation to dedicated pages (previously done)
  - **AuthModal Rendering Fix**: Moved `modal-root` div inside `StackProvider` in `layout.tsx` to resolve context loss for `AuthModal`
  - **AuthModal Debugging Cleanup**: Removed temporary console logs from `AuthModal.tsx` and `UserProfileButton.tsx`
- **New Authentication Pages**: Created /sign-in and /sign-up routes with **Stack Auth** components (previously done)
- **Environment Setup**: Added **Stack Auth** keys to .env.local (previously done)
- **Middleware**: Created middleware.ts for **Stack Auth** (currently permissive) (previously done)
- **CORS Fix (Backend)**: Corrected `setCorsHeaders` parameter order in `quran-data-api/api/v1/user-bookmarks.ts`.
- **Frontend API Calls (Authorization)**: Added `Authorization: Bearer ${user.id}` headers to all bookmark API calls in `BookmarkHeart.tsx` and `BookmarksModal.tsx`.
- **Frontend API Response Handling**: Adjusted `BookmarkHeart.tsx` and `BookmarksModal.tsx` to correctly parse API responses (`data.data || data`).
- **TypeScript Build Fix**: Resolved TypeScript errors in `BookmarksModal.tsx` by using `user.id` instead of `user.userId` or `user.accessToken`.
- **Vercel Deployment Fix**: Resolved Vercel deployment error by ensuring `NEXT_PUBLIC_STACK_PROJECT_ID` is correctly configured.
- **Dependency Management**: Ensured `pnpm install` is used for `luminous-verses` dependencies.
- **Dynamic Header & Verse List Implementation**:
    - Initial attempt: Dynamic `paddingTop` based on `scrollTop` (caused large initial gap).
    - Second attempt: Absolute positioning of header, removed dynamic `paddingTop` (caused initial overlap).
    - Third attempt: Re-introduced static `paddingTop` based on `headerHeight` (caused blank space after fade).
    - Final successful implementation: Dynamic `paddingTop` based on `headerHeight * headerOpacity` for seamless content expansion.
- **Performance Optimization**:
    - Created `useSurahNames.ts` hook to centralize surah name fetching and resolve N+1 query problem.
    - Removed `console.log` statements from `VerseItem.tsx` and `VerseListContainer.tsx`.

## Critical Issues
- **NONE**: All critical authentication and bookmarking issues have been resolved.
- **NONE**: Dynamic header and verse list expansion issues resolved.
- **NONE**: Performance issues related to N+1 queries for surah names resolved.

## Next Steps (HIGH PRIORITY)
1. **Continue Feature Development**: Proceed with implementing other planned features for the Luminous Verses project.
2. **Code Cleanup**: Remove any remaining unused Clerk and NextAuth files from previous authentication integrations.
3. **Comprehensive Testing**: Implement a more comprehensive testing suite for the integrated system.

## Technical Details
- **Stack Auth Integration**: Fully functional with Google and GitHub OAuth, and email/password.
- **API Endpoint**: `https://luminous-verses-api-tan.vercel.app/api/v1/user-bookmarks`
- **Token Method**: Using Stack Auth's user `id` for backend API calls.
- **Component State**: BookmarkHeart, BookmarksModal, and AuthModal are fully functional.
- **Dynamic Header/Verse List**: Implemented using `absolute` positioning for the header and dynamic `paddingTop` for the verse list container, calculated as `headerHeight * headerOpacity`.
- **Surah Name Fetching**: Centralized via `useSurahNames` hook, improving performance by reducing redundant API calls.

## Debugging Strategy
- N/A (Current issues resolved)

## Important Patterns
- Maintained existing UI/UX patterns while switching auth providers
- Used `router.push('/sign-in')` instead of modal-based authentication for Clerk (this might be relevant in future if we revert)
- Preserved all bookmark functionality structure
- Kept API integration patterns consistent
- Implemented robust cross-project debugging for integrated systems.
- Ensured `modal-root` is within React Context Provider tree.
- Adhered to project's `pnpm` usage.
- **Dynamic Header/Verse List**:
    - Using `useRef` and `useState` hooks for DOM element measurement and state management.
    - Using `useCallback` for scroll event optimization.
    - Applying CSS transitions for smooth animations.
    - `paddingTop` creates a permanent gap if not dynamically adjusted.
    - Absolute positioning is key for overlaying elements without affecting document flow.
    - Dynamic `paddingTop` based on header opacity is crucial for seamless content expansion when the header fades.
    - `react-window` compatibility requires careful handling of container dimensions and scroll events.
- **Performance Optimization**:
    - Centralized data fetching for common resources (e.g., surah names) to avoid N+1 query problems.
    - Removed unnecessary `console.log` statements for cleaner code and potential performance gains.