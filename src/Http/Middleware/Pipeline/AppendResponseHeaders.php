<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Http\Middleware\Pipeline;

use Closure;
use Hamzi\Catchy\Domain\Contracts\VersionRepositoryInterface;
use Hamzi\Catchy\Domain\ValueObjects\CatchyPipelineData;

/**
 * Class AppendResponseHeaders
 *
 * Pipeline stage adding asset versions and session flash messages (encoded as base64 JSON)
 * directly to the HTTP response headers for processing in the frontend SPA router.
 *
 * @package Hamzi\Catchy\Http\Middleware\Pipeline
 */
class AppendResponseHeaders
{
    /**
     * The asset version repository instance.
     *
     * @var \Hamzi\Catchy\Domain\Contracts\VersionRepositoryInterface
     */
    protected VersionRepositoryInterface $versionRepository;

    /**
     * AppendResponseHeaders constructor.
     *
     * @param  \Hamzi\Catchy\Domain\Contracts\VersionRepositoryInterface  $versionRepository
     */
    public function __construct(VersionRepositoryInterface $versionRepository)
    {
        $this->versionRepository = $versionRepository;
    }

    /**
     * Handle the pipeline stage.
     *
     * @param  \Hamzi\Catchy\Domain\ValueObjects\CatchyPipelineData  $data
     * @param  \Closure(\Hamzi\Catchy\Domain\ValueObjects\CatchyPipelineData): (\Hamzi\Catchy\Domain\ValueObjects\CatchyPipelineData)  $next
     * @return mixed
     */
    public function handle(CatchyPipelineData $data, Closure $next)
    {
        $response = $data->getResponse();
        $request = $data->getRequest();

        $serverVersion = $this->versionRepository->getVersion();

        // 1. Append the current version header to the response
        if ($serverVersion !== '') {
            $response->headers->set('X-Catchy-Version', $serverVersion);
        }

        // 2. Append flash messages from session to header if session exists
        $flash = $this->extractFlashData($request);

        if (!empty($flash)) {
            $response->headers->set('X-Catchy-Flash', base64_encode((string) json_encode($flash)));
        }

        return $next($data);
    }

    /**
     * Extract flash messages and validation errors from the session.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    protected function extractFlashData($request): array
    {
        if (!$request->hasSession()) {
            return [];
        }

        $flash = [];
        $session = $request->session();

        foreach (['success', 'error', 'warning', 'info', 'status'] as $key) {
            if ($session->has($key)) {
                $flash[$key] = $session->pull($key);
            }
        }

        if ($session->has('errors')) {
            $errorBag = $session->get('errors');
            if (method_exists($errorBag, 'getBag')) {
                $flash['validation_errors'] = $errorBag->getBag('default')->toArray();
            } elseif (method_exists($errorBag, 'toArray')) {
                $flash['validation_errors'] = $errorBag->toArray();
            }
        }

        return $flash;
    }
}
