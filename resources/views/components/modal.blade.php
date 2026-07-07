@props([
    'id',
    'title' => '',
])

<div id="{{ $id }}" catchy-modal class="catchy-modal-backdrop" x-data="{ open: false }" x-on:catchy-modal-open.window="if ($event.target && $event.target.id === '{{ $id }}') open = true" x-on:catchy-modal-close.window="if ($event.target && $event.target.id === '{{ $id }}') open = false" x-on:keydown.escape.window="open = false" x-show="open" x-cloak>
    <div class="catchy-modal-container" @click.outside="open = false">
        <div class="catchy-modal-header">
            <h3 class="catchy-modal-title">{{ $title }}</h3>
            <button @click="open = false" class="catchy-modal-close" aria-label="Close modal">
                <x-catchy-svg-close class="w-4 h-4" />
            </button>
        </div>
        <div class="catchy-modal-body">
            {{ $slot }}
        </div>
    </div>
</div>
