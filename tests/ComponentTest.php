<?php

declare(strict_types=1);

namespace Hamzi\Catchy\Tests;

use Illuminate\Support\Facades\Blade;

/**
 * Class ComponentTest
 *
 * Verifies that the Catchy package Blade UI components render correctly.
 *
 * @package Hamzi\Catchy\Tests
 */
class ComponentTest extends TestCase
{
    /**
     * Verify that the spinner component compiles and renders correct size and color.
     */
    public function test_spinner_component_renders(): void
    {
        $html = Blade::render('<x-catchy-spinner size="sm" color="accent" class="my-test" />');

        $this->assertStringContainsString('animate-spin', $html);
        $this->assertStringContainsString('h-4 w-4', $html);
        $this->assertStringContainsString('text-cyan-500', $html);
        $this->assertStringContainsString('my-test', $html);
    }

    /**
     * Verify that the skeleton component compiles and renders correct layouts.
     */
    public function test_skeleton_component_renders(): void
    {
        $html = Blade::render('<x-catchy-skeleton type="circle" class="my-skel" />');

        $this->assertStringContainsString('animate-pulse', $html);
        $this->assertStringContainsString('rounded-full', $html);
        $this->assertStringContainsString('my-skel', $html);
    }

    /**
     * Verify that the fade-in animation component compiles and outputs the correct attributes.
     */
    public function test_fade_component_renders(): void
    {
        $html = Blade::render('<x-catchy-fade duration="500">Content</x-catchy-fade>');

        $this->assertStringContainsString('x-data', $html);
        $this->assertStringContainsString('duration-500', $html);
        $this->assertStringContainsString('Content', $html);
    }

    /**
     * Verify that the form component compiles and renders correct listeners, CSRF, and method fields.
     */
    public function test_form_component_renders(): void
    {
        $html = Blade::render('<x-catchy-form action="/submit" method="PUT" beforesend="onBefore()" success="onSuccess()" error="onError()">Input</x-catchy-form>');

        $this->assertStringContainsString('action="/submit"', $html);
        $this->assertStringContainsString('method="POST"', $html); // HTTP POST for spoofed PUT
        $this->assertStringContainsString('x-data', $html);
        $this->assertStringContainsString('@catchy:start="onBefore()"', $html);
        $this->assertStringContainsString('@catchy:end="onSuccess()"', $html);
        $this->assertStringContainsString('@catchy:error="onError()"', $html);
        $this->assertStringContainsString('name="_method" value="PUT"', $html);
        $this->assertStringContainsString('name="_token"', $html);
        $this->assertStringContainsString('Input', $html);
    }

    /**
     * Verify that the catchy directive compiles correctly.
     */
    public function test_catchy_directive_renders(): void
    {
        $html = Blade::render('<form action="/submit" @catchyForm(["beforesend" => "onBefore", "success" => "onSuccess", "error" => "onError"])>Form</form>');

        $this->assertStringContainsString('x-data', $html);
        $this->assertStringContainsString('@catchy:start="onBefore"', $html);
        $this->assertStringContainsString('data-catchy-beforesend="onBefore"', $html);
        $this->assertStringContainsString('@catchy:end="onSuccess"', $html);
        $this->assertStringContainsString('data-catchy-success="onSuccess"', $html);
        $this->assertStringContainsString('@catchy:error="onError"', $html);
        $this->assertStringContainsString('data-catchy-error="onError"', $html);
    }

    /**
     * Verify that the modal component compiles and renders correct structure and event listeners.
     */
    public function test_modal_component_renders(): void
    {
        $html = Blade::render('<x-catchy-modal id="my-test-modal" title="Hello Title">Modal Content</x-catchy-modal>');

        $this->assertStringContainsString('id="my-test-modal"', $html);
        $this->assertStringContainsString('catchy-modal', $html);
        $this->assertStringContainsString('Hello Title', $html);
        $this->assertStringContainsString('Modal Content', $html);
        $this->assertStringContainsString('@catchy:modal-load', $html);
        $this->assertStringContainsString('@catchy:modal-close', $html);
    }

    /**
     * Verify that the toast component compiles and renders correct structure and session/event handlers.
     */
    public function test_toast_component_renders(): void
    {
        $html = Blade::render('<x-catchy-toast position="bottom-right" duration="5000" />');

        $this->assertStringContainsString('@catchy:flash.window', $html);
        $this->assertStringContainsString('bottom-5 end-5', $html);
    }

    public function test_progress_component_renders(): void
    {
        $html = Blade::render('<x-catchy-progress color="success" height="h-4" label="تنزيل الملفات" for="my-upload-form" />');

        $this->assertStringContainsString('bg-emerald-500', $html);
        $this->assertStringContainsString('h-4', $html);
        $this->assertStringContainsString('تنزيل الملفات', $html);
        $this->assertStringContainsString('my-upload-form', $html);
    }

