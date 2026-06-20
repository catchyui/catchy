@props([
    'id' => 'catchy-offcanvas',
    'title' => '',
    'direction' => 'right', // left, right, start, end, top, bottom
    'closeOnOutsideClick' => true,
])

@php
    $baseClass = catchy_style('offcanvas.base', 'fixed inset-0 z-50 overflow-hidden');
    $backdropClass = catchy_style('offcanvas.backdrop', 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity');
    $headerClass = catchy_style('offcanvas.header', 'flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-6 py-4');
    $titleClass = catchy_style('offcanvas.title', 'text-lg font-semibold text-slate-900 dark:text-slate-100');
    $closeBtnClass = catchy_style('offcanvas.close_btn', 'rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500');
    $bodyClass = catchy_style('offcanvas.body', 'flex-1 overflow-y-auto px-6 py-4 text-slate-600 dark:text-slate-300');
    $footerClass = catchy_style('offcanvas.footer', 'border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3');

    $directions = [
        'left' => [
            'position' => 'top-0 left-0 bottom-0 w-80 border-r',
            'enter_start' => '-translate-x-full',
            'enter_end' => 'translate-x-0',
            'leave_start' => 'translate-x-0',
            'leave_end' => '-translate-x-full',
        ],
        'right' => [
            'position' => 'top-0 right-0 bottom-0 w-80 border-l',
            'enter_start' => 'translate-x-full',
            'enter_end' => 'translate-x-0',
            'leave_start' => 'translate-x-0',
            'leave_end' => 'translate-x-full',
        ],
        'start' => [
            'position' => 'top-0 start-0 bottom-0 w-80 ltr:border-r rtl:border-l',
            'enter_start' => 'ltr:-translate-x-full rtl:translate-x-full',
            'enter_end' => 'translate-x-0',
            'leave_start' => 'translate-x-0',
            'leave_end' => 'ltr:-translate-x-full rtl:translate-x-full',
        ],
        'end' => [
            'position' => 'top-0 end-0 bottom-0 w-80 ltr:border-l rtl:border-r',
            'enter_start' => 'ltr:translate-x-full rtl:-translate-x-full',
            'enter_end' => 'translate-x-0',
            'leave_start' => 'translate-x-0',
            'leave_end' => 'ltr:translate-x-full rtl:-translate-x-full',
        ],
        'top' => [
            'position' => 'top-0 left-0 right-0 h-80 border-b',
            'enter_start' => '-translate-y-full',
            'enter_end' => 'translate-y-0',
            'leave_start' => 'translate-y-0',
            'leave_end' => '-translate-y-full',
        ],
        'bottom' => [
            'position' => 'bottom-0 left-0 right-0 h-80 border-t',
            'enter_start' => 'translate-y-full',
            'enter_end' => 'translate-y-0',
            'leave_start' => 'translate-y-0',
            'leave_end' => 'translate-y-full',
        ],
    ];

    $cfg = catchy_style("offcanvas.directions.{$direction}", $directions[$direction] ?? $directions['right']);
@endphp

<div
    {{ $attributes->merge([
        'id' => $id,
        'class' => $baseClass,
        'style' => 'display: none;',
        'role' => 'dialog',
        'aria-modal' => 'true',
        'aria-labelledby' => $id . '-title',
    ]) }}
    catchy-offcanvas
    x-data="catchyOffcanvas({ title: @js($title) })"
    x-show="isOpen"
    @catchy:offcanvas-load="open($event.detail.html, $event.detail.title)"
    @catchy:offcanvas-close="close()"
    @catchy:offcanvas-open="open($event.detail.html || '', $event.detail.title || '')"
    @catchy-offcanvas-load="open($event.detail.html, $event.detail.title)"
    @catchy-offcanvas-close="close()"
    @catchy-offcanvas-open="open($event.detail.html || '', $event.detail.title || '')"
    @keydown.escape.window="close()"
>
    <!-- Backdrop -->
    <div
        x-show="isOpen"
        x-transition:enter="ease-out duration-300"
        x-transition:enter-start="opacity-0"
        x-transition:enter-end="opacity-100"
        x-transition:leave="ease-in duration-200"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0"
        class="{{ $backdropClass }}"
        @if($closeOnOutsideClick) @click="close()" @endif
        aria-hidden="true"
    ></div>

    <!-- Drawer Panel -->
    <div
        x-show="isOpen"
        x-transition:enter="transform transition ease-in-out duration-300"
        x-transition:enter-start="{{ $cfg['enter_start'] }}"
        x-transition:enter-end="{{ $cfg['enter_end'] }}"
        x-transition:leave="transform transition ease-in-out duration-300"
        x-transition:leave-start="{{ $cfg['leave_start'] }}"
        x-transition:leave-end="{{ $cfg['leave_end'] }}"
        class="fixed {{ $cfg['position'] }} bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 shadow-2xl flex flex-col max-w-full"
        role="document"
    >
        <!-- Header -->
        <div class="{{ $headerClass }}">
            <h3 id="{{ $id }}-title" class="{{ $titleClass }}" x-text="title"></h3>
            <button
                type="button"
                @click="close()"
                class="{{ $closeBtnClass }}"
            >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <!-- Body -->
        <div class="{{ $bodyClass }}">
            <template x-if="content">
                <div x-html="content"></div>
            </template>
            <div x-show="!content">
                {{ $slot }}
            </div>
        </div>

        <!-- Footer (optional slot) -->
        @if(isset($footer))
            <div class="{{ $footerClass }}">
                {{ $footer }}
            </div>
        @endif
    </div>
</div>
