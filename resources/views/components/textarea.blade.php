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
    $wrapperClass = config('catchy.styles.textarea.wrapper', 'space-y-1');
    $labelClass = config('catchy.styles.textarea.label', 'block text-sm font-medium text-slate-700 dark:text-slate-300');
    $requiredClass = config('catchy.styles.textarea.required', 'text-rose-500');
    $inputWrapperClass = config('catchy.styles.textarea.input_wrapper', 'relative rounded-lg shadow-sm');
    $textareaClass = config('catchy.styles.textarea.textarea', 'block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors disabled:opacity-50 resize-y');
    $helperClass = config('catchy.styles.textarea.helper', 'text-xs text-slate-500 dark:text-slate-400');
    $errorClass = config('catchy.styles.textarea.error', 'text-rose-500 text-xs mt-1');
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
