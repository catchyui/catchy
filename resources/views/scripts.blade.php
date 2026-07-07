@php
    $usePublished = file_exists(public_path('vendor/catchy/catchy.js'));
    $js = '';
    if (!$usePublished) {
        $js = (isset($jsPath) && file_exists($jsPath))
            ? (string) file_get_contents($jsPath)
            : 'console.warn("Catchy: resources/js/catchy.js not found.");';
    }

    // Load transition and modal CSS styles dynamically from their respective files
    $transitionsCssPath = \Catchyui\Catchy\CatchyServiceProvider::getTransitionsCssPath();
    $modalCssPath = \Catchyui\Catchy\CatchyServiceProvider::getModalCssPath();

    $transitionsCss = file_exists($transitionsCssPath) ? (string) file_get_contents($transitionsCssPath) : '';
    $modalCss = file_exists($modalCssPath) ? (string) file_get_contents($modalCssPath) : '';
@endphp

<style>
    {!! $transitionsCss !!}
    {!! $modalCss !!}

    /* Assign view-transition-name to the Catchy SPA main content area and apply theme backgrounds */
    #{{ config('catchy.container_id', 'catchy-app') }} {
        view-transition-name: catchy-content;
        background-color: #f8fafc; /* light: bg-slate-50 */
    }
    html.dark #{{ config('catchy.container_id', 'catchy-app') }} {
        background-color: #0f172a; /* dark: bg-slate-900 */
    }
</style>

<script>
    (function() {
        let alpineInstance = undefined;
        let startCalled = false;

        function initCatchy(alpine) {
            if (window.CatchyPlugin) {
                alpine.plugin(window.CatchyPlugin);
            } else {
                const originalStart = alpine.start;
                alpine.start = function() {
                    startCalled = true;
                };

                const onLoad = () => {
                    if (window.CatchyPlugin) {
                        alpine.plugin(window.CatchyPlugin);
                    }
                    alpine.start = originalStart;
                    if (startCalled) {
                        alpine.start();
                    }
                    document.removeEventListener('catchy:loaded', onLoad);
                };
                document.addEventListener('catchy:loaded', onLoad);
            }
        }

        if (window.Alpine) {
            initCatchy(window.Alpine);
        } else {
            Object.defineProperty(window, 'Alpine', {
                get() {
                    return alpineInstance;
                },
                set(value) {
                    alpineInstance = value;
                    if (alpineInstance) {
                        initCatchy(alpineInstance);
                    }
                },
                configurable: true
            });
        }
    })();

    window.CatchyConfig = {!! json_encode([
        'containerId' => config('catchy.container_id', 'catchy-app'),
        'ignoreAttribute' => 'data-catchy-ignore',
        'prefetch' => config('catchy.prefetch.enabled', true),
        'prefetchDelay' => (int) config('catchy.prefetch.delay', 75),
        'cacheTTL' => (int) config('catchy.prefetch.ttl', 30000),
        'swr' => (bool) config('catchy.swr', true),
        'loadingBar' => config('catchy.loading_bar.enabled', true),
        'loadingBarHeight' => config('catchy.loading_bar.height', '3px'),
        'loadingBarColor' => config('catchy.loading_bar.color', 'linear-gradient(to right, #4f46e5, #06b6d4)'),
        'viewTransitions' => config('catchy.view_transitions', 'fade'),
        'version' => app(\Catchyui\Catchy\Domain\Contracts\VersionRepositoryInterface::class)->getVersion(),
        'debug' => (bool) config('app.debug', false),
        'svg' => [
            'spinner' => view('catchy::svg.spinner', ['attributes' => new \Illuminate\View\ComponentAttributeBag(['class' => 'animate-spin -ms-1 me-2 h-4 w-4 text-current inline-block align-text-bottom', 'style' => 'vertical-align: middle;'])])->render(),
            'close' => view('catchy::svg.close', ['attributes' => new \Illuminate\View\ComponentAttributeBag(['class' => 'w-6 h-6', 'style' => 'width: 24px; height: 24px;'])])->render(),
        ]
    ], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) !!};
</script>

@if($usePublished)
    <script src="{{ asset('vendor/catchy/catchy.js') }}?v={{ filemtime(public_path('vendor/catchy/catchy.js')) }}" defer></script>
@else
    <script>
        {!! $js !!}
    </script>
@endif
