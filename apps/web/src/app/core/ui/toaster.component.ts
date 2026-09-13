import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, type ToastKind } from './toast.service';

const KIND_CLASSES: Record<ToastKind, string> = {
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  error: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
  info: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
};

@Component({
  selector: 'app-toaster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4"
      aria-live="polite"
      aria-atomic="false"
    >
      @for (t of toasts.items(); track t.id) {
        <div
          class="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-md border px-3 py-2 text-sm shadow-2xl shadow-black/40 backdrop-blur-xl"
          [class]="kindClasses(t.kind)"
          [attr.role]="t.kind === 'error' ? 'alert' : 'status'"
        >
          <span class="mt-0.5 shrink-0" [innerHTML]="icon(t.kind)" aria-hidden="true"></span>
          <div class="flex-1 leading-snug">{{ t.message }}</div>
          <button
            type="button"
            class="shrink-0 rounded p-1 text-current opacity-70 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50"
            (click)="toasts.dismiss(t.id)"
            aria-label="Dismiss notification"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M4.28 3.22a.75.75 0 011.06 0L10 7.88l4.66-4.66a.75.75 0 111.06 1.06L11.06 8.94l4.66 4.66a.75.75 0 11-1.06 1.06L10 10l-4.66 4.66a.75.75 0 01-1.06-1.06L8.94 8.94 4.28 4.28a.75.75 0 010-1.06z"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class Toaster {
  readonly toasts = inject(ToastService);

  kindClasses(kind: ToastKind): string {
    return KIND_CLASSES[kind];
  }

  icon(kind: ToastKind): string {
    if (kind === 'success') {
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clip-rule="evenodd"/></svg>`;
    }
    if (kind === 'error') {
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm.9 4.6a.9.9 0 10-1.8 0v4.8a.9.9 0 001.8 0V6.6zM10 14.4a1.1 1.1 0 100-2.2 1.1 1.1 0 000 2.2z" clip-rule="evenodd"/></svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10A8 8 0 11.9 10a8 8 0 0117.1 0zM9 6a1 1 0 112 0 1 1 0 01-2 0zm.3 3.3a.9.9 0 011.4.6v4.2a.9.9 0 01-1.8 0V9.9a.9.9 0 01.4-.6z" clip-rule="evenodd"/></svg>`;
  }
}
