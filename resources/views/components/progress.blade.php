@props([
    'color' => 'primary', // primary, accent, success, warning, danger, gradient
    'height' => 'h-2.5', // Tailwind height class
    'showPercent' => true,
    'label' => null,
    'for' => null,
])

<div 
    x-data="catchyProgress({ for: @js($for) })"
    x-show="show"
    x-transition:enter="transition ease-out duration-300"
    x-transition:enter-start="opacity-0 scale-95"
    x-transition:enter-end="opacity-100 scale-100"
    x-transition:leave="transition ease-in duration-200"
    x-transition:leave-start="opacity-100 scale-100"
    x-transition:leave-end="opacity-0 scale-95"
    {{ $attributes->merge([
        'class' => catchy_style('progress.wrapper', 'w-full space-y-2'),
        'style' => 'display: none;',
        'role' => 'progressbar',
        'aria-valuemin' => '0',
        'aria-valuemax' => '100',
        'aria-label' => $label ?? __('catchy::messages.loading'),
    ]) }}
    :aria-valuenow="progress"
>
    @if ($showPercent)
        <div class="{{ catchy_style('progress.percent_wrapper', 'flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-gray-300') }}">
            <span x-text="progress === 100 ? '{{ __('catchy::messages.completed') }}' : '{{ $label ?? __('catchy::messages.loading') }}'">{{ $label ?? __('catchy::messages.loading') }}</span>
            <span x-text="progress + '%'">0%</span>
        </div>
    @endif
    <div class="{{ catchy_style('progress.bar_track', 'w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner border border-gray-300/30 dark:border-gray-750/30') }}">
        <div 
            class="{{ $height }} {{ catchy_style("progress.colors.{$color}", catchy_style('progress.colors.primary', 'bg-indigo-600 dark:bg-indigo-500')) }} {{ catchy_style('progress.bar_base', 'rounded-full transition-all duration-300 ease-out shadow-sm') }}"
            :style="{ width: progress + '%' }"
        ></div>
    </div>
</div>
