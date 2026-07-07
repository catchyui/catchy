@props([
    'href',
    'active' => '',
    'inactive' => '',
    'transition' => null,
    'prefetch' => null,
    'confirm' => null,
])

@php
    $hrefString = (string) $href;
    
    // Normalize href for request path matching
    $normalizedPath = parse_url($hrefString, PHP_URL_PATH) ?? '/';
    $normalizedPath = trim($normalizedPath, '/');
    
    // Match request path
    $isActive = false;
    if ($normalizedPath === '') {
        $isActive = request()->is('/');
    } else {
        $isActive = request()->is($normalizedPath) || request()->is($normalizedPath . '/*');
    }
    
    $classes = $isActive ? $active : $inactive;
    
    // Merge attributes
    $customAttributes = [];
    if ($transition) {
        $customAttributes['data-catchy-transition'] = $transition;
    }
    if ($prefetch !== null) {
        if ($prefetch === 'false' || $prefetch === false) {
            $customAttributes['data-catchy-prefetch'] = 'false';
        } else {
            $customAttributes['data-catchy-prefetch'] = $prefetch === true ? 'true' : $prefetch;
        }
    }
    if ($confirm) {
        if (str_starts_with($confirm, '#') || str_contains($confirm, 'modal')) {
            $customAttributes['data-catchy-confirm-modal'] = ltrim($confirm, '#');
        } else {
            $customAttributes['data-catchy-confirm'] = $confirm;
        }
    }
@endphp

<a href="{{ $href }}" {{ $attributes->merge($customAttributes)->class([$classes]) }}>
    {{ $slot }}
</a>
