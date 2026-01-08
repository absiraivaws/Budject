# Changelog

## Ref: FIX-001 (2026-01-08)

### Fixed
- **Transactions Page Crash**: Resolved `TypeError: tx.tags.split is not a function` by adding safe checks for tags.
- **Side Menu Visibility**: Fixed issue where side menu was hidden and transparent on mobile devices.
- **Side Menu Interactivity**: Added collapsible sub-menus and ensured scrolling works for long content.
- **Bottom Navigation**: Removed "Reports" link.
- **UI Colors**: Brightened Income (Green) and Expense (Red) colors for better visibility.

### Added
- **ErrorBoundary**: Added a global error boundary to catch and display runtime errors gracefully.