    /**
     * Verify that the upload component compiles and renders correct structure.
     */
    public function test_upload_component_renders(): void
    {
        $html = Blade::render('<x-catchy-upload name="avatar" label="حمل صورتك" accept="image/*" multiple />');

        $this->assertStringContainsString('name="avatar"', $html);
        $this->assertStringContainsString('accept="image/*"', $html);
        $this->assertStringContainsString('multiple', $html);
        $this->assertStringContainsString('حمل صورتك', $html);
    }

    /**
     * Verify that components render translation strings based on current locale.
     */
    public function test_components_use_translations_based_on_locale(): void
    {
        // 1. Test Arabic locale (should load Arabic text by default)
        $this->app->setLocale('ar');
        
        $progressHtml = Blade::render('<x-catchy-progress />');
        $this->assertStringContainsString('جاري تحميل الملفات...', $progressHtml);

        $uploadHtml = Blade::render('<x-catchy-upload name="doc" />');
        $this->assertStringContainsString('اسحب الملفات هنا أو انقر للاختيار', $uploadHtml);

        // 2. Test English locale (should load English text by default)
        $this->app->setLocale('en');

        $progressHtmlEn = Blade::render('<x-catchy-progress />');
        $this->assertStringContainsString('Loading files...', $progressHtmlEn);

        $uploadHtmlEn = Blade::render('<x-catchy-upload name="doc" />');
        $this->assertStringContainsString('Drag &amp; drop files here or click to browse', $uploadHtmlEn);
    }

