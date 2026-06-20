@props([
    'type' => 'text',
    'lines' => 1,
    'animate' => 'pulse',
])

@php
    $wrapperClass = config('catchy.styles.skeleton.wrapper', 'space-y-3');
    $circleClass = config('catchy.styles.skeleton.circle', 'rounded-full bg-gray-200 dark:bg-slate-700 h-12 w-12');
    $titleClass = config('catchy.styles.skeleton.title', 'h-6 bg-gray-200 dark:bg-slate-700 rounded-md w-2/3');
    $cardClass = config('catchy.styles.skeleton.card', 'rounded-lg bg-gray-200 dark:bg-slate-700 h-32 w-full');
    $lineClass = config('catchy.styles.skeleton.line', 'h-4 bg-gray-200 dark:bg-slate-700 rounded-md');

    $animation = $animate === 'pulse' ? 'animate-pulse' : '';
@endphp

<div {{ $attributes->merge(['class' => "{$animation} {$wrapperClass}"]) }}>
    @if ($type === 'circle')
        <div class="{{ $circleClass }}"></div>
    @elseif ($type === 'title')
        <div class="{{ $titleClass }}"></div>
    @elseif ($type === 'card')
        <div class="{{ $cardClass }}"></div>
    @else
        @for ($i = 0; $i < $lines; $i++)
            <div class="{{ $lineClass }} {{ $i === $lines - 1 && $lines > 1 ? 'w-5/6' : 'w-full' }}"></div>
        @endfor
    @endif
</div>
