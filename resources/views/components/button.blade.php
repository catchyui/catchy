@props([
    'type' => 'button', // button, submit
    'variant' => 'primary', // primary, secondary, success, danger, outline, ghost
    'size' => 'md', // sm, md, lg
    'loading' => true, // Auto-spinner when parent form submits
])

@php
    $baseClass = catchy_style('button.base', 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]');
    $variantClass = catchy_style("button.variants.{$variant}", catchy_style('button.variants.primary', 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 border border-transparent shadow-sm'));
    $sizeClass = catchy_style("button.sizes.{$size}", catchy_style('button.sizes.md', 'px-4 py-2 text-sm'));
@endphp

<button 
    type="{{ $type }}"
    @if(!$loading) data-catchy-no-loader @endif
    {{ $attributes->merge(['class' => "{$baseClass} {$variantClass} {$sizeClass}"]) }}
>
    {{ $slot }}
</button>
