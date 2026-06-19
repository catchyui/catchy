<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Domain\Contracts;

/**
 * Interface VersionRepositoryInterface
 *
 * Defines the contract for resolving the current assets version.
 * Utilized to verify consistency between client asset builds and server versions.
 *
 * @package Hamzi\Catchy\Domain\Contracts
 */
interface VersionRepositoryInterface
{
    /**
     * Get the current version of the application assets.
     *
     * @return string
     */
    public function getVersion(): string;
}
