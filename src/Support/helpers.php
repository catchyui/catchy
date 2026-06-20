<?php

declare(strict_types=1);
use Hamzi\Catchy\Support\CatchyStyle;

if (! function_exists('catchy_style')) {
    /**
     * Resolve the styling class(es) for a Catchy component and key path.
     */
    function catchy_style(string $key, mixed $default = null): mixed
    {
        return CatchyStyle::get($key, $default);
    }
}
