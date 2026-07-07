<?php

declare(strict_types=1);

namespace Catchyui\Catchy\Domain\ValueObjects;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Class CatchyPipelineData
 *
 * Encapsulates the active request and response state with copy-on-write semantics for the response.
 * Note: The Request object is shared by reference and should not be mutated by pipeline stages.
 */
final class CatchyPipelineData
{
    /**
     * CatchyPipelineData constructor.
     */
    public function __construct(
        private readonly Request $request,
        private readonly Response $response
    ) {}

    /**
     * Get the active HTTP request.
     */
    public function getRequest(): Request
    {
        return $this->request;
    }

    /**
     * Get the active HTTP response.
     */
    public function getResponse(): Response
    {
        return $this->response;
    }

    /**
     * Return a new pipeline data instance with the updated HTTP response.
     */
    public function withResponse(Response $response): self
    {
        return new self($this->request, $response);
    }
}
