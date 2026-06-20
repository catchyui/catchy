<?php

use Hamzi\Catchy\Http\Middleware\Pipeline\AppendResponseHeaders;
use Hamzi\Catchy\Http\Middleware\Pipeline\ExtractResponseContainer;
use Hamzi\Catchy\Http\Middleware\Pipeline\HandleRedirectResponse;
use Hamzi\Catchy\Http\Middleware\Pipeline\VerifyAssetVersion;

return [

    /*
    |--------------------------------------------------------------------------
    | Catchy Container ID
    |--------------------------------------------------------------------------
    |
    | This option defines the default DOM element ID that wraps the dynamic
    | page content of your application. The middleware will extract this
    | element when an SPA request is detected, and the Alpine.js plugin
    | will morph this element's contents/attributes on the frontend.
    |
    | Default: 'catchy-app'
    |
    */

    'container_id' => 'catchy-app',

    /*
    |--------------------------------------------------------------------------
    | Auto Inject Scripts
    |--------------------------------------------------------------------------
    |
    | When enabled, Catchy will automatically inject the required SPA routing
    | scripts into standard HTML responses before the </body> tag.
    | Set to false if you want to manually insert @catchyScripts in your layouts.
    |
    */

    'auto_inject' => true,

    /*
    |--------------------------------------------------------------------------
    | Catchy Asset Version
    |--------------------------------------------------------------------------
    |
    | Under the hood, Catchy can trace application build differences (similar to
    | Inertia.js). If you update your CSS/JS assets, Catchy can detect a mismatch
    | between client and server versions, forcing a clean browser page reload
    | to load the latest builds.
    |
    | You can define a static string here (like a release number), or leave it
    | empty to let the AssetVersionRepository automatically hash the production
    | Vite build/manifest.json file. Set to null to disable version checks.
    |
    | Default: '' (Auto-resolve Vite build manifests)
    |
    */

    'version' => '',

    /*
    |--------------------------------------------------------------------------
    | Hover Prefetch Settings
    |--------------------------------------------------------------------------
    |
    | Catchy can prefetch link contents in the background when the user hovers
    | over a link, providing instantaneous page loads on click.
    |
    */

    'prefetch' => [
        'enabled' => true,
        'delay' => 75,       // Hover delay in milliseconds to verify user intent
        'ttl' => 30000,      // Cache lifetime in milliseconds (default: 30s)
    ],

    /*
    |--------------------------------------------------------------------------
    | Stale-While-Revalidate (SWR) Caching
    |--------------------------------------------------------------------------
    |
    | When enabled, Catchy will serve cached pages instantly and fetch fresh
    | copies in the background, morphing the DOM when updates complete.
    |
    */

    'swr' => true,

    /*
    |--------------------------------------------------------------------------
    | Built-in CSS Viewport Progress Loader
    |--------------------------------------------------------------------------
    |
    | Configure the built-in viewport loading progress bar.
    |
    */

    'loading_bar' => [
        'enabled' => true,
        'height' => '3px',   // Loading bar thickness
        'color' => 'linear-gradient(to right, #4f46e5, #06b6d4)', // CSS color/gradient
    ],

    /*
    |--------------------------------------------------------------------------
    | HTTP Pipeline Stages
    |--------------------------------------------------------------------------
    |
    | The middleware filters requests through these stages. You can customize,
    | append, or swap stages to inject custom logic (e.g. tracking, logs)
    | inside your SPA application routing cycle.
    |
    */

    'pipeline' => [
        VerifyAssetVersion::class,
        HandleRedirectResponse::class,
        AppendResponseHeaders::class,
        ExtractResponseContainer::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Excluded Routes
    |--------------------------------------------------------------------------
    |
    | Define URI patterns that should skip SPA routing. Useful for webhook URLs,
    | stripe callback routes, payment gateways, or custom admin packages.
    |
    */

    'except' => [
        // 'api/*',
        // 'stripe/*',
    ],

];
