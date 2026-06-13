@props([
    'align' => 'start', // left, right, start, end
    'width' => 'w-48',
])

@php
    $alignmentClasses = match ($align) {
        'left' => 'origin-top-left left-0',
        'right' => 'origin-top-right right-0',
        'end' => 'origin-top-end end-0',
        default => 'origin-top-start start-0',
    };
@endphp

<div 
    x-data="{ open: false }" 
    @click.outside="open = false" 
    @close.stop="open = false" 
    class="relative inline-block text-start"
>
    <div @click="open = !open" class="cursor-pointer">
        {{ $trigger }}
    </div>

    <div 
        x-show="open"
        x-transition:enter="transition ease-out duration-200"
        x-transition:enter-start="transform opacity-0 scale-95"
        x-transition:enter-end="transform opacity-100 scale-100"
        x-transition:leave="transition ease-in duration-75"
        x-transition:leave-start="transform opacity-100 scale-100"
        x-transition:leave-end="transform opacity-0 scale-95"
        class="absolute z-50 mt-2 {{ $width }} rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 py-1 focus:outline-none {{ $alignmentClasses }}"
        style="display: none;"
    >
        <div class="rounded-xl py-1 bg-white dark:bg-slate-900">
            {{ $content }}
        </div>
    </div>
</div>
