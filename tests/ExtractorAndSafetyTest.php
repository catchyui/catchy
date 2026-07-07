<?php

declare(strict_types=1);

namespace Catchyui\Catchy\Tests;

use Catchyui\Catchy\Infrastructure\Extractors\HtmlResponseExtractor;
use Catchyui\Catchy\Support\FlashExtractor;
use Illuminate\Http\Request;
use Illuminate\Session\Store;
use Illuminate\Support\MessageBag;
use Illuminate\Support\ViewErrorBag;

/**
 * Class ExtractorAndSafetyTest
 *
 * Verifies HtmlResponseExtractor XPath injection protection, DOM extraction correctness,
 * and FlashExtractor session processing.
 */
class ExtractorAndSafetyTest extends TestCase
{
    /**
     * Test HtmlResponseExtractor behaves correctly when extracting titles and heads.
     */
    public function test_extractor_can_extract_head_title_and_fragment(): void
    {
        $html = '<!DOCTYPE html><html><head><title>Test Title</title><link rel="stylesheet" href="style.css"></head><body><div id="catchy-app"><h1>Hello Catchy</h1></div></body></html>';
        $extractor = new HtmlResponseExtractor;

        $result = $extractor->extractAll($html, 'catchy-app');

        $this->assertEquals('Test Title', $result['title']);
        $this->assertStringContainsString('style.css', $result['head']);
        $this->assertStringNotContainsString('title', $result['head']); // title should be excluded
        $this->assertStringContainsString('<h1>Hello Catchy</h1>', $result['fragment']);
    }

    /**
     * Test HtmlResponseExtractor behaves correctly with UTF-8 Arabic titles.
     */
    public function test_extractor_handles_utf8_arabic_title(): void
    {
        $html = '<!DOCTYPE html><html><head><title>صفحة تجريبية</title></head><body><div id="catchy-app">محتوى</div></body></html>';
        $extractor = new HtmlResponseExtractor;

        $result = $extractor->extractAll($html, 'catchy-app');

        $this->assertEquals('صفحة تجريبية', $result['title']);
    }

    /**
     * Test HtmlResponseExtractor XPath escaping protects against single and double quotes.
     */
    public function test_extractor_escapes_xpath_container_ids(): void
    {
        $extractor = new HtmlResponseExtractor;

        // 1. Double quotes in ID
        $html1 = '<html><body><div id="foo&quot;bar">Double Quote Content</div></body></html>';
        $result1 = $extractor->extract($html1, 'foo"bar');
        $this->assertStringContainsString('Double Quote Content', $result1);

        // 2. Single quotes in ID
        $html2 = '<html><body><div id="foo\'bar">Single Quote Content</div></body></html>';
        $result2 = $extractor->extract($html2, "foo'bar");
        $this->assertStringContainsString('Single Quote Content', $result2);

        // 3. Both quotes in ID
        $html3 = '<html><body><div id="foo\'&quot;bar">Mixed Content</div></body></html>';
        $result3 = $extractor->extract($html3, "foo'\"bar");
        $this->assertStringContainsString('Mixed Content', $result3);
    }

    /**
     * Test HtmlResponseExtractor preserves the global libxml_use_internal_errors state.
     */
    public function test_extractor_preserves_libxml_errors_state(): void
    {
        $extractor = new HtmlResponseExtractor;

        // Set state to false
        libxml_use_internal_errors(false);
        $extractor->extract('<html><body><div>Test</div></body></html>', 'app');
        $this->assertFalse(libxml_use_internal_errors());

        // Set state to true
        libxml_use_internal_errors(true);
        $extractor->extract('<html><body><div>Test</div></body></html>', 'app');
        $this->assertTrue(libxml_use_internal_errors());

        // Reset to default false
        libxml_use_internal_errors(false);
    }

