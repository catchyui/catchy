<?php

declare(strict_types=1);

namespace Hamzi\Catchy;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Blade;
use Hamzi\Catchy\Http\Middleware\CatchySPAMiddleware;
use Hamzi\Catchy\Domain\Contracts\ResponseExtractorInterface;
use Hamzi\Catchy\Infrastructure\Extractors\HtmlResponseExtractor;
use Hamzi\Catchy\Domain\Contracts\VersionRepositoryInterface;
use Hamzi\Catchy\Infrastructure\Repositories\AssetVersionRepository;
use Hamzi\Catchy\Domain\Contracts\ComponentRepositoryInterface;
use Hamzi\Catchy\Infrastructure\Repositories\ConfigComponentRepository;
use Hamzi\Catchy\Support\CatchyDirective;

/**
 * Class CatchyServiceProvider
 *
 * Bootstraps package services, registers configuration mappings, binds clean architecture
 * interfaces to implementations, and defines the compiler directives.
 *
 * @package Hamzi\Catchy
 */
class CatchyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register(): void
    {
        // Merge default configuration
        $this->mergeConfigFrom(__DIR__ . '/../config/catchy.php', 'catchy');

        // Bind contracts to implementations (Dependency Inversion Principle - DIP)
        $this->app->bind(ResponseExtractorInterface::class, HtmlResponseExtractor::class);
        $this->app->singleton(VersionRepositoryInterface::class, AssetVersionRepository::class);
        $this->app->singleton(ComponentRepositoryInterface::class, ConfigComponentRepository::class);
    }

    /**
     * Bootstrap any package services.
     *
     * @return void
     */
    public function boot(): void
    {
        $this->registerMiddleware();
        $this->loadTranslationsFrom(__DIR__ . '/../resources/lang', 'catchy');
        $this->registerViewsAndComponents();
        $this->registerDirectives();
        $this->registerPublishing();
        $this->registerCommands();

        // Auto-publish assets in local environment if missing
        if ($this->app->environment('local') && !$this->app->runningInConsole()) {
            $this->autoPublishAssets();
        }
    }

    /**
     * Register the SPA middleware alias.
     *
     * @return void
     */
    protected function registerMiddleware(): void
    {
        $this->app['router']->aliasMiddleware('catchy', CatchySPAMiddleware::class);
    }

    /**
     * Load views and register custom Blade UI components using the dynamic ComponentRepository.
     *
     * @return void
     */
    protected function registerViewsAndComponents(): void
    {
        // Load package views (enables custom component resolution)
        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'catchy');

        // Fetch dynamic component configurations from repository
        $repository = $this->app->make(ComponentRepositoryInterface::class);

        foreach ($repository->getComponents() as $view => $alias) {
            Blade::component("catchy::components.{$view}", $alias);
        }
    }

    /**
     * Register custom Blade compiler directives.
     *
     * @return void
     */
    protected function registerDirectives(): void
    {
        // Register the form custom directive
        Blade::directive('catchyForm', function ($expression) {
            return "<?php echo \\Hamzi\\Catchy\\Support\\CatchyDirective::render(" . ($expression ?: '[]') . "); ?>";
        });

        // Register the scripts/config injection directive
        Blade::directive('catchyScripts', function () {
            $path = __DIR__ . '/../resources/js/catchy.js';
            return "<?php echo view('catchy::scripts', ['jsPath' => '{$path}'])->render(); ?>";
        });
    }

    /**
     * Register console publishing tasks.
     *
     * @return void
     */
    protected function registerPublishing(): void
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../config/catchy.php' => config_path('catchy.php'),
            ], 'catchy-config');

            $this->publishes([
                __DIR__ . '/../resources/views' => resource_path('views/vendor/catchy'),
            ], 'catchy-views');

            $this->publishes([
                __DIR__ . '/../resources/lang' => lang_path('vendor/catchy'),
            ], 'catchy-translations');

            $this->publishes([
                __DIR__ . '/../resources/js/catchy.js' => public_path('vendor/catchy/catchy.js'),
            ], 'catchy-assets');
        }
    }

    /**
     * Register console commands.
     *
     * @return void
     */
    protected function registerCommands(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                \Hamzi\Catchy\Console\InstallCommand::class,
            ]);
        }
    }

    /**
     * Auto-publish compiled assets to public directory in local dev if they do not exist.
     *
     * @return void
     */
    protected function autoPublishAssets(): void
    {
        $targetPath = public_path('vendor/catchy/catchy.js');
        if (!file_exists($targetPath)) {
            $sourcePath = __DIR__ . '/../resources/js/catchy.js';
            if (file_exists($sourcePath)) {
                $dir = dirname($targetPath);
                if (!is_dir($dir)) {
                    mkdir($dir, 0755, true);
                }
                copy($sourcePath, $targetPath);
            }
        }
    }
}
