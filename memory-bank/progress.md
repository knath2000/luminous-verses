## Completed
- [x] Move login button into settings modal
- [x] Update SettingsModal to include UserProfileButton
- [x] Remove standalone login button from layout
- [x] Verify all modal functionality
- [x] Confirm successful build
- [x] Fixed SurahListModal header fade-out: header now animates both opacity and max-height, so the verse list fills the space with no gap.
- [x] Switched audio source to Vercel Blob store using environment variable and updated all audio URL construction logic.
- [x] Fixed header fade-out and verse list resizing: header now animates both opacity and max-height, so the verse list fills the space with no gap.
- [x] Surah description overlay now uses React Portal, always appears above verse list, and is fully styled per design system.
- [x] Surah description now displays only the intended text, never raw JSON or extra syntax.
- [x] Fixed bookmarking runtime error: updated payload keys to match backend API schema and added robust error handling.
- [x] Removed unused imports to resolve build/linting errors.
- [x] Project builds successfully with no lint/type errors.

## Pending
- Gather user feedback on new UI flow
- Consider additional accessibility improvements

## Known Issues
None currently - all functionality working as expected