<?php

declare(strict_types=1);

namespace Catchyui\Catchy\Tests;

use Illuminate\Support\Facades\File;

/**
 * Class InstallCommandTest
 *
 * Verifies the catchy:install command runs successfully, publishes required assets,
 * and generates the starter layout template based on developer choice.
 */
class InstallCommandTest extends TestCase
{
    /**
     * Clean up generated files after each test run.
     */
    protected function tearDown(): void
    {
        $layoutPath = resource_path('views/layouts/catchy.blade.php');
        if (File::exists($layoutPath)) {
            File::delete($layoutPath);
        }

        $appLayoutPath = resource_path('views/layouts/app.blade.php');
        if (File::exists($appLayoutPath)) {
            File::delete($appLayoutPath);
        }

        parent::tearDown();
    }

    /**
     * Test the installation command generates the layout file correctly.
     */
    public function test_install_command_generates_layout(): void
    {
        $layoutPath = resource_path('views/layouts/catchy.blade.php');

        // Ensure layout does not exist initially
        if (File::exists($layoutPath)) {
            File::delete($layoutPath);
        }

        $this->assertFalse(File::exists($layoutPath));

        // Call the installer command and mock interactions
        $this->artisan('catchy:install')
            ->expectsConfirmation('Do you want to publish the Blade views to customize script templates?', 'no')
            ->expectsConfirmation('Do you want to generate a pre-configured SPA layouts template?', 'yes')
            ->assertExitCode(0);

        $this->assertTrue(File::exists($layoutPath));
        $this->assertStringContainsString('id="catchy-app"', File::get($layoutPath));
        $this->assertStringContainsString('@catchyScripts', File::get($layoutPath));
        $this->assertStringContainsString('@vite', File::get($layoutPath));
        $this->assertStringNotContainsString('tailwindcss.com', File::get($layoutPath));
    }

    /**
     * Test the installation command automatically injects the directive into an existing layout.
     */
    public function test_install_command_auto_injects_scripts_into_existing_layout(): void
    {
        $appLayoutPath = resource_path('views/layouts/app.blade.php');
        $layoutDir = dirname($appLayoutPath);

        if (! File::isDirectory($layoutDir)) {
            File::makeDirectory($layoutDir, 0755, true);
        }

        $originalHtml = '<html><head><title>My App</title></head><body><h1>Content</h1></body></html>';
        File::put($appLayoutPath, $originalHtml);

        $this->artisan('catchy:install')
            ->expectsConfirmation('Do you want to publish the Blade views to customize script templates?', 'no')
            ->expectsConfirmation('We found an existing layout file [layouts/app.blade.php]. Do you want to automatically inject the @catchyScripts directive before the </body> tag?', 'yes')
            ->expectsConfirmation('Do you want to generate a pre-configured SPA layouts template?', 'no')
            ->assertExitCode(0);

        $this->assertTrue(File::exists($appLayoutPath));
        $injectedHtml = File::get($appLayoutPath);
        $this->assertStringContainsString('@catchyScripts', $injectedHtml);
        $this->assertStringContainsString(" @catchyScripts\n</body>", $injectedHtml);

        File::delete($appLayoutPath);
    }
}
