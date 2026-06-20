@props([
    'name',
    'label' => null,
    'options' => [],
    'selected' => null,
    'multiple' => false,
    'required' => false,
    'helper' => null,
    'placeholder' => null,
])

@php
    $wrapperClass = config('catchy.styles.select.wrapper', 'space-y-1');
    $labelClass = config('catchy.styles.select.label', 'block text-sm font-medium text-slate-700 dark:text-slate-300');
    $requiredClass = config('catchy.styles.select.required', 'text-rose-500');
    $inputWrapperClass = config('catchy.styles.select.input_wrapper', 'relative rounded-lg shadow-sm');
    $selectClass = config('catchy.styles.select.select', 'block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors disabled:opacity-50');
    $arrowWrapperClass = config('catchy.styles.select.arrow_wrapper', 'pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-slate-400');
    $helperClass = config('catchy.styles.select.helper', 'text-xs text-slate-500 dark:text-slate-400');
    $errorClass = config('catchy.styles.select.error', 'text-rose-500 text-xs mt-1');
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
        <select 
            name="{{ $name }}{{ $multiple ? '[]' : '' }}" 
            id="{{ $name }}"
            @if ($required) required @endif
            @if ($multiple) multiple @endif
            @if ($helper) aria-describedby="{{ $name }}-helper" @endif
            {{ $attributes->merge([
                'class' => $selectClass . ($multiple ? '' : ' appearance-none')
            ]) }}
        >
            @if ($placeholder && !$multiple)
                <option value="" @if(is_null($selected) || $selected === '') selected @endif disabled>
                    {{ $placeholder }}
                </option>
            @endif

            @if (!empty($options))
                @foreach ($options as $val => $lbl)
                    @php
                        $isSelected = $multiple 
                            ? (is_array($selected) && in_array($val, $selected)) 
                            : ($selected == $val);
                    @endphp
                    <option value="{{ $val }}" @if($isSelected) selected @endif>
                        {{ $lbl }}
                    </option>
                @endforeach
            @else
                {{ $slot }}
            @endif
        </select>

        @if (!$multiple)
            <div class="{{ $arrowWrapperClass }}">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        @endif
    </div>

    @if ($helper)
        <p id="{{ $name }}-helper" class="{{ $helperClass }}">{{ $helper }}</p>
    @endif

    <x-catchy-error :field="$name" class="{{ $errorClass }}" />
</div>
