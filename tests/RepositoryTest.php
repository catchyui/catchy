<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Tests;

use Hamzi\Catchy\Infrastructure\Repositories\AssetVersionRepository;
use Hamzi\Catchy\Infrastructure\Repositories\ConfigComponentRepository;

/**
 * Class RepositoryTest
 *
 * Verifies that the clean repositories fetch version metadata and Blade component layouts correctly.
 *
 * @package Hamzi\Catchy\Tests
 */
class RepositoryTest extends TestCase
{
    /**
     * Test AssetVersionRepository prioritizing static configs.
     */
    public function test_version_repository_resolves_config_version(): void
    {
        config(['catchy.version' => '1.2.3-test']);
        
        $repository = new AssetVersionRepository();
        $this->assertEquals('1.2.3-test', $repository->getVersion());
    }

    /**
     * Test AssetVersionRepository falling back to Vite manifest hashing.
     */
    public function test_version_repository_hashes_vite_manifest(): void
    {
        config(['catchy.version' => '']);

        // Mock Vite build manifest path structure
        $manifestDir = public_path('build');
        if (!is_dir($manifestDir)) {
            mkdir($manifestDir, 0755, true);
        }
        $manifestPath = public_path('build/manifest.json');
        file_put_contents($manifestPath, json_encode(['app.js' => ['file' => 'app-hash123.js']]));

        try {
            $repository = new AssetVersionRepository();
            $expectedHash = md5_file($manifestPath);
            $this->assertEquals($expectedHash, $repository->getVersion());
        } finally {
            unlink($manifestPath);
            rmdir($manifestDir);
        }
    }

    /**
     * Test AssetVersionRepository detecting hot-reloaded dev environments.
     */
    public function test_version_repository_detects_vite_hot_reloading(): void
    {
        config(['catchy.version' => '']);

        $hotPath = public_path('hot');
        file_put_contents($hotPath, 'http://localhost:5173');

        try {
            $repository = new AssetVersionRepository();
            $this->assertEquals('hot', $repository->getVersion());
        } finally {
            unlink($hotPath);
        }
    }

    /**
     * Test ConfigComponentRepository resolving component aliases correctly.
     */
    public function test_component_repository_resolves_configured_aliases(): void
    {
        config([
            'catchy.components' => [
                'my-custom-spinner' => 'app-spinner',
                'my-custom-toast' => 'app-toast',
            ]
        ]);

        $repository = new ConfigComponentRepository();

        $this->assertTrue($repository->has('my-custom-spinner'));
        $this->assertFalse($repository->has('non-existent-component'));

        $this->assertEquals('app-spinner', $repository->get('my-custom-spinner'));
        $this->assertEquals('app-toast', $repository->get('my-custom-toast'));
        $this->assertNull($repository->get('non-existent-component'));

        $components = $repository->getComponents();
        $this->assertArrayHasKey('my-custom-spinner', $components);
        $this->assertEquals('app-toast', $components['my-custom-toast']);
    }
}
