@props([
    'type' => 'info', // success, danger, warning, info
    'dismissible' => true,
])

@php
    $types = [
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
    ];

    $cfg = $types[$type] ?? $types['info'];
@endphp

<div 
    x-data="{ show: true }"
    x-show="show"
    x-transition:leave="transition ease-in duration-200"
    x-transition:leave-start="opacity-100 scale-100"
    x-transition:leave-end="opacity-0 scale-95"
    {{ $attributes->merge([
        'class' => "flex p-4 rounded-xl border {$cfg['bg']} {$cfg['border']} {$cfg['text']}"
    ]) }}
>
    <!-- Icon -->
    <div class="flex-shrink-0">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{{ $cfg['icon'] }}" />
        </svg>
    </div>

    <!-- Content -->
    <div class="ms-3 flex-1 text-sm font-medium">
        {{ $slot }}
    </div>

    <!-- Dismiss Button -->
    @if ($dismissible)
        <div class="ms-auto pl-3">
            <div class="-mx-1.5 -my-1.5">
                <button 
                    type="button" 
                    @click="show = false"
                    class="inline-flex rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none transition-colors"
                >
                    <span class="sr-only">Dismiss</span>
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    @endif
</div>
