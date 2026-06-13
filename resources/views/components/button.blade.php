@props([
    'type' => 'button', // button, submit
    'variant' => 'primary', // primary, secondary, success, danger, outline, ghost
    'size' => 'md', // sm, md, lg
    'loading' => true, // Auto-spinner when parent form submits
])

@php
    $baseClass = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';
    
    $variants = [
        'primary' => 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 border border-transparent shadow-sm',
        'secondary' => 'bg-slate-600 hover:bg-slate-700 text-white focus:ring-slate-500 border border-transparent shadow-sm',
        'success' => 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 border border-transparent shadow-sm',
        'danger' => 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 border border-transparent shadow-sm',
        'outline' => 'border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 focus:ring-indigo-500 shadow-sm',
        'ghost' => 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 focus:ring-slate-500',
    ];

    $sizes = [
        'sm' => 'px-3 py-1.5 text-xs',
        'md' => 'px-4 py-2 text-sm',
        'lg' => 'px-5 py-2.5 text-base',
    ];

    $variantClass = $variants[$variant] ?? $variants['primary'];
    $sizeClass = $sizes[$size] ?? $sizes['md'];
@endphp

<button 
    type="{{ $type }}"
    @if(!$loading) data-catchy-no-loader @endif
    {{ $attributes->merge(['class' => "{$baseClass} {$variantClass} {$sizeClass}"]) }}
>
    {{ $slot }}
</button>
