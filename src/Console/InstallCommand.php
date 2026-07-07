<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Class InstallCommand
 *
 * Handles publishing configurations, JS assets, translation bundles,
 * and generates a boilerplate SPA starter layout.
 */
class InstallCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'catchy:install';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Install and configure Hamzi/Catchy Laravel SPA package';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info("\nInstalling Hamzi/Catchy - SPA Package");

        // 1. Publish Configuration
        $this->comment('Publishing Catchy configuration file...');
        $this->call('vendor:publish', [
            '--provider' => 'Hamzi\Catchy\CatchyServiceProvider',
            '--tag' => 'catchy-config',
            '--force' => true,
        ]);

        // 2. Publish Assets
        $this->comment('Publishing compiled JavaScript assets...');
        $this->call('vendor:publish', [
            '--provider' => 'Hamzi\Catchy\CatchyServiceProvider',
            '--tag' => 'catchy-assets',
            '--force' => true,
        ]);

        // 3. Optional Views publishing
        if ($this->confirm('Do you want to publish the Blade views to customize script templates?', false)) {
            $this->comment('Publishing Blade views...');
            $this->call('vendor:publish', [
                '--provider' => 'Hamzi\Catchy\CatchyServiceProvider',
                '--tag' => 'catchy-views',
            ]);
        }

        // 4. Auto-inject scripts into existing app layout if found
        $this->autoInjectIntoExistingLayout();

        // 5. Generate SPA starter layout
        if ($this->confirm('Do you want to generate a pre-configured SPA layouts template?', true)) {
            $this->generateLayout();
        }

        $this->info("\n Hamzi/Catchy has been installed successfully!");
        $this->info('Middleware and script auto-injection are now active. Standard HTML page visits will automatically run as SPA requests.');

        $this->comment("\nStandalone Mode vs Vite/NPM Mode:");
        $this->line(' - [Standalone Mode] (Default): Catchy scripts are auto-injected. No extra setup required!');
        $this->line(' - [Vite/NPM Mode] (Optional): Disable auto-injection (\'auto_inject\' => false in config) and compile in resources/js/app.js:');
        $this->info(' npm install alpinejs @alpinejs/morph');
        $this->line(' And import and register:');
        $this->comment(" import CatchyPlugin from '../../public/vendor/catchy/catchy.js';");
        $this->comment(' Alpine.plugin(morph);');
        $this->comment(" Alpine.plugin(CatchyPlugin);\n");

        return 0;
    }

    /**
     * Generate the starter layout file.
     */
    protected function generateLayout(): void
    {
        $layoutPath = resource_path('views/layouts/catchy.blade.php');

        if (File::exists($layoutPath)) {
            if (! $this->confirm('The layout file [layouts/catchy.blade.php] already exists. Do you want to overwrite it?', false)) {
                $this->warn('Skipped layout generation.');

                return;
            }
        }

        $directory = dirname($layoutPath);
        if (! File::isDirectory($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        $content = <<<'HTML'
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="{{ in_array(app()->getLocale(), ['ar', 'he', 'fa', 'ur']) ? 'rtl' : 'ltr' }}">
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1">
 <meta name="csrf-token" content="{{ csrf_token() }}">

 <title>{{ $title ?? config('app.name', 'Laravel SPA') }}</title>

 <!-- Styles & Scripts compiled via Vite (NPM dependencies) -->
 @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 min-h-screen antialiased">

 <!-- Main SPA Container (Morphed on page transitions) -->
 <div id="catchy-app" class="min-h-screen">
 @yield('content')
 </div>

 <!-- Injects Catchy SPA scripts & Alpine configuration -->
 <!-- Drop-in Toast Notifications (auto-listens to flash events) -->
 <x-catchy-toasts />

 @catchyScripts

</body>
</html>
HTML;

        File::put($layoutPath, $content);
        $this->info('Created starter layout file: [resources/views/layouts/catchy.blade.php]');
    }

    /**
     * Auto-inject the scripts directive into the standard application layout if it exists.
     */
    protected function autoInjectIntoExistingLayout(): void
    {
        $appLayoutPath = resource_path('views/layouts/app.blade.php');

        if (File::exists($appLayoutPath)) {
            $content = File::get($appLayoutPath);

            // If it doesn't already contain the script directive
            if (! str_contains($content, '@catchyScripts') && ! str_contains($content, 'catchy.js')) {
                if ($this->confirm('We found an existing layout file [layouts/app.blade.php]. Do you want to automatically inject the @catchyScripts directive before the </body> tag?', true)) {
                    $pos = strripos($content, '</body>');
                    if ($pos !== false) {
                        $newContent = substr($content, 0, $pos)." @catchyScripts\n".substr($content, $pos);
                        File::put($appLayoutPath, $newContent);
                        $this->info('Successfully injected @catchyScripts into [resources/views/layouts/app.blade.php]!');
                    } else {
                        $this->warn('Could not find </body> tag in [layouts/app.blade.php] to inject scripts.');
                    }
                }
            }
        }
    }
}
