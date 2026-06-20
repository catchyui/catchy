@props([
    'position' => 'top-right',
    'duration' => 4000,
])

@php
    // Retrieve initial flash messages from session
    $initialFlash = [];
    foreach (['success', 'error', 'warning', 'info', 'status'] as $key) {
        if (session()->has($key)) {
            $initialFlash[] = ['message' => session($key), 'type' => $key];
        }
    }
@endphp

<div
    {{ $attributes->merge([
        'class' => catchy_style('toast.wrapper', 'fixed z-[99998] flex flex-col gap-3 min-w-80 max-w-md') . ' ' . catchy_style("toast.positions.{$position}", catchy_style('toast.positions.top-right', 'top-5 end-5')),
    ]) }}
    x-data="catchyToast({ duration: {{ $duration }} })"
    role="region"
    aria-label="Notifications"
    @catchy:flash.window="
        if ($event.detail && typeof $event.detail.message === 'string') {
            add($event.detail.message, $event.detail.type || 'info');
        } else if ($event.detail) {
            Object.entries($event.detail).forEach(([key, val]) => {
                if (typeof val === 'string' && key !== 'validation_errors') {
                    add(val, key);
                }
            });
        }
    "
    @catchy-flash.window="
        if ($event.detail && typeof $event.detail.message === 'string') {
            add($event.detail.message, $event.detail.type || 'info');
        } else if ($event.detail) {
            Object.entries($event.detail).forEach(([key, val]) => {
                if (typeof val === 'string' && key !== 'validation_errors') {
                    add(val, key);
                }
            });
        }
    "
    x-init="
        @foreach($initialFlash as $flash)
            add(@js($flash['message']), @js($flash['type']));
        @endforeach
    "
>
    <template x-for="toast in toasts" :key="toast.id">
        <div
            x-show="true"
            x-transition:enter="transition ease-out duration-300"
            x-transition:enter-start="opacity-0 translate-y-2 scale-95"
            x-transition:enter-end="opacity-100 translate-y-0 scale-100"
            x-transition:leave="transition ease-in duration-200"
            x-transition:leave-start="opacity-100 translate-y-0"
            x-transition:leave-end="opacity-0 translate-y-2 scale-95"
            class="{{ catchy_style('toast.item_base', 'flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl backdrop-blur-lg border transition-all duration-300') }}"
            role="alert"
            aria-live="polite"
            :class="{
                '{{ catchy_style('toast.types.success', 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200') }}': toast.type === 'success',
                '{{ catchy_style('toast.types.error', 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200') }}': toast.type === 'error' || toast.type === 'danger',
                '{{ catchy_style('toast.types.warning', 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200') }}': toast.type === 'warning',
                '{{ catchy_style('toast.types.info', 'bg-sky-50/95 dark:bg-sky-950/90 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200') }}': toast.type === 'info' || toast.type === 'status',
            }"
        >
            <!-- Icon -->
            <div class="shrink-0 pt-0.5">
                <template x-if="toast.type === 'success'">
                    <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </template>
                <template x-if="toast.type === 'error' || toast.type === 'danger'">
                    <svg class="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </template>
                <template x-if="toast.type === 'warning'">
                    <svg class="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </template>
                <template x-if="toast.type === 'info' || toast.type === 'status'">
                    <svg class="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                </template>
            </div>

            <!-- Message -->
            <p class="flex-1 text-sm font-medium leading-snug" x-text="toast.message"></p>

            <!-- Dismiss -->
            <button
                type="button"
                class="{{ catchy_style('toast.dismiss_btn', 'shrink-0 rounded-lg p-1 opacity-60 hover:opacity-100 transition-opacity focus:outline-none') }}"
                @click="remove(toast.id)"
                aria-label="Dismiss"
            >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    </template>
</div>
