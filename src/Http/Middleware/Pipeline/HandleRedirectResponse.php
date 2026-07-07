<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Http\Middleware\Pipeline;

use Closure;
use Hamzi\Catchy\Domain\Contracts\PipelineStageInterface;
use Hamzi\Catchy\Domain\Contracts\VersionRepositoryInterface;
use Hamzi\Catchy\Domain\ValueObjects\CatchyPipelineData;
use Hamzi\Catchy\Support\FlashExtractor;

/**
 * Class HandleRedirectResponse
 *
 * Pipeline stage intercepting redirect responses and rewriting them to
 * standard 200 OK headers for client-side SPA routing redirection.
 */
class HandleRedirectResponse implements PipelineStageInterface
{
    /**
     * HandleRedirectResponse constructor.
     */
    public function __construct(
        protected readonly VersionRepositoryInterface $versionRepository
    ) {}

    /**
     * Handle the pipeline stage.
     *
     * @param  Closure(CatchyPipelineData): (CatchyPipelineData)  $next
     */
    public function handle(CatchyPipelineData $data, Closure $next): CatchyPipelineData
    {
        $response = $data->getResponse();

        if ($response->isRedirection()) {
            $request = $data->getRequest();
            $serverVersion = $this->versionRepository->getVersion();

            $redirectResponse = clone $response;
            $redirectResponse->setStatusCode(200);
            $redirectResponse->setContent('');

            $redirectResponse->headers->set('X-Catchy-Redirect', $response->headers->get('Location'));
            $redirectResponse->headers->set('X-Catchy-Request', 'true');
            $redirectResponse->headers->remove('Location');

            $flash = FlashExtractor::extract($request, false);
            if (! empty($flash)) {
                $redirectResponse->headers->set('X-Catchy-Flash', base64_encode((string) json_encode($flash)));
            }

            if ($serverVersion !== '') {
                $redirectResponse->headers->set('X-Catchy-Version', $serverVersion);
            }

            return $data->withResponse($redirectResponse);
        }

        return $next($data);
    }
}
