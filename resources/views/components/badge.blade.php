@props([
    'variant' => 'primary', // primary, secondary, success, danger, warning, info
    'size' => 'md', // sm, md
    'rounded' => false, // false = standard rounded-md, true = rounded-full (pill)
])

@php
    $baseClass = config('catchy.styles.badge.base', 'inline-flex items-center font-medium border transition-colors');

    $variants = array_merge([
        'primary' => 'bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30',
        'secondary' => 'bg-slate-50 text-slate-700 border-slate-200/50 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/30',
        'success' => 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
        'danger' => 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
        'warning' => 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
        'info' => 'bg-sky-50 text-sky-700 border-sky-200/50 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30',
    ], config('catchy.styles.badge.variants', []));

    $sizes = array_merge([
        'sm' => 'px-1.5 py-0.5 text-xs',
        'md' => 'px-2.5 py-0.5 text-sm',
    ], config('catchy.styles.badge.sizes', []));

    $variantClass = $variants[$variant] ?? $variants['primary'];
    $sizeClass = $sizes[$size] ?? $sizes['md'];
    $roundedClass = $rounded ? 'rounded-full' : 'rounded-md';
@endphp

<span {{ $attributes->merge(['class' => "{$baseClass} {$variantClass} {$sizeClass} {$roundedClass}"]) }}>
    {{ $slot }}
</span>
