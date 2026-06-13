# Changelog

All notable changes to `Laravel Catchy` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.6] - 2026-06-13

### Fixed
- Prevented scroll jumping to the top of the page on form redirect submissions where the path did not change.

## [1.1.5] - 2026-06-13

### Fixed
- Fixed morphing redirect target behavior: redirects now target the main container (`#catchy-app`) instead of form-specific target containers.
- Excluded validation errors from displaying as `[object Object]` toast notifications.


## [1.1.4] - 2026-06-13

### Added
- Extracted and dispatched validation errors from Laravel session or JSON responses to components.
- Handled validation errors inside the upload component to display error messages.

## [1.1.3] - 2026-06-13

### Fixed
- Disabled submit button pointers and preserved scroll position on morph container visits.

## [1.1.2] - 2026-06-13

### Fixed
- Prevented recursive file input changes by adding an updating state lock to the upload component.

## [1.1.1] - 2026-06-13

### Added
- Integrated custom progress loader and file upload UI components.
- Optimized existing blade components to use Blade attributes merge.

## [1.1.0] - 2026-06-13

### Added
- Automatic submit button loading and disabling state during form submissions.

## [1.0.9] - 2026-06-13

### Fixed
- Output `data-catchy` attributes in the form component.
- Added hyphenated events to `CatchyDirective`.
- Triggered hard reload on 429 status codes.
- Standardized whitespace formatting.

## [1.0.8] - 2026-06-13

### Fixed
- Added dual support for colon-less and colon-based form lifecycle events.

## [1.0.7] - 2026-06-13

### Fixed
- Resolved scoping issue for the response variable in `catchy.js`.

## [1.0.6] - 2026-06-13

### Fixed
- Resolved modal event bubbling issues.
- Handled same-origin redirects with headers.
- Supported colon-less custom events.
- Allowed history updates for redirected responses in `catchy.js`.

## [1.0.5] - 2026-06-13

### Fixed
- Prevented POST validation failures from causing MethodNotAllowedHttpException by limiting the `catchy.js` catch block redirect fallback only to GET requests.
- Resolved Alpine expression compilation error (`Unexpected token 'for'`) in `<x-catchy-toast>` component by changing `for-of` loop to `Object.entries().forEach()`.

## [1.0.4] - 2026-06-13

### Changed
- Updated README documentation to explicitly instruct users to install `alpinejs` and `@alpinejs/morph` when bundling via NPM/Vite.

## [1.0.3] - 2026-06-13

### Changed
- Moved `alpinejs` and `@alpinejs/morph` from `peerDependencies` to `dependencies` in `package.json` to ensure they are automatically installed as transient dependencies by the host application.

## [1.0.2] - 2026-06-13

### Changed
- Switched README badges from Packagist to GitHub-based and static badges to prevent "not found" status messages.

## [1.0.1] - 2026-06-13

### Fixed
- Fixed `.gitattributes` export-ignore rule that was excluding the `config/catchy.php` configuration file from Composer archive downloads.

## [1.0.0] - 2026-06-13

### Added
- Initial release of Laravel Catchy.
- SPA-like page transitions and morphing using Alpine.js and `@alpinejs/morph`.
- Form submission interceptor (`@catchyForm` directive).
- Viewport loader loading bar.
- Dynamic layout extraction middleware (`CatchySPAMiddleware`).
- Session flash message handling with `<x-catchy-toast>`.
- Customizable loading indicator, modal component, and transitions.
