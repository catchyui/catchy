<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Tests\Browser;

use Laravel\Dusk\Browser;

class NavigationBrowserTest extends BrowserTestCase
{
    /**
     * Test navigating between pages via Catchy SPA links.
     */
    public function test_can_navigate_between_pages(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/catchy-test-1')
                ->assertPathIs('/catchy-test-1')
                ->assertTitleContains('Page One')
                ->assertSee('Page One Content')
                ->click('#link-page-two')
                ->pause(500) // Wait for fetch and transition
                ->assertPathIs('/catchy-test-2')
                ->assertTitleContains('Page Two')
                ->assertSee('Page Two Content')
                ->click('#link-page-one')
                ->pause(500)
                ->assertPathIs('/catchy-test-1')
                ->assertTitleContains('Page One');
        });
    }

    /**
     * Test submitting a form with success.
     */
    public function test_can_submit_form_successfully(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/catchy-test-1')
                ->type('#input-name', 'Legendary Catchy')
                ->click('#btn-submit')
                ->pause(500) // Wait for form submit and morph
                ->assertPathIs('/catchy-test-success')
                ->assertTitleContains('Submit Success')
                ->assertSee('Submitted Name: Legendary Catchy');
        });
    }
}
