@props([
    'name' => 'file',
    'multiple' => false,
    'accept' => '*/*',
    'label' => null,
    'helpText' => null,
])

@php
    $label = $label ?? __('catchy::messages.drag_drop_label');
    $helpText = $helpText ?? __('catchy::messages.help_text');

    $wrapperClass = config('catchy.styles.upload.wrapper', 'w-full');
    $dropZoneClass = config('catchy.styles.upload.drop_zone', 'relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ease-in-out group outline-none focus-within:ring-2 focus-within:ring-indigo-500');
    $dropZoneActiveClass = config('catchy.styles.upload.drop_zone_active', 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/20 shadow-md scale-[1.01]');
    $dropZoneInactiveClass = config('catchy.styles.upload.drop_zone_inactive', 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50/50 dark:bg-gray-900/50');
    $iconWrapperClass = config('catchy.styles.upload.icon_wrapper', 'mb-4 rounded-full bg-indigo-100/80 dark:bg-indigo-950/50 p-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300');
    $titleClass = config('catchy.styles.upload.title', 'text-sm font-semibold text-gray-700 dark:text-gray-200');
    $helpClass = config('catchy.styles.upload.help', 'mt-1 text-xs text-gray-500 dark:text-gray-400');
    $previewListClass = config('catchy.styles.upload.preview_list', 'mt-4 space-y-2');
    $previewItemClass = config('catchy.styles.upload.preview_item', 'flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm transition-all duration-200 hover:shadow');
    $thumbnailImgClass = config('catchy.styles.upload.thumbnail_img', 'h-10 w-10 object-cover rounded-md border border-gray-100 dark:border-gray-850 flex-shrink-0');
    $thumbnailIconWrapperClass = config('catchy.styles.upload.thumbnail_icon_wrapper', 'h-10 w-10 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-900 border border-gray-100 dark:border-gray-850 flex-shrink-0 text-gray-400 dark:text-gray-500');
    $fileInfoClass = config('catchy.styles.upload.file_info', 'min-w-0 flex-1 px-2');
    $fileNameClass = config('catchy.styles.upload.file_name', 'text-sm font-medium text-gray-700 dark:text-gray-300 truncate');
    $fileSizeClass = config('catchy.styles.upload.file_size', 'text-xs text-gray-500 dark:text-gray-400');
    $removeBtnClass = config('catchy.styles.upload.remove_btn', 'p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors');
    $errorClass = config('catchy.styles.upload.error', 'mt-2 text-sm text-red-600 dark:text-red-400 font-semibold');
@endphp

<div 
    {{ $attributes->merge([
        'class' => $wrapperClass
    ]) }}
    x-data="catchyUpload({ name: @js($name), multiple: @js($multiple) })"
    x-on:catchy-validation-errors.window="handleValidationErrors($event)"
    x-on:catchy:validation-errors.window="handleValidationErrors($event)"
>
    <!-- Hidden input -->
    <input 
        type="file" 
        name="{{ $name }}" 
        id="catchy-upload-{{ $name }}"
        x-ref="fileInput" 
        class="hidden" 
        accept="{{ $accept }}"
        @if($multiple) multiple @endif
        x-on:change="if (!updating) addFiles($event.target.files)"
    />

    <!-- Drag & Drop Container -->
    <div 
        x-on:dragover.prevent="dragover = true"
        x-on:dragleave.prevent="dragover = false"
        x-on:drop.prevent="dragover = false; addFiles($event.dataTransfer.files)"
        x-on:click="$refs.fileInput.click()"
        :class="{
            '{{ $dropZoneActiveClass }}': dragover,
            '{{ $dropZoneInactiveClass }}': !dragover
        }"
        class="{{ $dropZoneClass }}"
        tabindex="0"
        role="button"
        aria-label="{{ $label }}"
        x-on:keydown.enter="$refs.fileInput.click()"
        x-on:keydown.space="$refs.fileInput.click()"
    >
        <div class="{{ $iconWrapperClass }}">
            <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
        </div>

        <p class="{{ $titleClass }}">
            {{ $label }}
        </p>
        <p class="{{ $helpClass }}">
            {{ $helpText }}
        </p>
    </div>

    <!-- Preview Container -->
    <template x-if="files.length > 0">
        <div class="{{ $previewListClass }}">
            <template x-for="(file, index) in files" :key="index">
                <div class="{{ $previewItemClass }}">
                    <div class="flex items-center gap-3 min-w-0">
                        <!-- Thumbnail Preview -->
                        <template x-if="isImage(file)">
                            <img :src="getPreviewUrl(file)" class="{{ $thumbnailImgClass }}" />
                        </template>
                        <template x-if="!isImage(file)">
                            <div class="{{ $thumbnailIconWrapperClass }}">
                                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </template>

                        <!-- File Info -->
                        <div class="{{ $fileInfoClass }}">
                            <p class="{{ $fileNameClass }}" x-text="file.name"></p>
                            <p class="{{ $fileSizeClass }}" x-text="getFileSize(file.size)"></p>
                        </div>
                    </div>

                    <!-- Remove Button -->
                    <button 
                        type="button" 
                        x-on:click.stop="removeFile(index)" 
                        class="{{ $removeBtnClass }}"
                        title="{{ __('catchy::messages.delete_file') }}"
                    >
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </template>
        </div>
    </template>

    <p x-show="error" x-text="error" class="{{ $errorClass }}" style="display: none;"></p>
</div>
