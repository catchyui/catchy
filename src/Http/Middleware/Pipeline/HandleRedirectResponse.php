<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Http\Middleware\Pipeline;

use Closure;
use Hamzi\Catchy\Domain\Contracts\VersionRepositoryInterface;
use Hamzi\Catchy\Domain\ValueObjects\CatchyPipelineData;

/**
 * Class HandleRedirectResponse
 *
 * Pipeline stage intercepting redirect responses and rewriting them to
 * standard 200 OK headers for client-side SPA routing redirection.
 *
 * @package Hamzi\Catchy\Http\Middleware\Pipeline
 */
class HandleRedirectResponse
{
    /**
     * The asset version repository instance.
     *
     * @var \Hamzi\Catchy\Domain\Contracts\VersionRepositoryInterface
     */
    protected VersionRepositoryInterface $versionRepository;

    /**
     * HandleRedirectResponse constructor.
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

        if ($response->isRedirection()) {
            $request = $data->getRequest();
            $serverVersion = $this->versionRepository->getVersion();

            $headers = [
                'X-Catchy-Redirect' => $response->headers->get('Location'),
                'X-Catchy-SPA' => 'true',
            ];

            $flash = $this->extractFlashData($request);
            if (!empty($flash)) {
                $headers['X-Catchy-Flash'] = base64_encode((string) json_encode($flash));
            }

            if ($serverVersion !== '') {
                $headers['X-Catchy-Version'] = $serverVersion;
            }

            $redirectResponse = response('', 200, $headers);

            return $data->withResponse($redirectResponse);
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
