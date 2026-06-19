<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Domain\ValueObjects;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Class CatchyPipelineData
 *
 * Implements an immutable-like container encapsulating the active request and response state.
 * Allows stages to inspect the request and inspect/update the response.
 *
 * @package Hamzi\Catchy\Domain\ValueObjects
 */
final class CatchyPipelineData
{
    /**
     * The active HTTP request.
     *
     * @var \Illuminate\Http\Request
     */
    private Request $request;

    /**
     * The active HTTP response.
     *
     * @var \Symfony\Component\HttpFoundation\Response
     */
    private Response $response;

    /**
     * CatchyPipelineData constructor.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Symfony\Component\HttpFoundation\Response  $response
     */
    public function __construct(Request $request, Response $response)
    {
        $this->request = $request;
        $this->response = $response;
    }

    /**
     * Get the active HTTP request.
     *
     * @return \Illuminate\Http\Request
     */
    public function getRequest(): Request
    {
        return $this->request;
    }

    /**
     * Get the active HTTP response.
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function getResponse(): Response
    {
        return $this->response;
    }

    /**
     * Return a new pipeline data instance with the updated HTTP response.
     *
     * @param  \Symfony\Component\HttpFoundation\Response  $response
     * @return self
     */
    public function withResponse(Response $response): self
    {
        return new self($this->request, $response);
    }
}
