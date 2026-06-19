<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Domain\Contracts;

/**
 * Interface ComponentRepositoryInterface
 *
 * Defines the contract for fetching and listing registered Blade components.
 * Enables customizable component lists stored outside hard-coded mappings.
 *
 * @package Hamzi\Catchy\Domain\Contracts
 */
interface ComponentRepositoryInterface
{
    /**
     * Retrieve all registered components as a key-value mapping.
     * The key is the template name, and the value is the component alias tag.
     *
     * @return array<string, string>
     */
    public function getComponents(): array;

    /**
     * Check if a component is registered.
     *
     * @param  string  $name
     * @return bool
     */
    public function has(string $name): bool;

    /**
     * Get the alias for a specific component.
     *
     * @param  string  $name
     * @return string|null
     */
    public function get(string $name): ?string;
}
