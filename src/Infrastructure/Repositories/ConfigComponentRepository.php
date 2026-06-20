<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Infrastructure\Repositories;

use Hamzi\Catchy\Domain\Contracts\ComponentRepositoryInterface;

/**
 * Class ConfigComponentRepository
 *
 * Resolves registered dynamic Blade UI components mapping directly from
 * application configurations, providing highly customizable UI layers.
 */
class ConfigComponentRepository implements ComponentRepositoryInterface
{
    /**
     * The cached components mapping.
     *
     * @var array<string, string>
     */
    private array $components;

    /**
     * ConfigComponentRepository constructor.
     */
    public function __construct()
    {
        $this->components = config('catchy.components', []);
    }

    /**
     * Retrieve all registered components as a key-value mapping.
     * The key is the template name, and the value is the component alias tag.
     *
     * @return array<string, string>
     */
    public function getComponents(): array
    {
        return $this->components;
    }

    /**
     * Check if a component is registered.
     */
    public function has(string $name): bool
    {
        return isset($this->components[$name]);
    }

    /**
     * Get the alias for a specific component.
     */
    public function get(string $name): ?string
    {
        return $this->components[$name] ?? null;
    }
}
