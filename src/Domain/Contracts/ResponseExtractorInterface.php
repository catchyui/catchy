<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Domain\Contracts;

/**
 * Interface ResponseExtractorInterface
 *
 * Defines the contract for parsing response HTML and extracting required fragments.
 * Used to decouple request-response lifecycles from specific DOM parsers.
 */
interface ResponseExtractorInterface
{
    /**
     * Extract the outer HTML of the container matching containerId.
     */
    public function extract(string $html, string $containerId): ?string;

    /**
     * Extract the title text content from the HTML page.
     */
    public function extractTitle(string $html): ?string;

    /**
     * Extract the inner HTML of the <head> element from the HTML page.
     */
    public function extractHead(string $html): ?string;

    /**
     * Extract title, head, and container in a single DOM parse operation.
     *
     * @return array{title: string|null, head: string|null, fragment: string|null}
     */
    public function extractAll(string $html, string $containerId): array;
}
