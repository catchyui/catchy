@props([
    'variant' => 'primary', // primary, secondary, success, danger, warning, info
    'size' => 'md', // sm, md
    'rounded' => false, // false = standard rounded-md, true = rounded-full (pill)
])

<span {{ $attributes->merge(['class' => catchy_style('badge.base', 'inline-flex items-center font-medium border transition-colors') . ' ' . catchy_style("badge.variants.{$variant}", catchy_style('badge.variants.primary', 'bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30')) . ' ' . catchy_style("badge.sizes.{$size}", catchy_style('badge.sizes.md', 'px-2.5 py-0.5 text-sm')) . ' ' . ($rounded ? 'rounded-full' : 'rounded-md')]) }}>
    {{ $slot }}
</span>