    /**
     * Verify that CatchyDirective getJavaScript successfully caches the JS file contents in memory.
     */
    public function test_directive_caches_javascript_in_memory(): void
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'catchy_test');
        file_put_contents($tempFile, 'console.log("Cached JS");');

        $content1 = \Hamzi\Catchy\CatchyDirective::getJavaScript($tempFile);
        $this->assertEquals('console.log("Cached JS");', $content1);

        // Modify the file on disk
        file_put_contents($tempFile, 'console.log("Modified JS");');

        // Reading again should return cached content
        $content2 = \Hamzi\Catchy\CatchyDirective::getJavaScript($tempFile);
        $this->assertEquals('console.log("Cached JS");', $content2);

        unlink($tempFile);
    }

    /**
     * Verify that the error component compiles and renders correct structure and event listeners.
     */
    public function test_error_component_renders(): void
    {
        $html = Blade::render('<x-catchy-error field="email" class="my-error-class" />');

        $this->assertStringContainsString('catchy-validation-errors.window', $html);
        $this->assertStringContainsString('catchyError({ field: \'email\' })', $html);
        $this->assertStringContainsString('my-error-class', $html);
    }

    /**
     * Verify that the lazy component compiles and renders correct trigger and placeholder.
     */
    public function test_lazy_component_renders(): void
    {
        $html = Blade::render('<x-catchy-lazy src="/widgets/comments" trigger="intersect" />');

        $this->assertStringContainsString('/widgets/comments', $html);
        $this->assertStringContainsString('intersect', $html);
        $this->assertStringContainsString('catchyLazy', $html);
        $this->assertStringContainsString('animate-pulse', $html);
    }

    /**
     * Verify that the offcanvas component compiles and renders correct structure, direction classes, and listeners.
     */
    public function test_offcanvas_component_renders(): void
    {
        $html = Blade::render('<x-catchy-offcanvas id="my-test-offcanvas" title="Filters Drawer" direction="left">Drawer Content</x-catchy-offcanvas>');

        $this->assertStringContainsString('id="my-test-offcanvas"', $html);
        $this->assertStringContainsString('catchy-offcanvas', $html);
        $this->assertStringContainsString('Filters Drawer', $html);
        $this->assertStringContainsString('Drawer Content', $html);
        $this->assertStringContainsString('-translate-x-full', $html); // left direction start class
        $this->assertStringContainsString('@catchy:offcanvas-load', $html);
        $this->assertStringContainsString('@catchy:offcanvas-close', $html);
    }

    /**
     * Verify that the button component compiles and renders correct structure, variant, and sizes.
     */
    public function test_button_component_renders(): void
    {
        $html = Blade::render('<x-catchy-button variant="success" size="lg" class="test-btn">Click Me</x-catchy-button>');

        $this->assertStringContainsString('bg-emerald-600', $html);
        $this->assertStringContainsString('px-5 py-2.5', $html);
        $this->assertStringContainsString('test-btn', $html);
        $this->assertStringContainsString('Click Me', $html);
    }

    /**
     * Verify that the card component compiles and renders header, slot, and footer.
     */
    public function test_card_component_renders(): void
    {
        $obLevel = ob_get_level();
        try {
            $html = Blade::render('<x-catchy-card hoverable><x-slot:header>My Header</x-slot:header>My Body<x-slot:footer>My Footer</x-slot:footer></x-catchy-card>');
        } finally {
            while (ob_get_level() > $obLevel) {
                ob_end_clean();
            }
        }

        $this->assertStringContainsString('My Header', $html);
        $this->assertStringContainsString('My Body', $html);
        $this->assertStringContainsString('My Footer', $html);
        $this->assertStringContainsString('hover:scale-', $html);
    }

    /**
     * Verify that the alert component compiles and renders alert variant and dismiss options.
     */
    public function test_alert_component_renders(): void
    {
        $html = Blade::render('<x-catchy-alert type="danger" :dismissible="true">An Error Happened</x-catchy-alert>');

        $this->assertStringContainsString('bg-rose-50', $html);
        $this->assertStringContainsString('An Error Happened', $html);
        $this->assertStringContainsString('Dismiss', $html); // has dismiss button
    }

    /**
     * Verify that the badge component compiles and renders correct text, size, and variants.
     */
    public function test_badge_component_renders(): void
    {
        $html = Blade::render('<x-catchy-badge variant="success" size="sm" rounded>Active</x-catchy-badge>');

        $this->assertStringContainsString('bg-emerald-50', $html);
        $this->assertStringContainsString('px-1.5', $html);
        $this->assertStringContainsString('rounded-full', $html);
        $this->assertStringContainsString('Active', $html);
    }

    /**
     * Verify that the dropdown component compiles and renders trigger and content slots.
     */
    public function test_dropdown_component_renders(): void
    {
        $obLevel = ob_get_level();
        try {
            $html = Blade::render('<x-catchy-dropdown align="end"><x-slot:trigger>Click Me</x-slot:trigger><x-slot:content>Dropdown Menu Item</x-slot:content></x-catchy-dropdown>');
        } finally {
            while (ob_get_level() > $obLevel) {
                ob_end_clean();
            }
        }

        $this->assertStringContainsString('Click Me', $html);
        $this->assertStringContainsString('Dropdown Menu Item', $html);
        $this->assertStringContainsString('origin-top-end', $html);
    }

    /**
     * Verify that the input component compiles and renders label, helper text, and error indicators.
     */
    public function test_input_component_renders(): void
    {
        $html = Blade::render('<x-catchy-input name="username" label="Your Username" placeholder="Enter username" helper="Choose wisely" required />');

        $this->assertStringContainsString('name="username"', $html);
        $this->assertStringContainsString('Your Username', $html);
        $this->assertStringContainsString('placeholder="Enter username"', $html);
        $this->assertStringContainsString('Choose wisely', $html);
        $this->assertStringContainsString('*', $html);
        $this->assertStringContainsString('catchy-validation-errors.window', $html); // from x-catchy-error nested component
    }

    /**
     * Verify that the textarea component compiles and renders correctly.
     */
    public function test_textarea_component_renders(): void
    {
        $html = Blade::render('<x-catchy-textarea name="bio" label="Your Biography" placeholder="Tell us about yourself" rows="5" helper="Be brief" required auto-grow />');

        $this->assertStringContainsString('name="bio"', $html);
        $this->assertStringContainsString('Your Biography', $html);
        $this->assertStringContainsString('placeholder="Tell us about yourself"', $html);
        $this->assertStringContainsString('rows="5"', $html);
        $this->assertStringContainsString('Be brief', $html);
        $this->assertStringContainsString('*', $html);
        $this->assertStringContainsString('catchy-validation-errors.window', $html);
        $this->assertStringContainsString('catchyError({ field: \'bio\' })', $html);
        $this->assertStringContainsString('x-data="{', $html); // For the autoGrow x-data
    }

    /**
     * Verify that the select component compiles and renders correctly.
     */
    public function test_select_component_renders(): void
    {
        $options = ['eg' => 'Egypt', 'us' => 'United States'];
        $html = Blade::render('<x-catchy-select name="country" label="Your Country" :options="$options" selected="eg" helper="Pick one" required />', ['options' => $options]);

        $this->assertStringContainsString('name="country"', $html);
        $this->assertStringContainsString('Your Country', $html);
        $this->assertStringContainsString('value="eg"', $html);
        $this->assertStringContainsString('selected', $html);
        $this->assertStringContainsString('Egypt', $html);
        $this->assertStringContainsString('United States', $html);
        $this->assertStringContainsString('Pick one', $html);
        $this->assertStringContainsString('*', $html);
        $this->assertStringContainsString('catchy-validation-errors.window', $html);
        $this->assertStringContainsString('catchyError({ field: \'country\' })', $html);
    }
}

