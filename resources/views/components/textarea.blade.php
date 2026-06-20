@props([
    'name',
    'label' => null,
    'placeholder' => null,
    'value' => null,
    'required' => false,
    'rows' => 3,
    'helper' => null,
    'autoGrow' => false,
])

@php
    $wrapperClass = catchy_style('textarea.wrapper', 'space-y-1');
    $labelClass = catchy_style('textarea.label', 'block text-sm font-medium text-slate-700 dark:text-slate-300');
    $requiredClass = catchy_style('textarea.required', 'text-rose-500');
    $inputWrapperClass = catchy_style('textarea.input_wrapper', 'relative rounded-lg shadow-sm');
    $textareaClass = catchy_style('textarea.textarea', 'block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors disabled:opacity-50 resize-y');
    $helperClass = catchy_style('textarea.helper', 'text-xs text-slate-500 dark:text-slate-400');
    $errorClass = catchy_style('textarea.error', 'text-rose-500 text-xs mt-1');
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
        <textarea 
            name="{{ $name }}" 
            id="{{ $name }}"
            placeholder="{{ $placeholder }}"
            rows="{{ $rows }}"
            @if ($required) required @endif
            @if ($helper) aria-describedby="{{ $name }}-helper" @endif
            @if ($autoGrow)
                x-data="{ 
                    resize() { 
                        this.$el.style.height = 'auto'; 
                        this.$el.style.height = this.$el.scrollHeight + 'px'; 
                    } 
                }"
                x-init="resize(); $watch('value', () => $nextTick(() => resize()))"
                x-on:input="resize()"
            @endif
            {{ $attributes->merge([
                'class' => $textareaClass
            ]) }}
        >{{ $value ?? $slot }}</textarea>
    </div>

    @if ($helper)
        <p id="{{ $name }}-helper" class="{{ $helperClass }}">{{ $helper }}</p>
    @endif

    <x-catchy-error :field="$name" class="{{ $errorClass }}" />
</div>
