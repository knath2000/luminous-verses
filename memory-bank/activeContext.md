# Active Context - Luminous Verses Web App

## Current Focus: React Native Authentication Integration

**Status:** Implementing Better Auth system with React Native bridge due to Stack Auth incompatibility

### Recent Changes This Session
1. **Better Auth Implementation** - Replaced Stack Auth with Better Auth for React Native compatibility
2. **API Routing Issues** - Discovered Better Auth catch-all route `/api/auth/[...all]` conflicts with custom endpoints
3. **Migration API** - Created `/api/migrate-stack-auth` endpoint to handle Stack Auth user migration
4. **CORS Configuration** - Added proper CORS headers for React Native requests

### Current Architecture
- **Web App**: Next.js with Better Auth server integration
- **Authentication**: Better Auth with PostgreSQL (Neon database)
- **React Native Bridge**: Custom API endpoints at `/api/migrate-stack-auth`
- **OAuth Providers**: Google and GitHub configured in Better Auth

### Critical Issues Identified
1. **Routing Conflicts**: Better Auth's `[...all]` route intercepted custom migration endpoints
2. **API 404 Errors**: Migration endpoint returning 404 despite correct file structure
3. **Deployment Mismatch**: Local vs. production routing differences on Vercel

### Next Steps Required
1. **Debug Deployment**: Verify API routes are properly deployed to Vercel
2. **Test Migration Flow**: Ensure Stack Auth users can migrate to Better Auth
3. **Error Handling**: Improve React Native error handling for failed requests
4. **Documentation**: Update Better Auth setup guide with final configuration

### Active Dependencies
- `better-auth`: ^1.0.0 (server-side authentication)
- `@better-fetch/fetch`: For HTTP requests
- Better Auth Next.js integration
- Neon PostgreSQL database for user storage

### Environment Variables Needed
```bash
BETTER_AUTH_SECRET="random-secret-key"
BETTER_AUTH_URL="https://luminous-verses.vercel.app" 
DATABASE_URL="neon-postgres-connection-string"
GOOGLE_CLIENT_ID="google-oauth-client-id"
GOOGLE_CLIENT_SECRET="google-oauth-client-secret"
GITHUB_CLIENT_ID="github-oauth-client-id"
GITHUB_CLIENT_SECRET="github-oauth-client-secret"
```

### Files Modified This Session
- `/src/lib/auth.ts` - Better Auth server configuration
- `/src/app/api/auth/[...all]/route.ts` - Better Auth handler
- `/src/lib/auth-client.ts` - Better Auth React client
- `/src/app/api/migrate-stack-auth/route.ts` - Stack Auth migration endpoint
- `BETTER_AUTH_SETUP.md` - Setup documentation

### Current Blockers
- Migration API endpoint returning 404 to React Native app
- Need to verify Vercel deployment includes new API routes
- Stack Auth user validation logic needs refinement

## Current Work Focus
- **NEW (2025-06-18)**: Upgrading verse-number grid – implemented tokenised `VersePill` component and replaced inline buttons in JumpToVerseModal & SearchableVerseGrid for consistent glassmorphic, gamified styling
- Attempted implementation of pagination and navigation system for verse pages
- Created BottomNavBar and PaginationBar components with glassmorphism styling
- Enhanced useVirtualizedVerses hook with pagination functionality
- Integration with VerseListContainer completed but not working as expected
- ✅ **Mini Audio Bar** – global overlay with stop & skip, matches native design.

## Recent Changes
- **NEW**: Added verse-pill design tokens to `globals.css` and extended `tailwind.config.mjs` with custom keyframes and animations (`hoverLift`, `activeSquash`, `sparkleBurst`)
- **NEW**: Created reusable `VersePill.tsx` component with accessibility attributes and motion tokens
- **NEW**: Refactored `JumpToVerseModal.tsx` and `SearchableVerseGrid.tsx` to render `VersePill`, removing old inline class soup
- Implemented BottomNavBar component with Home, Bookmarks, Settings navigation
- Created PaginationBar with verse range display, navigation buttons, and progress indicators
- Enhanced useVirtualizedVerses hook with currentVisibleRange tracking and pagination functions
- Integrated pagination features into VerseListContainer with proper ref management
- Installed @heroicons/react 2.2.0 dependency using pnpm
- User removed pagination components from layout.tsx after they didn't work
- **FIXED**: Replaced `any`-based `cx` helper in `VersePill.tsx` with strongly-typed `ClassValue` union to satisfy ESLint `no-explicit-any` rule and unblock production builds
- **FIXED**: Added graceful 404 handling in `fetchVersesBatch` (quranApi.ts) so out-of-range requests return an empty payload instead of throwing, preventing Translation tab 404 errors
- **FIXED**: Browser Back now works inside SurahListModal – view state (`list` / `detail`) is synchronised to the URL query param `?view=` with shallow routing; back-button navigates correctly between views
- **Build blocker resolved**: ESLint `no-explicit-any` violation fixed; CI/CD green
- **FIXED**: Empty popup on Surah modal open – `handleModalClose` now resets URL param and `lastActiveView` to `list`, preventing hydration mismatch and blank render
- **FIXED**: "Show More / Show Less" buttons now stop event propagation so they no longer trigger verse-audio playback (`ExpandableText.tsx`)
- **IMPROVED**: Surah popup now restores previous scroll position in list view by wiring `onScroll` to `saveSurahListPosition`.

## Next Steps
- Validate visual/performance of VersePill in dev build; adjust virtualised grid sizing if needed
- Add Storybook (or temp route) for interactive testing with reduced-motion knob
- Write keyboard/ARIA snapshot & visual regression tests for VersePill states
- **URGENT**: Debug pagination implementation – navigation buttons still not appearing in surah popup (build now passes ✅)
- Investigate why components are not mounting/rendering in virtualized list context
- Verify component visibility, conditional rendering logic, and state management
- Consider alternative approaches for pagination in virtualized lists
- Resume work tomorrow with fresh debugging perspective
- Confirm Surah modal fix holds across reloads and browser sessions

## Active Issues
- **Pagination not working**: Despite complete implementation following established patterns, navigation buttons are not showing on verse page in surah popup
- **VersePill sizing** (NEW): Pill height may require minor tuning for small screens; observe during QA

## Learnings
- **Design Tokens Success**: Centralising surface, shadow, and motion tokens in CSS vars greatly simplifies component styling and future theming
- **Type Safety Win**: Eliminating explicit `any` tightened type checks without adding dependencies and demonstrated lightweight class-merge patterns
- **Component Re-use**: Abstracting VersePill reduced duplicate code and ensures consistent micro-interactions across grids
- Glassmorphism styling patterns are well-established and easy to follow
- Component creation and TypeScript integration went smoothly
- Pagination logic and hook enhancement completed without errors
- Issue appears to be in component visibility/rendering rather than logic implementation
- User decided to pause work and resume tomorrow for fresh debugging approach
- **Robust Error Handling**: Treating 404 as valid empty data prevents UI crashes during translation searches for short surahs
- **URL-driven State**: Encoding modal view in the URL and using `router.push({ shallow:true })` provides native browser history support without full page reloads
- **Popstate Sync**: Listening for browser `popstate` and resetting `lv_lastActiveView` to `list` keeps `sessionStorage` aligned with the URL so restoration logic doesn't re-enter the verse detail view after a Back navigation
- **Event Propagation Control**: Internal UI elements that should not trigger parent click handlers must call `e.stopPropagation()` (applied to ExpandableText toggle button)