<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Infrastructure\Repositories;

use Hamzi\Catchy\Domain\Contracts\VersionRepositoryInterface;

/**
 * Class AssetVersionRepository
 *
 * Automates resolution of current build versions by checking static config values,
 * hashing production build manifests, or detecting active hot-reloading servers.
 *
 * @package Hamzi\Catchy\Infrastructure\Repositories
 */
class AssetVersionRepository implements VersionRepositoryInterface
{
    /**
     * Get the current version of the application assets.
     *
     * @return string
     */
    public function getVersion(): string
    {
        // 1. Prioritize static configuration version if defined
        $version = config('catchy.version');
        if ($version !== null && $version !== '') {
            return (string) $version;
        }

        // 2. Check for standard production Vite manifest file to auto-hash build differences
        $manifestPath = public_path('build/manifest.json');
        if (file_exists($manifestPath)) {
            return md5_file($manifestPath) ?: '';
        }

        // 3. Detect if Vite is running in development hot mode
        $hotPath = public_path('hot');
        if (file_exists($hotPath)) {
            return 'hot';
        }

        return '';
    }
}
