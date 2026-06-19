<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Support;

use Illuminate\Http\Request;

/**
 * Class FlashExtractor
 *
 * Extracts flash messages and validation errors from the session.
 *
 * @package Hamzi\Catchy\Support
 */
final class FlashExtractor
{
    /**
     * Extract flash messages and validation errors from the session.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  bool  $clear
     * @return array<string, mixed>
     */
    public static function extract(Request $request, bool $clear = false): array
    {
        if (!$request->hasSession()) {
            return [];
        }

        $flash = [];
        $session = $request->session();

        foreach (['success', 'error', 'warning', 'info', 'status'] as $key) {
            if ($session->has($key)) {
                $flash[$key] = $clear ? $session->pull($key) : $session->get($key);
            }
        }

        if ($session->has('errors')) {
            $errorBag = $session->get('errors');
            if (method_exists($errorBag, 'getBag')) {
                $flash['validation_errors'] = $errorBag->getBag('default')->toArray();
            } elseif (method_exists($errorBag, 'toArray')) {
                $flash['validation_errors'] = $errorBag->toArray();
            }
        }

        return $flash;
    }
}
