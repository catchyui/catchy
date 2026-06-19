<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Infrastructure\Repositories;

use Hamzi\Catchy\Domain\Contracts\ComponentRepositoryInterface;

/**
 * Class ConfigComponentRepository
 *
 * Resolves registered dynamic Blade UI components mapping directly from
 * application configurations, providing highly customizable UI layers.
 *
 * @package Hamzi\Catchy\Infrastructure\Repositories
 */
class ConfigComponentRepository implements ComponentRepositoryInterface
{
    /**
     * Retrieve all registered components as a key-value mapping.
     * The key is the template name, and the value is the component alias tag.
     *
     * @return array<string, string>
     */
    public function getComponents(): array
    {
        return config('catchy.components', []);
    }

    /**
     * Check if a component is registered.
     *
     * @param  string  $name
     * @return bool
     */
    public function has(string $name): bool
    {
        $components = $this->getComponents();

        return isset($components[$name]);
    }

    /**
     * Get the alias for a specific component.
     *
     * @param  string  $name
     * @return string|null
     */
    public function get(string $name): ?string
    {
        $components = $this->getComponents();

        return $components[$name] ?? null;
    }
}
