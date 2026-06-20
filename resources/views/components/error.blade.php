@props([
    'field',
])

@php
    $baseClass = catchy_style('error.base', 'text-sm text-red-600 dark:text-red-400 mt-1 font-medium');
@endphp

<div 
    x-data="catchyError({ field: @js($field) })"
    x-on:catchy-validation-errors.window="handleErrors($event.detail)"
    x-on:catchy:validation-errors.window="handleErrors($event.detail)"
    x-show="error"
    {{ $attributes->merge([
        'class' => $baseClass,
        'role' => 'alert',
        'aria-live' => 'assertive',
    ]) }}
    style="display: none;"
    x-text="error"
></div>
