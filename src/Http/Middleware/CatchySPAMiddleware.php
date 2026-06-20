<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Http\Middleware;

use Closure;
use Hamzi\Catchy\Domain\ValueObjects\CatchyPipelineData;
use Illuminate\Contracts\Container\Container;
use Illuminate\Http\Request;
use Illuminate\Pipeline\Pipeline;
use Symfony\Component\HttpFoundation\Response;

/**
 * Class CatchySPAMiddleware
 *
 * Coordinates SPA request filtering by sending incoming request-response flows
 * through a configurable pipeline of clean architecture stages.
 */
class CatchySPAMiddleware
{
    /**
     * The IoC container instance.
     */
    protected Container $container;

    /**
     * CatchySPAMiddleware constructor.
     */
    public function __construct(Container $container)
    {
        $this->container = $container;
    }

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Detect if this is an SPA request from Catchy
        if (! $request->headers->has('X-Catchy-SPA')) {
            return $next($request);
        }

        // 2. Skip middleware if the route is explicitly excluded
        if ($this->shouldExclude($request)) {
            return $next($request);
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
