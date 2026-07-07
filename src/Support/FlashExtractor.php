<?php

declare(strict_types=1);

namespace Catchyui\Catchy\Support;

use Illuminate\Http\Request;

/**
 * Class FlashExtractor
 *
 * Extracts flash messages and validation errors from the session.
 */
final class FlashExtractor
{
    /**
     * Extract flash messages and validation errors from the session.
     *
     * @return array<string, mixed>
     */
    public static function extract(Request $request, bool $clear = false): array
    {
        if (! $request->hasSession()) {
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
            if (method_exists($errorBag, 'getBags')) {
                $errors = [];
                foreach ($errorBag->getBags() as $bag) {
                    foreach ($bag->toArray() as $field => $messages) {
                        $errors[$field] = array_merge($errors[$field] ?? [], (array) $messages);
                    }
                }
                $flash['validation_errors'] = $errors;
            } elseif (method_exists($errorBag, 'getBag')) {
                $flash['validation_errors'] = $errorBag->getBag('default')->toArray();
            } elseif (method_exists($errorBag, 'toArray')) {
                $flash['validation_errors'] = $errorBag->toArray();
            }
        }

        return $flash;
    }
}
