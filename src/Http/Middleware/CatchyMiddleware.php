<?php

declare(strict_types=1);

namespace Catchyui\Catchy\Http\Middleware;

use Catchyui\Catchy\CatchyServiceProvider;
use Catchyui\Catchy\Domain\ValueObjects\CatchyPipelineData;
use Closure;
use Illuminate\Contracts\Container\Container;
use Illuminate\Http\Request;
use Illuminate\Pipeline\Pipeline;
use Symfony\Component\HttpFoundation\Response;

/**
 * Class CatchyMiddleware
 *
 * Coordinates SPA request filtering by sending incoming request-response flows
 * through a configurable pipeline of clean architecture stages when X-Catchy-Request is present.
 */
class CatchyMiddleware
{
    /**
     * CatchyMiddleware constructor.
     */
    public function __construct(
        protected readonly Container $container
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Dynamically override config based on session settings (for simulator/playground)
        if ($request->hasSession()) {
            if ($sessionVersion = $request->session()->get('catchy_simulated_version')) {
                config(['catchy.version' => $sessionVersion]);
            }
            if ($sessionTransition = $request->session()->get('catchy_simulated_transition')) {
                config(['catchy.view_transitions' => $sessionTransition]);
            }
        }

        // 1. Skip middleware if the route is explicitly excluded
        if ($this->shouldExclude($request)) {
            return $next($request);
        }

        // 2. Detect if this is NOT a Catchy request
        if (! $request->headers->has('X-Catchy-Request')) {
            $response = $next($request);

            if (config('catchy.auto_inject', true) && $this->isHtmlResponse($response)) {
                $response = $this->injectScripts($response);
            }

            return $response;
        }

        // 3. Process request to get the initial response
        $response = $next($request);

        // 4. Wrap request and response in value object
        $pipelineData = new CatchyPipelineData($request, $response);

        // 5. Resolve the configured pipeline stages
        $stages = config('catchy.pipeline', []);

        /** @var CatchyPipelineData $processed */
        $processed = (new Pipeline($this->container))
            ->send($pipelineData)
            ->through($stages)
            ->then(fn (CatchyPipelineData $data) => $data);

        return $processed->getResponse();
    }

    /**
     * Determine if the response is a standard HTML page response.
     */
    protected function isHtmlResponse(Response $response): bool
    {
        $contentType = $response->headers->get('Content-Type');

        return $contentType !== null && str_contains($contentType, 'text/html');
    }

    /**
     * Inject Catchy SPA scripts before the closing </body> tag of the response.
     */
    protected function injectScripts(Response $response): Response
    {
        $content = $response->getContent();

        if ($content === false) {
            return $response;
        }

        $pos = strripos($content, '</body>');
        if ($pos !== false) {
            $scriptsHtml = view('catchy::scripts', ['jsPath' => CatchyServiceProvider::getJsPath()])->render();
            $content = substr($content, 0, $pos).$scriptsHtml.substr($content, $pos);
            $response->setContent($content);
        }

        return $response;
    }

    /**
     * Determine if the request matches any of the configured exclusion patterns.
     */
    protected function shouldExclude(Request $request): bool
    {
        $excepts = config('catchy.except', []);

        foreach ($excepts as $except) {
            if ($except !== '/') {
                $except = trim($except, '/');
            }

            if ($request->fullUrlIs($except) || $request->is($except)) {
                return true;
            }
        }

        return false;
    }
}
