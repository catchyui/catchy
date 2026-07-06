<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Tests\Browser;

use Hamzi\Catchy\CatchyServiceProvider;
use Orchestra\Testbench\Dusk\TestCase as OrchestraDuskTestCase;

abstract class BrowserTestCase extends OrchestraDuskTestCase
{
    /**
     * Get package providers.
     */
    protected function getPackageProviders($app): array
    {
        return [
            CatchyServiceProvider::class,
        ];
    }

    /**
     * Define environment setup.
     */
    protected function getEnvironmentSetUp($app): void
    {
        $app['config']->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
        $app['config']->set('catchy.container_id', 'catchy-app');
        $app['config']->set('catchy.auto_inject', true);
    }

    /**
     * Helper to return standard HTML page structure with Alpine.js loaded.
     */
    protected function baseHtml(string $title, string $bodyContent): string
    {
        return '<!DOCTYPE html>
<html>
<head>
 <title>'.$title.'</title>
 <meta name="csrf-token" content="'.csrf_token().'">
 <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/morph@3.x.x/dist/cdn.min.js"></script>
 <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body class="bg-white">
 <div id="catchy-app">
 '.$bodyContent.'
 </div>
</body>
</html>';
    }

    /**
     * Define routes for browser tests.
     */
    protected function defineRoutes($router): void
    {
        $router->get('/catchy-test-1', function () {
            return $this->baseHtml('Page One', '
 <h1>Page One Content</h1>
 <a href="/catchy-test-2" id="link-page-two">Go to Page Two</a>
 <form action="/catchy-test-submit" method="POST" id="form-test">
 '.csrf_field().'
 <input type="text" name="name" id="input-name">
 <button type="submit" id="btn-submit">Submit</button>
 </form>
 ');
        })->middleware('web');

        $router->get('/catchy-test-2', function () {
            return $this->baseHtml('Page Two', '
 <h1>Page Two Content</h1>
 <a href="/catchy-test-1" id="link-page-one">Go to Page One</a>
 ');
        })->middleware('web');

        $router->post('/catchy-test-submit', function () {
            request()->validate([
                'name' => 'required',
            ]);

            return redirect('/catchy-test-success?name='.urlencode(request('name')));
        })->middleware('web');

        $router->get('/catchy-test-success', function () {
            return $this->baseHtml('Submit Success', '
 <h1>Submitted Name: '.request('name').'</h1>
 <a href="/catchy-test-1" id="link-back">Back to Page One</a>
 ');
        })->middleware('web');
    }
}
