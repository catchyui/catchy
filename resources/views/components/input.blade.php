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
    $wrapperClass = config('catchy.styles.input.wrapper', 'space-y-1');
    $labelClass = config('catchy.styles.input.label', 'block text-sm font-medium text-slate-700 dark:text-slate-300');
    $requiredClass = config('catchy.styles.input.required', 'text-rose-500');
    $inputWrapperClass = config('catchy.styles.input.input_wrapper', 'relative rounded-lg shadow-sm');
    $inputClass = config('catchy.styles.input.input', 'block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors disabled:opacity-50');
    $helperClass = config('catchy.styles.input.helper', 'text-xs text-slate-500 dark:text-slate-400');
    $errorClass = config('catchy.styles.input.error', 'text-rose-500 text-xs mt-1');
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
