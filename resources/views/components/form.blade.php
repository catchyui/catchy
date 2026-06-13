@props([
    'action' => '',
    'method' => 'POST',
    'beforesend' => null,
    'success' => null,
    'error' => null,
])

@php
    $method = strtoupper($method);
    $formMethod = $method === 'GET' ? 'GET' : 'POST';
    $spoofMethod = !in_array($method, ['GET', 'POST']) ? $method : null;

    // Build form attributes dynamically to avoid syntax issues in IDE formatters
    $formAttributes = [
        'x-data' => true,
    ];

    if ($beforesend) {
        $formAttributes['@catchy:start'] = $beforesend;
        $formAttributes['@catchy-start'] = $beforesend;
        $formAttributes['data-catchy-beforesend'] = $beforesend;
    }

    if ($success) {
        $formAttributes['@catchy:end'] = $success;
        $formAttributes['@catchy-end'] = $success;
        $formAttributes['data-catchy-success'] = $success;
    }

    if ($error) {
        $formAttributes['@catchy:error'] = $error;
        $formAttributes['@catchy-error'] = $error;
        $formAttributes['data-catchy-error'] = $error;
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
