<?php

declare(strict_types=1);

namespace Catchyui\Catchy;

use Catchyui\Catchy\Console\InstallCommand;
use Catchyui\Catchy\Domain\Contracts\ResponseExtractorInterface;
use Catchyui\Catchy\Domain\Contracts\VersionRepositoryInterface;
use Catchyui\Catchy\Http\Middleware\CatchyMiddleware;
use Catchyui\Catchy\Infrastructure\Extractors\HtmlResponseExtractor;
use Catchyui\Catchy\Infrastructure\Repositories\AssetVersionRepository;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

/**
 * Class CatchyServiceProvider
 *
 * Bootstraps package services, registers configuration mappings, binds clean architecture
 * interfaces to implementations, and defines the compiler directives.
 */
class CatchyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Merge default configuration
        $this->mergeConfigFrom(__DIR__.'/../config/catchy.php', 'catchy');

        // Bind contracts to implementations (Dependency Inversion Principle - DIP)
        $this->app->singleton(ResponseExtractorInterface::class, HtmlResponseExtractor::class);
        $this->app->singleton(VersionRepositoryInterface::class, AssetVersionRepository::class);
    }

    /**
     * Bootstrap any package services.
     */
    public function boot(): void
    {
        $this->registerMiddleware();
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'catchy');
        $this->registerDirectives();
        $this->registerPublishing();
        $this->registerCommands();

        // Auto-publish assets in local environment if missing
        if ($this->app->environment('local') && ! $this->app->runningInConsole()) {
            $this->autoPublishAssets();
        }
    }

    /**
     * Register the SPA middleware alias.
     */
    protected function registerMiddleware(): void
    {
        $this->app['router']->aliasMiddleware('catchy', CatchyMiddleware::class);

        // Automatically append the middleware to the 'web' group for ease of installation
        if (config('catchy.middleware_auto_register', true) && $this->app->bound(Kernel::class)) {
            $kernel = $this->app->make(Kernel::class);
            if (method_exists($kernel, 'appendMiddlewareToGroup')) {
                $kernel->appendMiddlewareToGroup('web', CatchyMiddleware::class);
            }
        }
    }

    /**
     * Register custom Blade compiler directives.
     */
    protected function registerDirectives(): void
    {
        // Register the @catchy wrapper directive
        Blade::directive('catchy', function ($expression) {
            $id = $expression ?: "config('catchy.container_id', 'catchy-app')";

            return "<div id=\"<?php echo e({$id}); ?>\">";
        });

        // Register the @endcatchy wrapper directive
        Blade::directive('endcatchy', function () {
            return '</div>';
        });

        // Register the scripts/config injection directive
        Blade::directive('catchyScripts', function () {
            return "<?php echo view('catchy::scripts', ['jsPath' => \\Catchyui\\Catchy\\CatchyServiceProvider::getJsPath()])->render(); ?>";
        });

        // Register x-catchy-scripts component alias
        Blade::component('catchy::scripts', 'catchy-scripts');

        // Register new DX Blade components
        Blade::component('catchy::components.link', 'catchy-link');
        Blade::component('catchy::components.form', 'catchy-form');
        Blade::component('catchy::components.toasts', 'catchy-toasts');
        Blade::component('catchy::components.modal', 'catchy-modal');

        // Register SVG Blade components
        Blade::component('catchy::svg.close', 'catchy-svg-close');
        Blade::component('catchy::svg.spinner', 'catchy-svg-spinner');
    }

    /**
     * Get the absolute path to the package's compiled catchy.js asset.
     */
    public static function getJsPath(): string
    {
        return __DIR__.'/../resources/js/catchy.js';
    }

    /**
     * Get the absolute path to the package's transition CSS asset.
     */
    public static function getTransitionsCssPath(): string
    {
        return __DIR__.'/../resources/css/transitions.css';
    }

    /**
     * Get the absolute path to the package's modal CSS asset.
     */
    public static function getModalCssPath(): string
    {
        return __DIR__.'/../resources/css/modal.css';
    }

    /**
     * Register console publishing tasks.
     */
    protected function registerPublishing(): void
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../config/catchy.php' => config_path('catchy.php'),
            ], 'catchy-config');

            $this->publishes([
                __DIR__.'/../resources/views' => resource_path('views/vendor/catchy'),
            ], 'catchy-views');

            $this->publishes([
                __DIR__.'/../resources/js/catchy.js' => public_path('vendor/catchy/catchy.js'),
            ], 'catchy-assets');
        }
    }

    /**
     * Register console commands.
     */
    protected function registerCommands(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                InstallCommand::class,
            ]);
        }
    }

    /**
     * Auto-publish compiled assets to public directory in local dev if they do not exist.
     */
    protected function autoPublishAssets(): void
    {
        $targetPath = public_path('vendor/catchy/catchy.js');
        $sourcePath = __DIR__.'/../resources/js/catchy.js';

        if (file_exists($sourcePath)) {
            $shouldCopy = ! file_exists($targetPath) || filemtime($sourcePath) > filemtime($targetPath);

            if ($shouldCopy) {
                $dir = dirname($targetPath);
                if (! is_dir($dir)) {
                    mkdir($dir, 0755, true);
                }
                copy($sourcePath, $targetPath);
            }
        }
    }
}
