@props([
    'hoverable' => false,
])

<div 
    {{ $attributes->merge([
        'class' => catchy_style('card.base', 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden transition-all duration-300') . ($hoverable ? ' ' . catchy_style('card.hoverable', 'hover:shadow-md hover:scale-[1.005] hover:border-indigo-500/30') : '')
    ]) }}
>
    @if (isset($header))
        <div class="{{ catchy_style('card.header', 'border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50') }}">
            {{ $header }}
        </div>
    @endif

    <div class="{{ catchy_style('card.body', 'px-6 py-5') }}">
        {{ $slot }}
    </div>

    @if (isset($footer))
        <div class="{{ catchy_style('card.footer', 'border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50') }}">
            {{ $footer }}
        </div>
    @endif
</div>
