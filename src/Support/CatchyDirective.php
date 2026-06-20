<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Support;

/**
 * Class CatchyDirective
 *
 * Compiles and renders the dynamic @catchy Blade directive attributes for forms.
 * Caches in-memory assets for faster compiles.
 */
class CatchyDirective
{
    /**
     * Render the directive attributes dynamically.
     */
    public static function render(array $options = []): string
    {
        $attributes = ['x-data'];

        if (isset($options['beforesend'])) {
            $attributes[] = '@catchy:start="'.e($options['beforesend']).'"';
            $attributes[] = '@catchy-start="'.e($options['beforesend']).'"';
            $attributes[] = 'data-catchy-beforesend="'.e($options['beforesend']).'"';
        }

        if (isset($options['success'])) {
            $attributes[] = '@catchy:end="'.e($options['success']).'"';
            $attributes[] = '@catchy-end="'.e($options['success']).'"';
            $attributes[] = 'data-catchy-success="'.e($options['success']).'"';
        }

        if (isset($options['error'])) {
            $attributes[] = '@catchy:error="'.e($options['error']).'"';
            $attributes[] = '@catchy-error="'.e($options['error']).'"';
            $attributes[] = 'data-catchy-error="'.e($options['error']).'"';
        }

        return implode(' ', $attributes);
    }

    /**
     * Cache storage for JavaScript file contents, keyed by file path.
     *
     * @var array<string, string>
     */
    private static array $jsCache = [];

    /**
     * Retrieve the cached JavaScript contents or read from disk if not cached.
     */
    public static function getJavaScript(string $path): string
    {
        if (! isset(self::$jsCache[$path])) {
            self::$jsCache[$path] = file_exists($path) ? (string) file_get_contents($path) : '';
        }

        return self::$jsCache[$path];
    }
}
