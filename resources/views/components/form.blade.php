@props([
    'action' => '',
    'method' => 'POST',
    'onSuccess' => null,
    'onError' => null,
    'confirmModal' => null,
    'noLoader' => null,
])

@php
    $methodUpper = strtoupper($method);
    $isGet = $methodUpper === 'GET';
    $realMethod = $isGet ? 'GET' : 'POST';
    
    $customAttributes = [];
    if ($onSuccess) {
        $customAttributes['data-catchy-success'] = $onSuccess;
    }
    if ($onError) {
        $customAttributes['data-catchy-error'] = $onError;
    }
    if ($confirmModal) {
        $customAttributes['data-catchy-confirm-modal'] = ltrim($confirmModal, '#');
    }
    if ($noLoader !== null) {
        if ($noLoader === true || $noLoader === 'true') {
            $customAttributes['data-catchy-no-loader'] = 'true';
        }
    }
@endphp

<form action="{{ $action }}" method="{{ $realMethod }}" {{ $attributes->merge($customAttributes) }}>
    @if(!$isGet)
        @csrf
    @endif
    
    @if(!$isGet && $methodUpper !== 'POST')
        @method($methodUpper)
    @endif
    
    {{ $slot }}
</form>
