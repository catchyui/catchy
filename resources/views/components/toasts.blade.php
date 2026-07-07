<div x-data="{
    toasts: [],
    addToast(message, type = 'success') {
        if (!message) return;
        const id = Date.now() + Math.random();
        this.toasts.push({ id, message, type });
        setTimeout(() => this.removeToast(id), 4000);
    },
    removeToast(id) {
        this.toasts = this.toasts.filter(t => t.id !== id);
    }
}"
x-on:catchy-flash.window="addToast($event.detail.message, $event.detail.type)"
x-on:catchy\:flash.window="addToast($event.detail.message, $event.detail.type)"
class="fixed bottom-5 left-5 z-[9999] flex flex-col gap-3 w-80 max-w-full pointer-events-none"
x-cloak>
    <template x-for="toast in toasts" :key="toast.id">
        <div x-transition:enter="transition ease-out duration-300 transform"
             x-transition:enter-start="opacity-0 translate-y-2 translate-x-[-10px]"
             x-transition:enter-end="opacity-100 translate-y-0 translate-x-0"
             x-transition:leave="transition ease-in duration-200"
             x-transition:leave-start="opacity-100 scale-100"
             x-transition:leave-end="opacity-0 scale-90"
             class="pointer-events-auto p-4 rounded-xl border shadow-lg flex items-center justify-between gap-3 text-xs font-semibold leading-relaxed transition-all duration-200"
             :class="{
                 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-400': toast.type === 'success',
                 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-400': toast.type === 'error' || toast.type === 'danger',
                 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-400': toast.type === 'warning',
                 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/80 text-blue-800 dark:text-blue-400': toast.type === 'info' || toast.type === 'status'
             }">
             
             <div class="flex items-center gap-2">
                 <span class="h-2 w-2 rounded-full animate-pulse"
                       :class="{
                           'bg-emerald-500': toast.type === 'success',
                           'bg-rose-500': toast.type === 'error' || toast.type === 'danger',
                           'bg-amber-500': toast.type === 'warning',
                           'bg-blue-500': toast.type === 'info' || toast.type === 'status'
                       }"></span>
                 <span x-text="toast.message"></span>
             </div>
             
             <button @click="removeToast(toast.id)" class="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200">
                 <x-catchy-svg-close class="w-3.5 h-3.5" />
             </button>
        </div>
    </template>
</div>
