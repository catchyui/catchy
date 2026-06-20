<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Domain\Contracts;

/**
 * Interface VersionRepositoryInterface
 *
 * Defines the contract for resolving the current assets version.
 * Utilized to verify consistency between client asset builds and server versions.
 */
interface VersionRepositoryInterface
{
    /**
     * Get the current version of the application assets.
     */
    public function getVersion(): string;
}
