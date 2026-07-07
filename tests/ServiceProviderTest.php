<?php

declare(strict_types=1);

namespace Catchyui\Catchy\Tests;

use Catchyui\Catchy\CatchyServiceProvider;
use Catchyui\Catchy\Console\InstallCommand;
use Catchyui\Catchy\Domain\Contracts\ResponseExtractorInterface;
use Catchyui\Catchy\Domain\Contracts\VersionRepositoryInterface;
use Catchyui\Catchy\Http\Middleware\CatchyMiddleware;
use Catchyui\Catchy\Infrastructure\Extractors\HtmlResponseExtractor;
use Catchyui\Catchy\Infrastructure\Repositories\AssetVersionRepository;
use Illuminate\Foundation\Http\Kernel;
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
        $html1 = Blade::compileString('@catchy');
        $this->assertEquals('<div id="<?php echo e(config(\'catchy.container_id\', \'catchy-app\')); ?>">', $html1);

        $html2 = Blade::compileString("@catchy('my-custom-app')");
        $this->assertEquals('<div id="<?php echo e(\'my-custom-app\'); ?>">', $html2);

        $html3 = Blade::compileString('@endcatchy');
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
        $this->assertStringContainsString('CatchyUI/Catchy - Alpine.js SPA Plugin', $html);
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

    /**
     * Test that the @catchy directive uses the configured container ID by default.
     */
    public function test_catchy_directive_resolves_config_container_id(): void
    {
        config(['catchy.container_id' => 'custom-app-id']);

        $html = Blade::render('@catchy');
        $this->assertEquals('<div id="custom-app-id">', $html);
    }

    /**
     * Test that <x-catchy-scripts /> component is registered and works.
     */
    public function test_catchy_scripts_blade_component_resolves(): void
    {
        $html = Blade::render('<x-catchy-scripts />');

        $this->assertStringContainsString('window.CatchyConfig =', $html);
        $this->assertStringContainsString('CatchyPlugin', $html);
    }

    /**
     * Test that catchy middleware is not registered on web group when auto_register is false.
     */
    public function test_middleware_not_auto_registered_when_disabled(): void
    {
        // Mock app and kernel to test registerMiddleware logic with config value false
        $this->app['config']->set('catchy.middleware_auto_register', false);

        // Let's create service provider instance and invoke boot
        $provider = new CatchyServiceProvider($this->app);

        // We will mock Kernel
        $kernel = $this->getMockBuilder(Kernel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['appendMiddlewareToGroup'])
            ->getMock();
        $kernel->expects($this->never())->method('appendMiddlewareToGroup');

        $this->app->instance(\Illuminate\Contracts\Http\Kernel::class, $kernel);

        $reflector = new \ReflectionClass(CatchyServiceProvider::class);
        $method = $reflector->getMethod('registerMiddleware');
        $method->setAccessible(true);
        $method->invoke($provider);
    }

    /**
     * Test that the Blade components compile successfully.
     */
    public function test_blade_components_render_correctly(): void
    {
        // 1. Test catchy-link component
        $htmlLink = Blade::render('<x-catchy-link href="/test-path" active="active-cls" inactive="inactive-cls" transition="slide" prefetch="hover" confirm="Are you sure?">Click</x-catchy-link>');
        $this->assertStringContainsString('href="/test-path"', $htmlLink);
        $this->assertStringContainsString('inactive-cls', $htmlLink);
        $this->assertStringContainsString('data-catchy-transition="slide"', $htmlLink);
        $this->assertStringContainsString('data-catchy-prefetch="hover"', $htmlLink);
        $this->assertStringContainsString('data-catchy-confirm="Are you sure?"', $htmlLink);

        // 2. Test catchy-form component
        $htmlForm = Blade::render('<x-catchy-form action="/submit" method="PUT" confirm-modal="#my-modal">Form Body</x-catchy-form>');
        $this->assertStringContainsString('action="/submit"', $htmlForm);
        $this->assertStringContainsString('method="POST"', $htmlForm);
        $this->assertStringContainsString('name="_method"', $htmlForm);
        $this->assertStringContainsString('value="PUT"', $htmlForm);
        $this->assertStringContainsString('data-catchy-confirm-modal="my-modal"', $htmlForm);
        $this->assertStringContainsString('name="_token"', $htmlForm);

        // 3. Test catchy-toasts component
        $htmlToasts = Blade::render('<x-catchy-toasts />');
        $this->assertStringContainsString('x-on:catchy-flash.window', $htmlToasts);

        // 4. Test catchy-modal component
        $htmlModal = Blade::render('<x-catchy-modal id="my-modal" title="Test Modal">Content</x-catchy-modal>');
        $this->assertStringContainsString('id="my-modal"', $htmlModal);
        $this->assertStringContainsString('Test Modal', $htmlModal);
    }

    /**
     * Test that when the scripts view is published, it can still locate and load the CSS files.
     */
    public function test_published_view_can_load_css(): void
    {
        $publishedDir = resource_path('views/vendor/catchy');
        if (! is_dir($publishedDir)) {
            mkdir($publishedDir, 0755, true);
        }

        $sourceFile = __DIR__.'/../resources/views/scripts.blade.php';
        $targetFile = $publishedDir.'/scripts.blade.php';

        copy($sourceFile, $targetFile);

        try {
            // Render the view to check if it contains the CSS content
            $html = Blade::render('@catchyScripts');

            // It should contain the content from transitions.css (e.g. 'catchy-content')
            $this->assertStringContainsString('view-transition-name: catchy-content;', $html);
            $this->assertStringContainsString('html[data-catchy-transition="fade"]', $html);
        } finally {
            if (file_exists($targetFile)) {
                unlink($targetFile);
            }
            // Remove the parent directories if empty
            if (is_dir($publishedDir)) {
                rmdir($publishedDir);
            }
            $vendorDir = dirname($publishedDir);
            if (is_dir($vendorDir) && count(scandir($vendorDir)) === 2) {
                rmdir($vendorDir);
            }
        }
    }
}
