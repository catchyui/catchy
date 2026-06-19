@props([
    'action' => '',
    'method' => 'POST',
    'beforesend' => null,
    'success' => null,
    'error' => null,
    'onbeforesend' => null,
    'onsuccess' => null,
    'onerror' => null,
])

@php
    $method = strtoupper($method);
    $formMethod = $method === 'GET' ? 'GET' : 'POST';
    $spoofMethod = !in_array($method, ['GET', 'POST']) ? $method : null;

    $beforesendValue = $beforesend ?? $onbeforesend;
    $successValue = $success ?? $onsuccess;
    $errorValue = $error ?? $onerror;

    // Build form attributes dynamically to avoid syntax issues in IDE formatters
    $formAttributes = [
        'x-data' => true,
    ];

    if ($beforesendValue) {
        $formAttributes['@catchy:start'] = $beforesendValue;
        $formAttributes['@catchy-start'] = $beforesendValue;
        $formAttributes['data-catchy-beforesend'] = $beforesendValue;
    }

    if ($successValue) {
        $formAttributes['@catchy:end'] = $successValue;
        $formAttributes['@catchy-end'] = $successValue;
        $formAttributes['data-catchy-success'] = $successValue;
    }

    if ($errorValue) {
        $formAttributes['@catchy:error'] = $errorValue;
        $formAttributes['@catchy-error'] = $errorValue;
        $formAttributes['data-catchy-error'] = $errorValue;
    }
@endphp

<form 
    action="{{ $action }}" 
    method="{{ $formMethod }}"
    {{ $attributes->merge($formAttributes) }}
>
    @if($formMethod === 'POST')
        @csrf
    @endif

    @if($spoofMethod)
        @method($spoofMethod)
    @endif

    {{ $slot }}
</form>
