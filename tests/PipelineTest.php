<?php

declare(strict_types=1);

namespace Catchyui\Catchy\Tests;

use Catchyui\Catchy\Domain\Contracts\PipelineStageInterface;
use Catchyui\Catchy\Domain\Contracts\ResponseExtractorInterface;
use Catchyui\Catchy\Domain\Contracts\VersionRepositoryInterface;
use Catchyui\Catchy\Domain\ValueObjects\CatchyPipelineData;
use Catchyui\Catchy\Http\Middleware\Pipeline\AppendResponseHeaders;
use Catchyui\Catchy\Http\Middleware\Pipeline\ExtractResponseContainer;
use Catchyui\Catchy\Http\Middleware\Pipeline\HandleRedirectResponse;
use Catchyui\Catchy\Http\Middleware\Pipeline\VerifyAssetVersion;
use Illuminate\Http\Request;
use Illuminate\Session\Store;
use Symfony\Component\HttpFoundation\Response;

/**
 * Class PipelineTest
 *
 * Verifies that the Catchy HTTP middleware pipeline stages execute correctly and in isolation.
 */
class PipelineTest extends TestCase
{
    /**
     * Test the VerifyAssetVersion pipeline stage when versions match.
     */
    public function test_verify_asset_version_does_not_abort_when_versions_match(): void
    {
        $versionRepo = $this->createStub(VersionRepositoryInterface::class);
        $versionRepo->method('getVersion')->willReturn('1.0.0');

        $request = new Request;
        $request->headers->set('X-Catchy-Version', '1.0.0');
        $response = new Response('Hello content');

        $data = new CatchyPipelineData($request, $response);
        $stage = new VerifyAssetVersion($versionRepo);

        $result = $stage->handle($data, function (CatchyPipelineData $d) {
            return $d;
        });

        $this->assertEquals(200, $result->getResponse()->getStatusCode());
        $this->assertEquals('Hello content', $result->getResponse()->getContent());
    }

    /**
     * Test the VerifyAssetVersion pipeline stage when versions mismatch.
     */
    public function test_verify_asset_version_aborts_with_409_on_mismatch(): void
    {
        $versionRepo = $this->createStub(VersionRepositoryInterface::class);
        $versionRepo->method('getVersion')->willReturn('2.0.0');

        $request = new Request;
        $request->headers->set('X-Catchy-Version', '1.0.0'); // outdated client version
        $response = new Response('Hello content');

        $data = new CatchyPipelineData($request, $response);
        $stage = new VerifyAssetVersion($versionRepo);

        // We assert that the pipeline is stopped and a 409 response is returned (without invoking $next callback)
        $result = $stage->handle($data, function (CatchyPipelineData $d) {
            $this->fail('Pipeline should have aborted on version mismatch.');
        });

        $this->assertEquals(409, $result->getResponse()->getStatusCode());
        $this->assertEquals('2.0.0', $result->getResponse()->headers->get('X-Catchy-Version'));
    }

    /**
     * Test the HandleRedirectResponse stage intercepts standard redirects.
     */
    public function test_handle_redirect_rewrites_to_200_spa_redirect(): void
    {
        $versionRepo = $this->createStub(VersionRepositoryInterface::class);
        $versionRepo->method('getVersion')->willReturn('1.0.0');

        $request = new Request;
        $response = redirect('/target-url');

        $data = new CatchyPipelineData($request, $response);
        $stage = new HandleRedirectResponse($versionRepo);

        $result = $stage->handle($data, function (CatchyPipelineData $d) {
            $this->fail('Pipeline should have stopped on redirect intercepts.');
        });

        $this->assertEquals(200, $result->getResponse()->getStatusCode());
        $this->assertEquals(url('/target-url'), $result->getResponse()->headers->get('X-Catchy-Redirect'));
        $this->assertEquals('true', $result->getResponse()->headers->get('X-Catchy-Request'));
        $this->assertEquals('1.0.0', $result->getResponse()->headers->get('X-Catchy-Version'));
    }