    /**
     * Test FlashExtractor logic (clear vs read-only).
     */
    public function test_flash_extractor_reads_and_clears(): void
    {
        $session = $this->createStub(Store::class);
        $session->method('has')->willReturnMap([
            ['success', true],
            ['error', true],
            ['warning', false],
            ['info', false],
            ['status', false],
            ['errors', false],
        ]);

        // Expect get to be called in read-only mode
        $session->method('get')->willReturnMap([
            ['success', 'Success message'],
            ['error', 'Error message'],
        ]);

        // Expect pull to be called in clear mode
        $session->method('pull')->willReturnMap([
            ['success', 'Success message cleared'],
            ['error', 'Error message cleared'],
        ]);

        $request = new Request;
        $request->setLaravelSession($session);

        // 1. Test read-only mode
        $flash = FlashExtractor::extract($request, false);
        $this->assertEquals('Success message', $flash['success']);
        $this->assertEquals('Error message', $flash['error']);

        // 2. Test clear mode
        $flashCleared = FlashExtractor::extract($request, true);
        $this->assertEquals('Success message cleared', $flashCleared['success']);
        $this->assertEquals('Error message cleared', $flashCleared['error']);
    }

    /**
     * Test FlashExtractor merges multiple validation error bags correctly.
     */
    public function test_flash_extractor_handles_multiple_error_bags(): void
    {
        $defaultBag = $this->createStub(MessageBag::class);
        $defaultBag->method('toArray')->willReturn(['email' => ['Email invalid']]);

        $customBag = $this->createStub(MessageBag::class);
        $customBag->method('toArray')->willReturn([
            'email' => ['Email already exists'],
            'username' => ['Username is required'],
        ]);

        $viewErrorBag = $this->createStub(ViewErrorBag::class);
        $viewErrorBag->method('getBags')->willReturn([
            'default' => $defaultBag,
            'custom' => $customBag,
        ]);

        $session = $this->createStub(Store::class);
        $session->method('has')->willReturnMap([
            ['success', false],
            ['error', false],
            ['warning', false],
            ['info', false],
            ['status', false],
            ['errors', true],
        ]);
        $session->method('get')->willReturn($viewErrorBag);

        $request = new Request;
        $request->setLaravelSession($session);

        $flash = FlashExtractor::extract($request, false);

        $this->assertArrayHasKey('validation_errors', $flash);
        $this->assertEquals([
            'email' => ['Email invalid', 'Email already exists'],
            'username' => ['Username is required'],
        ], $flash['validation_errors']);
    }

    /**
     * Test HtmlResponseExtractor returns null on empty HTML.
     */
    public function test_extractor_returns_null_on_empty_html(): void
    {
        $extractor = new HtmlResponseExtractor;

        $this->assertNull($extractor->extract('', 'app'));
        $this->assertNull($extractor->extractTitle(''));
        $this->assertNull($extractor->extractHead(''));

        $all = $extractor->extractAll('', 'app');
        $this->assertNull($all['title']);
        $this->assertNull($all['head']);
        $this->assertNull($all['fragment']);
    }

    /**
     * Test HtmlResponseExtractor returns null on missing head or title.
     */
    public function test_extractor_returns_null_on_missing_tags(): void
    {
        $extractor = new HtmlResponseExtractor;

        // No head or title
        $html = '<html><body><div id="app">Hello</div></body></html>';
        $this->assertNull($extractor->extractTitle($html));
        $this->assertNull($extractor->extractHead($html));

        $all = $extractor->extractAll($html, 'app');
        $this->assertNull($all['title']);
        $this->assertNull($all['head']);
        $this->assertEquals('<div id="app">Hello</div>', $all['fragment']);
    }

    /**
     * Test FlashExtractor returns empty array if no session is set on the request.
     */
    public function test_flash_extractor_returns_empty_when_no_session(): void
    {
        $request = new Request; // No session attached

        $this->assertEmpty(FlashExtractor::extract($request));
    }
}
