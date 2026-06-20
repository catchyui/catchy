@props([
    'name',
    'label' => null,
    'type' => 'text',
    'placeholder' => null,
    'value' => null,
    'required' => false,
    'helper' => null,
])

@php
    $wrapperClass = catchy_style('input.wrapper', 'space-y-1');
    $labelClass = catchy_style('input.label', 'block text-sm font-medium text-slate-700 dark:text-slate-300');
    $requiredClass = catchy_style('input.required', 'text-rose-500');
    $inputWrapperClass = catchy_style('input.input_wrapper', 'relative rounded-lg shadow-sm');
    $inputClass = catchy_style('input.input', 'block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors disabled:opacity-50');
    $helperClass = catchy_style('input.helper', 'text-xs text-slate-500 dark:text-slate-400');
    $errorClass = catchy_style('input.error', 'text-rose-500 text-xs mt-1');
@endphp

<div class="{{ $wrapperClass }}">
    @if ($label)
        <label for="{{ $name }}" class="{{ $labelClass }}">
            {{ $label }}
            @if ($required)
                <span class="{{ $requiredClass }}">*</span>
            @endif
        </label>
    @endif

    <div class="{{ $inputWrapperClass }}">
        <input 
            type="{{ $type }}" 
            name="{{ $name }}" 
            id="{{ $name }}"
            placeholder="{{ $placeholder }}"
            value="{{ $value }}"
            @if ($required) required @endif
            @if ($helper) aria-describedby="{{ $name }}-helper" @endif
            {{ $attributes->merge([
                'class' => $inputClass
            ]) }}
        >
    </div>

    @if ($helper)
        <p id="{{ $name }}-helper" class="{{ $helperClass }}">{{ $helper }}</p>
    @endif

    <x-catchy-error :field="$name" class="{{ $errorClass }}" />
</div>
