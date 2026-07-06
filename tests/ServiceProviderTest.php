<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Tests;

use Hamzi\Catchy\CatchyServiceProvider;
use Hamzi\Catchy\Console\InstallCommand;
use Hamzi\Catchy\Domain\Contracts\ResponseExtractorInterface;
use Hamzi\Catchy\Domain\Contracts\VersionRepositoryInterface;
use Hamzi\Catchy\Http\Middleware\CatchyMiddleware;
use Hamzi\Catchy\Infrastructure\Extractors\HtmlResponseExtractor;
use Hamzi\Catchy\Infrastructure\Repositories\AssetVersionRepository;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Blade;

/**
 * Class ServiceProviderTest
 *
 * Verifies that the CatchyServiceProvider boots correctly, registers middleware alias,
 * binds core interfaces, and configures compiler directives.
 */
class ServiceProviderTest extends TestCase
{
    private ?string $tempBackupPath = null;

    protected function setUp(): void
    {
        parent::setUp();

        $publishedPath = public_path('vendor/catchy/catchy.js');
        if (file_exists($publishedPath)) {
            $this->tempBackupPath = tempnam(sys_get_temp_dir(), 'catchy_backup');
            copy($publishedPath, $this->tempBackupPath);
            unlink($publishedPath);
        }
    }

    protected function tearDown(): void
    {
        if ($this->tempBackupPath && file_exists($this->tempBackupPath)) {
            $publishedPath = public_path('vendor/catchy/catchy.js');
            $dir = dirname($publishedPath);
            if (! is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            copy($this->tempBackupPath, $publishedPath);
            unlink($this->tempBackupPath);
        }

        parent::tearDown();
    }

    /**
     * Test that the 'catchy' middleware alias is registered in the router.
     */
    public function test_middleware_alias_is_registered(): void
    {
        $router = $this->app['router'];
        $middleware = $router->getMiddleware();

        $this->assertArrayHasKey('catchy', $middleware);
        $this->assertEquals(CatchyMiddleware::class, $middleware['catchy']);
    }

    /**
     * Test that @catchy and @endcatchy compile to the correct wrapper element.
     */
    public function test_catchy_blade_directive_renders_wrapper(): void
    {
        $html1 = Blade::render('@catchy');
        $this->assertEquals('<div id="catchy-app">', $html1);

        $html2 = Blade::render("@catchy('my-custom-app')");
        $this->assertEquals('<div id="my-custom-app">', $html2);

        $html3 = Blade::render('@endcatchy');
        $this->assertEquals('</div>', $html3);
    }

    /**
     * Test that the 'catchy:install' console command is registered.
     */
    public function test_console_command_is_registered(): void
    {
        $commands = Artisan::all();

        $this->assertArrayHasKey('catchy:install', $commands);
        $this->assertInstanceOf(InstallCommand::class, $commands['catchy:install']);
    }

    /**
     * Test that the @catchyScripts Blade directive renders to the inline script correctly.
     */
    public function test_blade_directive_renders_correctly(): void
    {
        $html = Blade::render('@catchyScripts');

        // Verify that the rendered HTML contains config settings, and inline plugin code
        $this->assertStringContainsString('window.CatchyConfig =', $html);
        $this->assertStringContainsString('Hamzi/Catchy - Alpine.js SPA Plugin', $html);
        $this->assertStringContainsString('CatchyPlugin', $html);
        $this->assertStringContainsString('window.history.pushState', $html);
    }

    /**
     * Test that the autoPublishAssets method copies the file if it doesn't exist.
     */
    public function test_auto_publish_assets_copies_file_in_local_env(): void
    {
        $publishedPath = public_path('vendor/catchy/catchy.js');

        // We make sure the file is removed
        if (file_exists($publishedPath)) {
            unlink($publishedPath);
        }

        $this->assertFalse(file_exists($publishedPath));

        $provider = new CatchyServiceProvider($this->app);

        $reflector = new \ReflectionClass(CatchyServiceProvider::class);
        $method = $reflector->getMethod('autoPublishAssets');
        $method->setAccessible(true);
        $method->invoke($provider);

        // Verify the file was copied
        $this->assertTrue(file_exists($publishedPath));
    }

    /**
     * Verify dependency injection contracts resolution from container.
     */
    public function test_contracts_are_resolvable_from_container(): void
    {
        $extractor = $this->app->make(ResponseExtractorInterface::class);
        $versionRepository = $this->app->make(VersionRepositoryInterface::class);

        $this->assertInstanceOf(HtmlResponseExtractor::class, $extractor);
        $this->assertInstanceOf(AssetVersionRepository::class, $versionRepository);
    }

    /**
     * Test AssetVersionRepository resolves correct versions in all scenarios.
     */
    public function test_asset_version_repository_resolves_correct_versions(): void
    {
        $repo = new AssetVersionRepository;

        // 1. Config version overrides everything
        config(['catchy.version' => 'custom-config-version']);
        $this->assertEquals('custom-config-version', $repo->getVersion());

        // Reset config version to test other lookups
        config(['catchy.version' => null]);

        $reflection = new \ReflectionClass(AssetVersionRepository::class);
        $cachedProperty = $reflection->getProperty('cachedVersion');
        $cachedProperty->setAccessible(true);

        // 2. Standard Vite manifest
        $buildDir = public_path('build');
        if (! is_dir($buildDir)) {
            mkdir($buildDir, 0755, true);
        }
        $manifestPath = $buildDir.'/manifest.json';
        file_put_contents($manifestPath, '{"main.js":"main.hash.js"}');

        $cachedProperty->setValue($repo, null); // Clear cache
        $this->assertEquals(md5_file($manifestPath), $repo->getVersion());
        unlink($manifestPath);
        rmdir($buildDir);

        // 3. Fallback manifest
        $altManifestPath = public_path('manifest.json');
        file_put_contents($altManifestPath, '{"main.js":"main.alt.js"}');

        $cachedProperty->setValue($repo, null); // Clear cache
        $this->assertEquals(md5_file($altManifestPath), $repo->getVersion());
        unlink($altManifestPath);

        // 4. Mix manifest
        $mixManifestPath = public_path('mix-manifest.json');
        file_put_contents($mixManifestPath, '{"main.js":"main.mix.js"}');

        $cachedProperty->setValue($repo, null); // Clear cache
        $this->assertEquals(md5_file($mixManifestPath), $repo->getVersion());
        unlink($mixManifestPath);

        // 5. Hot file
        $hotPath = public_path('hot');
        file_put_contents($hotPath, 'http://localhost:5173');

        $cachedProperty->setValue($repo, null); // Clear cache
        $this->assertEquals('hot', $repo->getVersion());
        unlink($hotPath);

        // 6. Default fallback
        $cachedProperty->setValue($repo, null); // Clear cache
        $this->assertEquals('', $repo->getVersion());
    }
}
