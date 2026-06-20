@props([
    'hoverable' => false,
])

@php
    $baseClass = config('catchy.styles.card.base', 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden transition-all duration-300');
    $hoverableClass = config('catchy.styles.card.hoverable', 'hover:shadow-md hover:scale-[1.005] hover:border-indigo-500/30');
    $headerClass = config('catchy.styles.card.header', 'border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50');
    $bodyClass = config('catchy.styles.card.body', 'px-6 py-5');
    $footerClass = config('catchy.styles.card.footer', 'border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50');
@endphp

<div 
    {{ $attributes->merge([
        'class' => $baseClass . ($hoverable ? ' ' . $hoverableClass : '')
    ]) }}
>
    @if (isset($header))
        <div class="{{ $headerClass }}">
            {{ $header }}
        </div>
    @endif

    <div class="{{ $bodyClass }}">
        {{ $slot }}
    </div>

    @if (isset($footer))
        <div class="{{ $footerClass }}">
            {{ $footer }}
        </div>
    @endif
</div>
