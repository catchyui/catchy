<h1 align="center">Catchy </h1>

<p align="center">
 <strong>A lightweight, headless Single Page Application (SPA) adapter for Laravel 11, 12 & 13</strong>
</p>

<p align="center">
 <a href="https://github.com/hamdyelbatal122/catchy/releases"><img src="https://img.shields.io/github/v/release/hamdyelbatal122/catchy?style=flat-square&color=blue" alt="Latest Version"></a>
 <a href="https://github.com/hamdyelbatal122/catchy/actions/workflows/run-tests.yml"><img src="https://img.shields.io/github/actions/workflow/status/hamdyelbatal122/catchy/run-tests.yml?branch=main&style=flat-square&label=tests" alt="GitHub Tests Action Status"></a>
 <a href="https://packagist.org/packages/hamzi/catchy"><img src="https://img.shields.io/packagist/dt/hamzi/catchy?style=flat-square&color=goldenrod" alt="Total Downloads"></a>
 <img src="https://img.shields.io/badge/php-%5E8.2%20%7C%20%5E8.3%20%7C%20%5E8.4-blue?style=flat-square" alt="PHP Version">
 <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License"></a>
</p>

---

**Laravel Catchy** converts standard Laravel applications into high-performance, seamless SPAs using **Alpine.js** and **`@alpinejs/morph`**. By removing styling opinions and visual components, Catchy is a **100% headless** engine. You get absolute styling freedom while Catchy manages instant page transitions, form interceptions, SWR caching, and dynamic head/meta updates in the background.

---

## Core Features

- **HTML-over-the-wire**: Only modified page body fragments are exchanged, saving bandwidth and rendering instantly.
- **Zero-Configuration**: Standard links and forms are intercepted automatically. Plug and play out-of-the-box.
- **Dynamic SEO/Head Merging**: Seamlessly synchronizes page titles, meta tags, styles, and scripts on navigation.
- **Stale-While-Revalidate (SWR)**: Instantly renders cached pages and updates them in the background.
- **Headless Lazy Loading (`x-catchy-lazy`)**: Load sections asynchronously on page load or viewport intersection.
- **Two-way Syncing (`x-catchy-sync`)**: Sync inputs (such as search boxes) with the backend in real-time.
- **Graceful Degradation**: Fallbacks to standard browser requests if the connection is lost.

---

## Installation & Setup

### 1. Install Package
```bash
composer require hamzi/catchy
```

### 2. Run Installation Command
This command publishes the config file, compiled assets, and generates an optional layout boilerplate:
```bash
php artisan catchy:install
```

### 3. Setup Your Layout
Add the `<x-catchy-scripts />` Blade component (or the `@catchyScripts` directive) before the closing `</body>` tag of your application layout:
```html
<!DOCTYPE html>
<html>
<head>
 <title>My Laravel App</title>
 @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>

 <!-- Main SPA Container (Must match your container ID, default: catchy-app) -->
 <div id="catchy-app">
 @yield('content')
 </div>

 <!-- Injects Catchy SPA scripts and configuration -->
 <x-catchy-scripts />
</body>
</html>
```

---

## ️ Usage & Directives

### 1. Headless Lazy Loading (`x-catchy-lazy`)
You can lazy-load any standard HTML container immediately or when it scrolls into view (using the `.intersect` modifier). Catchy will fetch the HTML from the backend and morph it into place.

```html
<!-- Load immediately on page load -->
<div x-catchy-lazy="/comments">
 <p>Loading comments...</p> <!-- Your custom unstyled loader -->
</div>

<!-- Load only when scrolled into view -->
<div x-catchy-lazy.intersect="/recommended-products">
 <p>Loading recommendations...</p>
</div>
```

To trigger a reload programmatically, dispatch a `catchy:lazy-reload` event:
```javascript
// Reload a specific lazy-load block by targeting its element ID
window.dispatchEvent(new CustomEvent('catchy:lazy-reload', { detail: { id: 'comments-box' } }));
```

### 2. Real-Time Backend Syncing (`x-catchy-sync`)
Perfect for live search queries, filtering, or auto-saving drafts. This directive captures input events and morphs the target container with the search results.

```html
<!-- Live search: fires key-up query (debounced) and morphs the #results-box -->
<input type="text" name="query" 
 x-catchy-sync.input.debounce.300ms.target.results-box="/search" 
 placeholder="Search...">

<div id="results-box">
 <!-- Results list will morph here -->
</div>
```
- **Modifiers**: `.input` (fires on input/keystrokes), `.debounce.Xms` (delay), `.form` (serializes parent form), `.target.element-id` (identifies morph target).

### 3. Declarative Action Confirmation
Intercept actions to prevent accidental clicks:

```html
<!-- Native prompt -->
<a href="/delete" data-catchy-confirm="Are you sure you want to delete this comment?">Delete</a>
```

### 4. Declarative Event Hooks
You can chain multiple operations on link/form success or error states using `data-catchy-on-success` or `data-catchy-on-error`:

- **Shorthand Actions**: `reset` (clears form), `reload:lazy-id` (triggers lazy component reload), `toast:message` (fires a toast notification event).
- **Available Events**: Catchy dispatches standard custom events on the window/trigger element:
 - `catchy:start` / `catchy:end` (starts/stops loading)
 - `catchy:error` (request failed)
 - `catchy:flash` (contains flash message session payloads)
 - `catchy:validation-errors` (contains form validation errors)

```html
<!-- Automatically resets inputs and reloads the feed on successful post -->
<form action="/posts" method="POST" 
 data-catchy-on-success="reset;reload:posts-feed;toast:Post published successfully!">
 <textarea name="content" required></textarea>
 <button type="submit">Publish</button>
</form>

<!-- Feed gets reloaded automatically -->
<div id="posts-feed" x-catchy-lazy="/posts/feed"></div>
```

### 5. Automatic Validation Errors (Plug & Play)
Starting from version `1.5.2`, Catchy automatically highlights validation errors returned by Laravel (both from 422 JSON responses and session redirects):
* **Class Injection**: Toggles the `.is-invalid` class on the form input.
* **Error Text**: Appends a `<span class="catchy-error text-red-500 text-xs mt-1 block">` directly underneath the input element.
* **Opt-out**: To handle errors manually via custom events/Alpine.js, add `data-catchy-no-validation-errors` to your `<form>` tag:
```html
<form action="/submit" method="POST" data-catchy-no-validation-errors>
 <!-- Custom verification styles -->
</form>
```

---

## NPM / Vite Integration (Optional)

If you prefer bundling Catchy inside your primary compiled JS bundle:

1. Install required peer dependencies:
```bash
npm install alpinejs @alpinejs/morph
```

2. Register the Catchy plugin inside `resources/js/app.js`:
```javascript
import Alpine from 'alpinejs';
import morph from '@alpinejs/morph';
import Catchy from '../../public/vendor/catchy/catchy.js';

Alpine.plugin(morph);
Alpine.plugin(Catchy);

window.Alpine = Alpine;
Alpine.start();
```

3. Disable standalone auto-injection in `config/catchy.php`:
```php
'auto_inject' => false,
```

---

## License

The MIT License (MIT). Please see [License File](LICENSE) for more details.
