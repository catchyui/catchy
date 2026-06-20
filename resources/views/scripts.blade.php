@php
    $usePublished = file_exists(public_path('vendor/catchy/catchy.js'));
    $js = '';
    if (!$usePublished) {
        $js = (isset($jsPath) && file_exists($jsPath))
            ? (string) file_get_contents($jsPath)
            : 'console.warn("Catchy: resources/js/catchy.js not found.");';
    }
@endphp



<style>
    /* ============================================================
     * Catchy — Premium View Transition CSS
     * Smooth cross-fade transitions with proper overlap and easing.
     * ============================================================ */

    /* --- "none" transition: instant swap, no animation --- */
    html[data-catchy-transition="none"]::view-transition-old(root),
    html[data-catchy-transition="none"]::view-transition-new(root) {
        animation: none;
    }

    /* --- "fade" transition: smooth cross-dissolve with overlap --- */
    @keyframes catchy-fade-out {
        from { opacity: 1; }
        to   { opacity: 0; }
    }
    @keyframes catchy-fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
    }

    html[data-catchy-transition="fade"]::view-transition-old(root) {
        animation: 0.2s cubic-bezier(0.4, 0, 0.2, 1) both catchy-fade-out;
        z-index: 1;
    }
    html[data-catchy-transition="fade"]::view-transition-new(root) {
        animation: 0.25s cubic-bezier(0.4, 0, 0.2, 1) both catchy-fade-in;
        z-index: 2;
    }
    /* Allow both snapshots to render simultaneously for a true cross-fade */
    html[data-catchy-transition="fade"]::view-transition-image-pair(root) {
        isolation: auto;
    }

    /* --- "slide" transition: subtle horizontal slide with fade --- */
    @keyframes catchy-slide-out {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(-30px); }
    }
    @keyframes catchy-slide-in {
        from { opacity: 0; transform: translateX(30px); }
        to   { opacity: 1; transform: translateX(0); }
    }

    html[data-catchy-transition="slide"]::view-transition-old(root) {
        animation: 0.25s cubic-bezier(0.4, 0, 0.2, 1) both catchy-slide-out;
        z-index: 1;
    }
    html[data-catchy-transition="slide"]::view-transition-new(root) {
        animation: 0.3s cubic-bezier(0.0, 0, 0.2, 1) both catchy-slide-in;
        z-index: 2;
    }
    html[data-catchy-transition="slide"]::view-transition-image-pair(root) {
        isolation: auto;
    }

    /* --- "slide-up" transition: vertical entrance from below --- */
    @keyframes catchy-slide-up-out {
        from { opacity: 1; transform: translateY(0); }
        to   { opacity: 0; transform: translateY(-20px); }
    }
    @keyframes catchy-slide-up-in {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    html[data-catchy-transition="slide-up"]::view-transition-old(root) {
        animation: 0.2s cubic-bezier(0.4, 0, 0.2, 1) both catchy-slide-up-out;
        z-index: 1;
    }
    html[data-catchy-transition="slide-up"]::view-transition-new(root) {
        animation: 0.3s cubic-bezier(0.0, 0, 0.2, 1) both catchy-slide-up-in;
        z-index: 2;
    }
    html[data-catchy-transition="slide-up"]::view-transition-image-pair(root) {
        isolation: auto;
    }

    /* --- "scale" transition: subtle scale with fade --- */
    @keyframes catchy-scale-out {
        from { opacity: 1; transform: scale(1); }
        to   { opacity: 0; transform: scale(0.97); }
    }
    @keyframes catchy-scale-in {
        from { opacity: 0; transform: scale(1.02); }
        to   { opacity: 1; transform: scale(1); }
    }

    html[data-catchy-transition="scale"]::view-transition-old(root) {
        animation: 0.2s cubic-bezier(0.4, 0, 0.2, 1) both catchy-scale-out;
        z-index: 1;
    }
    html[data-catchy-transition="scale"]::view-transition-new(root) {
        animation: 0.28s cubic-bezier(0.0, 0, 0.2, 1) both catchy-scale-in;
        z-index: 2;
    }
    html[data-catchy-transition="scale"]::view-transition-image-pair(root) {
        isolation: auto;
    }

    /* ============================================================
     * Catchy — Dynamic Modal Styles
     * ============================================================ */
    .catchy-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1050;
        background-color: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s ease;
    }
    .catchy-modal-backdrop.show {
        opacity: 1;
    }
    .catchy-modal-container {
        background: #fff;
        border-radius: 12px;
        width: 90%;
        max-width: 550px;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
        transform: scale(0.95);
        transition: transform 0.2s ease;
        display: flex;
        flex-direction: column;
        max-height: 90vh;
        overflow: hidden;
    }
    .catchy-modal-backdrop.show .catchy-modal-container {
        transform: scale(1);
    }
    .catchy-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #f3f4f6;
    }
    .catchy-modal-title {
        font-weight: 600;
        font-size: 1.125rem;
        color: #111827;
    }
    .catchy-modal-close {
        background: transparent;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        padding: 4px;
        border-radius: 9999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s, color 0.2s;
    }
    .catchy-modal-close:hover {
        background-color: #f3f4f6;
        color: #4b5563;
    }
    .catchy-modal-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
    }
</style>

<script>
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
    ], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) !!};
</script>

@if($usePublished)
    <script src="{{ asset('vendor/catchy/catchy.js') }}?v={{ filemtime(public_path('vendor/catchy/catchy.js')) }}" defer></script>
@else
    <script>
        {!! $js !!}
    </script>
@endif
