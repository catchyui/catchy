@props([
    'id' => 'catchy-modal',
    'title' => '',
    'size' => 'md',
    'closeOnOutsideClick' => true,
])

@php
    $sizes = [
        'sm' => 'sm:max-w-sm',
        'md' => 'sm:max-w-md',
        'lg' => 'sm:max-w-lg',
        'xl' => 'sm:max-w-xl',
        '2xl' => 'sm:max-w-2xl',
        '3xl' => 'sm:max-w-3xl',
        '4xl' => 'sm:max-w-4xl',
        '5xl' => 'sm:max-w-5xl',
        'full' => 'sm:max-w-full m-4',
    ];
    $sizeClass = $sizes[$size] ?? $sizes['md'];
@endphp

<div
    {{ $attributes->merge([
        'id' => $id,
        'class' => 'fixed inset-0 z-50 overflow-y-auto',
        'style' => 'display: none;',
        'role' => 'dialog',
        'aria-modal' => 'true',
        'aria-labelledby' => $id . '-title',
    ]) }}
    catchy-modal
    x-data="catchyModal({ title: @js($title) })"
    x-show="isOpen"
    @catchy:modal-load="open($event.detail.html, $event.detail.title)"
    @catchy:modal-close="close()"
    @catchy:modal-open="open($event.detail.html || '', $event.detail.title || '')"
    @catchy-modal-load="open($event.detail.html, $event.detail.title)"
    @catchy-modal-close="close()"
    @catchy-modal-open="open($event.detail.html || '', $event.detail.title || '')"
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
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        @if($closeOnOutsideClick) @click="close()" @endif
        aria-hidden="true"
    ></div>

    <!-- Modal Wrapper -->
    <div class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
            x-show="isOpen"
            x-transition:enter="ease-out duration-300"
            x-transition:enter-start="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            x-transition:enter-end="opacity-100 translate-y-0 sm:scale-100"
            x-transition:leave="ease-in duration-200"
            x-transition:leave-start="opacity-100 translate-y-0 sm:scale-100"
            x-transition:leave-end="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            class="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-start shadow-2xl transition-all w-full {{ $sizeClass }} flex flex-col max-h-[90vh]"
            role="document"
        >
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-6 py-4">
                <h3 id="{{ $id }}-title" class="text-lg font-semibold text-slate-900 dark:text-slate-100" x-text="title"></h3>
                <button
                    type="button"
                    @click="close()"
                    class="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="{{ __('catchy::messages.close') }}"
                >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 py-4 text-slate-600 dark:text-slate-300">
                <template x-if="content">
                    <div x-html="content"></div>
                </template>
                <div x-show="!content">
                    {{ $slot }}
                </div>
            </div>

            <!-- Footer (optional slot) -->
            @if(isset($footer))
                <div class="border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                    {{ $footer }}
                </div>
            @endif
        </div>
    </div>
</div>
