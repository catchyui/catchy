<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Infrastructure\Extractors;

use DOMDocument;
use DOMXPath;
use Hamzi\Catchy\Domain\Contracts\ResponseExtractorInterface;

/**
 * Class HtmlResponseExtractor
 *
 * Implements ResponseExtractorInterface utilizing DOMDocument and DOMXPath to safely parse HTML
 * and extract layout components while preserving UTF-8 encodings.
 */
class HtmlResponseExtractor implements ResponseExtractorInterface
{
    /**
     * Extract the outer HTML of the container matching containerId.
     */
    public function extract(string $html, string $containerId): ?string
    {
        $dom = $this->parseHtml($html);
        if (! $dom) {
            return null;
        }

        return $this->extractContainerFromDom($dom, $containerId);
    }

    /**
     * Extract the title text content from the HTML page.
     */
    public function extractTitle(string $html): ?string
    {
        $dom = $this->parseHtml($html);
        if (! $dom) {
            return null;
        }

        return $this->extractTitleFromDom($dom);
    }

    /**
     * Extract the inner HTML of the <head> element from the HTML page.
     */
    public function extractHead(string $html): ?string
    {
        $dom = $this->parseHtml($html);
        if (! $dom) {
            return null;
        }

        return $this->extractHeadFromDom($dom);
    }

    /**
     * Extract title, head, and container in a single DOM parse operation.
     *
     * @return array{title: string|null, head: string|null, fragment: string|null}
     */
    public function extractAll(string $html, string $containerId): array
    {
        $dom = $this->parseHtml($html);
        if (! $dom) {
            return ['title' => null, 'head' => null, 'fragment' => null];
        }

        return [
            'title' => $this->extractTitleFromDom($dom),
            'head' => $this->extractHeadFromDom($dom),
            'fragment' => $this->extractContainerFromDom($dom, $containerId),
        ];
    }

    /**
     * Parse raw HTML into a DOMDocument with UTF-8 support.
     */
    protected function parseHtml(string $html): ?DOMDocument
    {
        if (empty($html)) {
            return null;
        }

        // Suppress HTML parsing warnings gracefully while preserving global state
        $previousState = libxml_use_internal_errors(true);
        $dom = new DOMDocument;

        // Enforce UTF-8 parsing to avoid encoding issues with Arabic/special characters
        $loaded = $dom->loadHTML(
            '<?xml encoding="utf-8" ?>'.mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'),
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
        );

        libxml_clear_errors();
        libxml_use_internal_errors($previousState);

        return $loaded ? $dom : null;
    }

    /**
     * Extract the outer HTML of a container element by ID from a parsed DOM.
     */
    protected function extractContainerFromDom(DOMDocument $dom, string $containerId): ?string
    {
        $xpath = new DOMXPath($dom);

        // Safely escape the containerId to prevent XPath injection
        $escapedId = $this->xpathEscapeString($containerId);
        $nodes = $xpath->query("//*[@id={$escapedId}]");

        if ($nodes === false || $nodes->length === 0) {
            return null;
        }

        $fragment = $dom->saveHTML($nodes->item(0));

        return $fragment ?: null;
    }

    /**
     * Proper XPath string escaping.
     */
    private function xpathEscapeString(string $value): string
    {
        if (! str_contains($value, "'")) {
            return "'{$value}'";
        }
        if (! str_contains($value, '"')) {
            return "\"{$value}\"";
        }
        // Complex case: string contains both single and double quotes, use concat()
        $parts = explode("'", $value);

        return "concat('".implode("',\"'\",'", $parts)."')";
    }

    /**
     * Extract the page title from a parsed DOM.
     */
    protected function extractTitleFromDom(DOMDocument $dom): ?string
    {
        $xpath = new DOMXPath($dom);
        $titleNode = $xpath->query('//title');

        if ($titleNode === false || $titleNode->length === 0) {
            return null;
        }

        $title = trim($titleNode->item(0)->textContent);

        return $title !== '' ? $title : null;
    }

    /**
     * Extract the inner HTML of the <head> element from a parsed DOM.
     * Excludes the <title> tag and non-dynamic elements (charset, viewport).
     */
    protected function extractHeadFromDom(DOMDocument $dom): ?string
    {
        $xpath = new DOMXPath($dom);
        $headNodes = $xpath->query('//head');

        if ($headNodes === false || $headNodes->length === 0) {
            return null;
        }

        $head = $headNodes->item(0);
        $html = '';

        foreach ($head->childNodes as $child) {
            // Skip title (already extracted separately) and text nodes
            if ($child->nodeName === 'title' || $child->nodeType === XML_TEXT_NODE) {
                continue;
            }

            // Skip static infrastructure meta tags (charset, viewport, csrf)
            if ($child->nodeName === 'meta') {
                $charset = $child->getAttribute('charset');
                $name = $child->getAttribute('name');
                if ($charset !== '' || $name === 'viewport' || $name === 'csrf-token') {
                    continue;
                }
            }

            $html .= $dom->saveHTML($child);
        }

        $html = trim($html);

        return $html !== '' ? $html : null;
    }
}