    /**
     * Test that HandleRedirectResponse preserves redirect cookies and custom headers.
     */
    public function test_handle_redirect_preserves_cookies_and_custom_headers(): void
    {
        $versionRepo = $this->createStub(VersionRepositoryInterface::class);
        $versionRepo->method('getVersion')->willReturn('1.0.0');

        $request = new Request;
        $response = redirect('/target-url')->withCookie(cookie('my-cookie', 'cookie-value'));
        $response->headers->set('X-Custom-Header', 'custom-value');

        $data = new CatchyPipelineData($request, $response);
        $stage = new HandleRedirectResponse($versionRepo);

        $result = $stage->handle($data, function (CatchyPipelineData $d) {
            $this->fail('Pipeline should have stopped on redirect intercepts.');
        });

        $resp = $result->getResponse();
        $this->assertEquals(200, $resp->getStatusCode());
        $this->assertEquals(url('/target-url'), $resp->headers->get('X-Catchy-Redirect'));
        $this->assertEquals('custom-value', $resp->headers->get('X-Custom-Header'));

        $cookies = $resp->headers->getCookies();
        $this->assertCount(1, $cookies);
        $this->assertEquals('my-cookie', $cookies[0]->getName());
        $this->assertEquals('cookie-value', $cookies[0]->getValue());
    }

    /**
     * Test the AppendResponseHeaders stage adds correct version and session flash headers.
     */
    public function test_append_response_headers_sets_correct_headers(): void
    {
        $versionRepo = $this->createStub(VersionRepositoryInterface::class);
        $versionRepo->method('getVersion')->willReturn('3.2.1');

        $session = $this->createMock(Store::class);
        $session->method('has')->willReturnMap([
            ['success', true],
            ['error', false],
            ['warning', false],
            ['info', false],
            ['status', false],
            ['errors', false],
        ]);
        $session->expects($this->once())->method('pull')->with('success')->willReturn('Done successfully!');

        $request = new Request;
        $request->setLaravelSession($session);

        $response = new Response('Hello body');
        $data = new CatchyPipelineData($request, $response);

        $stage = new AppendResponseHeaders($versionRepo);
        $result = $stage->handle($data, function (CatchyPipelineData $d) {
            return $d;
        });

        $resp = $result->getResponse();
        $this->assertEquals('3.2.1', $resp->headers->get('X-Catchy-Version'));
        $this->assertTrue($resp->headers->has('X-Catchy-Flash'));

        $flash = json_decode(base64_decode($resp->headers->get('X-Catchy-Flash')), true);
        $this->assertEquals('Done successfully!', $flash['success']);
    }

    /**
     * Test the ExtractResponseContainer stage trims standard successful HTML response.
     */
    public function test_extract_response_container_trims_html_content(): void
    {
        $extractor = $this->createStub(ResponseExtractorInterface::class);
        $extractor->method('extractAll')->willReturn([
            'title' => 'Page Title',
            'head' => '<link rel="stylesheet">',
            'fragment' => '<div id="catchy-app">Morphed Content</div>',
        ]);

        $request = new Request;
        $response = new Response('<html><head><title>Original</title></head><body><div id="catchy-app">Original</div></body></html>');
        $response->headers->set('Content-Type', 'text/html');

        $data = new CatchyPipelineData($request, $response);
        $stage = new ExtractResponseContainer($extractor);

        $result = $stage->handle($data, function (CatchyPipelineData $d) {
            return $d;
        });

        $resp = $result->getResponse();
        $this->assertEquals('<div id="catchy-app">Morphed Content</div>', $resp->getContent());
        $this->assertEquals(base64_encode('Page Title'), $resp->headers->get('X-Catchy-Title'));
        $this->assertEquals(base64_encode('<link rel="stylesheet">'), $resp->headers->get('X-Catchy-Head'));
    }

    /**
     * Test the ExtractResponseContainer pipeline stage when custom target headers are provided.
     */
    public function test_extract_response_container_handles_custom_target_header(): void
    {
        $extractor = $this->createMock(ResponseExtractorInterface::class);

        // Expect the extractor to be queried for 'my-custom-target' (with stripped '#')
        $extractor->expects($this->once())
            ->method('extractAll')
            ->with($this->anything(), 'my-custom-target')
            ->willReturn([
                'title' => 'Target Title',
                'head' => null,
                'fragment' => '<div id="my-custom-target">Target Content</div>',
            ]);

        $request = new Request;
        $request->headers->set('X-Catchy-Target', '#my-custom-target');

        $response = new Response('<html><head><title>Original</title></head><body><div id="my-custom-target">Original</div></body></html>');
        $response->headers->set('Content-Type', 'text/html');

        $data = new CatchyPipelineData($request, $response);
        $stage = new ExtractResponseContainer($extractor);

        $result = $stage->handle($data, function (CatchyPipelineData $d) {
            return $d;
        });

        $resp = $result->getResponse();
        $this->assertEquals('<div id="my-custom-target">Target Content</div>', $resp->getContent());
        $this->assertEquals(base64_encode('Target Title'), $resp->headers->get('X-Catchy-Title'));
    }

