<?php

declare(strict_types=1);

namespace Catchyui\Catchy\Infrastructure\Repositories;

use Catchyui\Catchy\Domain\Contracts\VersionRepositoryInterface;

/**
 * Class AssetVersionRepository
 *
 * Automates resolution of current build versions by checking static config values,
 * hashing production build manifests, or detecting active hot-reloading servers.
 */
class AssetVersionRepository implements VersionRepositoryInterface
{
    /**
     * Cached version string to avoid repeated filesystem lookups within the same request.
     */
    private ?string $cachedVersion = null;

    /**
     * Get the current version of the application assets.
     */
    public function getVersion(): string
    {
        if ($this->cachedVersion !== null) {
            return $this->cachedVersion;
        }

        // 1. Prioritize static configuration version if defined
        $version = config('catchy.version');
        if ($version !== null && $version !== '') {
            return $this->cachedVersion = (string) $version;
        }

        // 2. Check for standard production Vite manifest file to auto-hash build differences
        $manifestPath = public_path('build/manifest.json');
        if (file_exists($manifestPath)) {
            return $this->cachedVersion = (md5_file($manifestPath) ?: '');
        }

        // Fallback to alternative production manifest paths (e.g. root public or Mix)
        $altManifestPath = public_path('manifest.json');
        if (file_exists($altManifestPath)) {
            return $this->cachedVersion = (md5_file($altManifestPath) ?: '');
        }

        $mixManifestPath = public_path('mix-manifest.json');
        if (file_exists($mixManifestPath)) {
            return $this->cachedVersion = (md5_file($mixManifestPath) ?: '');
        }

        // 3. Detect if Vite is running in development hot mode
        $hotPath = public_path('hot');
        if (file_exists($hotPath)) {
            return $this->cachedVersion = 'hot';
        }

        return $this->cachedVersion = '';
    }
}
