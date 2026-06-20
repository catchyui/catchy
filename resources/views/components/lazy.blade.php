@props([
    'src',
    'trigger' => 'load', // load, intersect
    'placeholder' => null,
])

<div 
    x-data="catchyLazy({ src: '{{ $src }}', trigger: '{{ $trigger }}' })"
    @catchy:lazy-reload.window="if (!$event.detail || !$event.detail.id || $event.detail.id === $el.id) reload()"
    @catchy-lazy-reload.window="if (!$event.detail || !$event.detail.id || $event.detail.id === $el.id) reload()"
    {{ $attributes }}
>
    <template x-if="!loaded && !error">
        <div>
            @if ($placeholder)
                {!! $placeholder !!}
            @else
                <div class="space-y-3">
                    <x-catchy-skeleton type="title" />
                    <x-catchy-skeleton type="text" lines="3" />
                </div>
            @endif
        </div>
    </template>
    <template x-if="error">
        <div class="{{ catchy_style('lazy.error', 'text-sm text-rose-600 dark:text-rose-400 p-4 border border-rose-200 dark:border-rose-900/40 rounded-lg bg-rose-50 dark:bg-rose-950/20') }}">
            {{ __('catchy::messages.loading_lazy') }} - Connection Error
        </div>
    </template>
</div>