    /**
     * Test that all core pipeline stages implement the PipelineStageInterface contract.
     */
    public function test_pipeline_stages_implement_pipeline_stage_interface(): void
    {
        $this->assertInstanceOf(
            PipelineStageInterface::class,
            new VerifyAssetVersion($this->createStub(VersionRepositoryInterface::class))
        );
        $this->assertInstanceOf(
            PipelineStageInterface::class,
            new HandleRedirectResponse($this->createStub(VersionRepositoryInterface::class))
        );
        $this->assertInstanceOf(
            PipelineStageInterface::class,
            new AppendResponseHeaders($this->createStub(VersionRepositoryInterface::class))
        );
        $this->assertInstanceOf(
            PipelineStageInterface::class,
            new ExtractResponseContainer($this->createStub(ResponseExtractorInterface::class))
        );
    }

    /**
     * Test VerifyAssetVersion does nothing if server version is empty.
     */
    public function test_verify_asset_version_does_nothing_if_server_version_is_empty(): void
    {
        $versionRepo = $this->createStub(VersionRepositoryInterface::class);
        $versionRepo->method('getVersion')->willReturn('');

        $request = new Request;
        $response = new Response('Hello content');

        $data = new CatchyPipelineData($request, $response);
        $stage = new VerifyAssetVersion($versionRepo);

        $result = $stage->handle($data, function (CatchyPipelineData $d) {
            return $d;
        });

        $this->assertEquals(200, $result->getResponse()->getStatusCode());
        $this->assertEquals('Hello content', $result->getResponse()->getContent());
    }

    /**
     * Test HandleRedirectResponse does nothing if response is not a redirection.
     */
    public function test_handle_redirect_does_nothing_if_response_is_not_redirection(): void
    {
        $versionRepo = $this->createStub(VersionRepositoryInterface::class);
        $versionRepo->method('getVersion')->willReturn('1.0.0');

        $request = new Request;
        $response = new Response('Hello content');

        $data = new CatchyPipelineData($request, $response);
        $stage = new HandleRedirectResponse($versionRepo);

        $result = $stage->handle($data, function (CatchyPipelineData $d) {
            return $d;
        });

        $this->assertEquals(200, $result->getResponse()->getStatusCode());
        $this->assertEquals('Hello content', $result->getResponse()->getContent());
    }

    /**
     * Test HandleRedirectResponse redirection intercept when no session store is attached.
     */
    public function test_handle_redirect_without_session(): void
    {
        $versionRepo = $this->createStub(VersionRepositoryInterface::class);
        $versionRepo->method('getVersion')->willReturn('1.0.0');

        $request = new Request; // No session attached
        $response = redirect('/target-url');

        $data = new CatchyPipelineData($request, $response);
        $stage = new HandleRedirectResponse($versionRepo);

        $result = $stage->handle($data, function (CatchyPipelineData $d) {
            return $d;
        });

        $resp = $result->getResponse();
        $this->assertEquals(200, $resp->getStatusCode());
        $this->assertEquals(url('/target-url'), $resp->headers->get('X-Catchy-Redirect'));
        $this->assertFalse($resp->headers->has('X-Catchy-Flash')); // No session -> no flash header
    }

    /**
     * Test AppendResponseHeaders when both version is empty and session is absent.
     */
    public function test_append_response_headers_without_version_or_session(): void
    {
        $versionRepo = $this->createStub(VersionRepositoryInterface::class);
        $versionRepo->method('getVersion')->willReturn('');

        $request = new Request; // No session
        $response = new Response('Hello');

        $data = new CatchyPipelineData($request, $response);
        $stage = new AppendResponseHeaders($versionRepo);

        $result = $stage->handle($data, function (CatchyPipelineData $d) {
            return $d;
        });

        $resp = $result->getResponse();
        $this->assertFalse($resp->headers->has('X-Catchy-Version'));
        $this->assertFalse($resp->headers->has('X-Catchy-Flash'));
    }
}
