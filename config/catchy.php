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
    | Dynamic UI Blade Components
    |--------------------------------------------------------------------------
    |
    | Map the built-in package component views to their corresponding
    | HTML tags. This allows customizing, styling, or swapping components
    | without modifying core package source files.
    |
    */

    'components' => [
        'spinner' => 'catchy-spinner',
        'skeleton' => 'catchy-skeleton',
        'fade' => 'catchy-fade',
        'form' => 'catchy-form',
        'modal' => 'catchy-modal',
        'toast' => 'catchy-toast',
        'progress' => 'catchy-progress',
        'upload' => 'catchy-upload',
        'error' => 'catchy-error',
        'lazy' => 'catchy-lazy',
        'offcanvas' => 'catchy-offcanvas',
        'button' => 'catchy-button',
        'card' => 'catchy-card',
        'alert' => 'catchy-alert',
        'badge' => 'catchy-badge',
        'dropdown' => 'catchy-dropdown',
        'input' => 'catchy-input',
        'textarea' => 'catchy-textarea',
        'select' => 'catchy-select',
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

    /*
    |--------------------------------------------------------------------------
    | Component Tailwind Styles
    |--------------------------------------------------------------------------
    |
    | Customize the default Tailwind classes for the package components. If you
    | want to change the visual design, colors, sizes, or spacing to match your
    | theme, you can customize these classes here.
    |
    */

    'styles' => [
        'alert' => [
            'base' => 'flex p-4 rounded-xl border',
            'types' => [
                'success' => [
                    'bg' => 'bg-emerald-50 dark:bg-emerald-950/20',
                    'border' => 'border-emerald-200 dark:border-emerald-900/30',
                    'text' => 'text-emerald-800 dark:text-emerald-400',
                    'icon' => 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                ],
                'danger' => [
                    'bg' => 'bg-rose-50 dark:bg-rose-950/20',
                    'border' => 'border-rose-200 dark:border-rose-900/30',
                    'text' => 'text-rose-800 dark:text-rose-400',
                    'icon' => 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
                ],
                'warning' => [
                    'bg' => 'bg-amber-50 dark:bg-amber-950/20',
                    'border' => 'border-amber-200 dark:border-amber-900/30',
                    'text' => 'text-amber-800 dark:text-amber-400',
                    'icon' => 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
                ],
                'info' => [
                    'bg' => 'bg-sky-50 dark:bg-sky-950/20',
                    'border' => 'border-sky-200 dark:border-sky-900/30',
                    'text' => 'text-sky-800 dark:text-sky-400',
                    'icon' => 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                ],
            ],
            'dismiss_btn' => 'inline-flex rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none transition-colors',
        ],
        'badge' => [
            'base' => 'inline-flex items-center font-medium border transition-colors',
            'variants' => [
                'primary' => 'bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30',
                'secondary' => 'bg-slate-50 text-slate-700 border-slate-200/50 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/30',
                'success' => 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
                'danger' => 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
                'warning' => 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
                'info' => 'bg-sky-50 text-sky-700 border-sky-200/50 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30',
            ],
            'sizes' => [
                'sm' => 'px-1.5 py-0.5 text-xs',
                'md' => 'px-2.5 py-0.5 text-sm',
            ],
        ],
        'button' => [
            'base' => 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
            'variants' => [
                'primary' => 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 border border-transparent shadow-sm',
                'secondary' => 'bg-slate-600 hover:bg-slate-700 text-white focus:ring-slate-500 border border-transparent shadow-sm',
                'success' => 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 border border-transparent shadow-sm',
                'danger' => 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 border border-transparent shadow-sm',
                'outline' => 'border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 focus:ring-indigo-500 shadow-sm',
                'ghost' => 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 focus:ring-slate-500',
            ],
            'sizes' => [
                'sm' => 'px-3 py-1.5 text-xs',
                'md' => 'px-4 py-2 text-sm',
                'lg' => 'px-5 py-2.5 text-base',
            ],
        ],
        'card' => [
            'base' => 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden transition-all duration-300',
            'hoverable' => 'hover:shadow-md hover:scale-[1.005] hover:border-indigo-500/30',
            'header' => 'border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50',
            'body' => 'px-6 py-5',
            'footer' => 'border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50',
        ],
        'dropdown' => [
            'wrapper' => 'relative inline-block text-start',
            'trigger' => 'cursor-pointer',
            'menu' => 'absolute z-50 mt-2 rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 py-1 focus:outline-none',
            'inner' => 'rounded-xl py-1 bg-white dark:bg-slate-900',
        ],
        'error' => [
            'base' => 'text-sm text-red-600 dark:text-red-400 mt-1 font-medium',
        ],
        'input' => [
            'wrapper' => 'space-y-1',
            'label' => 'block text-sm font-medium text-slate-700 dark:text-slate-300',
            'required' => 'text-rose-500',
            'input_wrapper' => 'relative rounded-lg shadow-sm',
            'input' => 'block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors disabled:opacity-50',
            'helper' => 'text-xs text-slate-500 dark:text-slate-400',
            'error' => 'text-rose-500 text-xs mt-1',
        ],
        'textarea' => [
            'wrapper' => 'space-y-1',
            'label' => 'block text-sm font-medium text-slate-700 dark:text-slate-300',
            'required' => 'text-rose-500',
            'input_wrapper' => 'relative rounded-lg shadow-sm',
            'textarea' => 'block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors disabled:opacity-50 resize-y',
            'helper' => 'text-xs text-slate-500 dark:text-slate-400',
            'error' => 'text-rose-500 text-xs mt-1',
        ],
        'select' => [
            'wrapper' => 'space-y-1',
            'label' => 'block text-sm font-medium text-slate-700 dark:text-slate-300',
            'required' => 'text-rose-500',
            'input_wrapper' => 'relative rounded-lg shadow-sm',
            'select' => 'block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors disabled:opacity-50',
            'arrow_wrapper' => 'pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-slate-400',
            'helper' => 'text-xs text-slate-500 dark:text-slate-400',
            'error' => 'text-rose-500 text-xs mt-1',
        ],
        'lazy' => [
            'error' => 'text-sm text-rose-600 dark:text-rose-400 p-4 border border-rose-200 dark:border-rose-900/40 rounded-lg bg-rose-50 dark:bg-rose-950/20',
        ],
        'modal' => [
            'base' => 'fixed inset-0 z-50 overflow-y-auto',
            'backdrop' => 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity',
            'wrapper' => 'flex min-h-screen items-center justify-center p-4 text-center sm:p-0',
            'content' => 'relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-start shadow-2xl transition-all w-full flex flex-col max-h-[90vh]',
            'sizes' => [
                'sm' => 'sm:max-w-sm',
                'md' => 'sm:max-w-md',
                'lg' => 'sm:max-w-lg',
                'xl' => 'sm:max-w-xl',
                '2xl' => 'sm:max-w-2xl',
                '3xl' => 'sm:max-w-3xl',
                '4xl' => 'sm:max-w-4xl',
                '5xl' => 'sm:max-w-5xl',
                'full' => 'sm:max-w-full m-4',
            ],
            'header' => 'flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-6 py-4',
            'title' => 'text-lg font-semibold text-slate-900 dark:text-slate-100',
            'close_btn' => 'rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500',
            'body' => 'flex-1 overflow-y-auto px-6 py-4 text-slate-600 dark:text-slate-300',
            'footer' => 'border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3',
        ],
        'offcanvas' => [
            'base' => 'fixed inset-0 z-50 overflow-hidden',
            'backdrop' => 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity',
            'header' => 'flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-6 py-4',
            'title' => 'text-lg font-semibold text-slate-900 dark:text-slate-100',
            'close_btn' => 'rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500',
            'body' => 'flex-1 overflow-y-auto px-6 py-4 text-slate-600 dark:text-slate-300',
            'footer' => 'border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3',
            'directions' => [
                'left' => [
                    'position' => 'top-0 left-0 bottom-0 w-80 border-r',
                    'enter_start' => '-translate-x-full',
                    'enter_end' => 'translate-x-0',
                    'leave_start' => 'translate-x-0',
                    'leave_end' => '-translate-x-full',
                ],
                'right' => [
                    'position' => 'top-0 right-0 bottom-0 w-80 border-l',
                    'enter_start' => 'translate-x-full',
                    'enter_end' => 'translate-x-0',
                    'leave_start' => 'translate-x-0',
                    'leave_end' => 'translate-x-full',
                ],
                'start' => [
                    'position' => 'top-0 start-0 bottom-0 w-80 ltr:border-r rtl:border-l',
                    'enter_start' => 'ltr:-translate-x-full rtl:translate-x-full',
                    'enter_end' => 'translate-x-0',
                    'leave_start' => 'translate-x-0',
                    'leave_end' => 'ltr:-translate-x-full rtl:translate-x-full',
                ],
                'end' => [
                    'position' => 'top-0 end-0 bottom-0 w-80 ltr:border-l rtl:border-r',
                    'enter_start' => 'ltr:translate-x-full rtl:-translate-x-full',
                    'enter_end' => 'translate-x-0',
                    'leave_start' => 'translate-x-0',
                    'leave_end' => 'ltr:translate-x-full rtl:-translate-x-full',
                ],
                'top' => [
                    'position' => 'top-0 left-0 right-0 h-80 border-b',
                    'enter_start' => '-translate-y-full',
                    'enter_end' => 'translate-y-0',
                    'leave_start' => 'translate-y-0',
                    'leave_end' => '-translate-y-full',
                ],
                'bottom' => [
                    'position' => 'bottom-0 left-0 right-0 h-80 border-t',
                    'enter_start' => 'translate-y-full',
                    'enter_end' => 'translate-y-0',
                    'leave_start' => 'translate-y-0',
                    'leave_end' => 'translate-y-full',
                ],
            ],
        ],
        'progress' => [
            'wrapper' => 'w-full space-y-2',
            'percent_wrapper' => 'flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-gray-300',
            'bar_track' => 'w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner border border-gray-300/30 dark:border-gray-750/30',
            'bar_base' => 'rounded-full transition-all duration-300 ease-out shadow-sm',
            'colors' => [
                'primary' => 'bg-indigo-600 dark:bg-indigo-500',
                'accent' => 'bg-cyan-500 dark:bg-cyan-400',
                'success' => 'bg-emerald-500 dark:bg-emerald-400',
                'warning' => 'bg-amber-500 dark:bg-amber-400',
                'danger' => 'bg-rose-500 dark:bg-rose-400',
                'gradient' => 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
            ],
        ],
        'skeleton' => [
            'wrapper' => 'space-y-3',
            'circle' => 'rounded-full bg-gray-200 dark:bg-slate-700 h-12 w-12',
            'title' => 'h-6 bg-gray-200 dark:bg-slate-700 rounded-md w-2/3',
            'card' => 'rounded-lg bg-gray-200 dark:bg-slate-700 h-32 w-full',
            'line' => 'h-4 bg-gray-200 dark:bg-slate-700 rounded-md',
        ],
        'spinner' => [
            'base' => 'animate-spin',
            'sizes' => [
                'xs' => 'h-3.5 w-3.5',
                'sm' => 'h-4 w-4',
                'md' => 'h-6 w-6',
                'lg' => 'h-8 w-8',
                'xl' => 'h-12 w-12',
            ],
            'colors' => [
                'primary' => 'text-indigo-600 dark:text-indigo-400',
                'accent' => 'text-cyan-500 dark:text-cyan-400',
                'white' => 'text-white',
                'gray' => 'text-gray-400 dark:text-gray-500',
            ],
        ],
        'toast' => [
            'wrapper' => 'fixed z-[99998] flex flex-col gap-3 min-w-80 max-w-md',
            'positions' => [
                'top-right' => 'top-5 end-5',
                'top-left' => 'top-5 start-5',
                'bottom-right' => 'bottom-5 end-5',
                'bottom-left' => 'bottom-5 start-5',
                'top-center' => 'top-5 start-1/2 -translate-x-1/2',
                'bottom-center' => 'bottom-5 start-1/2 -translate-x-1/2',
            ],
            'item_base' => 'flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl backdrop-blur-lg border transition-all duration-300',
            'types' => [
                'success' => 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
                'error' => 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200',
                'danger' => 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200',
                'warning' => 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
                'info' => 'bg-sky-50/95 dark:bg-sky-950/90 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200',
                'status' => 'bg-sky-50/95 dark:bg-sky-950/90 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200',
            ],
            'dismiss_btn' => 'shrink-0 rounded-lg p-1 opacity-60 hover:opacity-100 transition-opacity focus:outline-none',
        ],
        'upload' => [
            'wrapper' => 'w-full',
            'drop_zone' => 'relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ease-in-out group outline-none focus-within:ring-2 focus-within:ring-indigo-500',
            'drop_zone_active' => 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/20 shadow-md scale-[1.01]',
            'drop_zone_inactive' => 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50/50 dark:bg-gray-900/50',
            'icon_wrapper' => 'mb-4 rounded-full bg-indigo-100/80 dark:bg-indigo-950/50 p-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300',
            'title' => 'text-sm font-semibold text-gray-700 dark:text-gray-200',
            'help' => 'mt-1 text-xs text-gray-500 dark:text-gray-400',
            'preview_list' => 'mt-4 space-y-2',
            'preview_item' => 'flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm transition-all duration-200 hover:shadow',
            'thumbnail_img' => 'h-10 w-10 object-cover rounded-md border border-gray-100 dark:border-gray-850 flex-shrink-0',
            'thumbnail_icon_wrapper' => 'h-10 w-10 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-900 border border-gray-100 dark:border-gray-850 flex-shrink-0 text-gray-400 dark:text-gray-500',
            'file_info' => 'min-w-0 flex-1 px-2',
            'file_name' => 'text-sm font-medium text-gray-700 dark:text-gray-300 truncate',
            'file_size' => 'text-xs text-gray-500 dark:text-gray-400',
            'remove_btn' => 'p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors',
            'error' => 'mt-2 text-sm text-red-600 dark:text-red-400 font-semibold',
        ],
    ],

];
