import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Dialog } from '../../core/ui/dialog.component';

@Component({
  selector: 'app-confirm-dialog',
  imports: [Dialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog labelledBy="confirm-dialog-title" (closed)="cancelled.emit()">
      <div class="p-6">
        <h3 id="confirm-dialog-title" class="text-base font-semibold text-slate-50">{{ title() }}</h3>
        <p class="mt-2 text-sm text-slate-400">{{ message() }}</p>
        <div class="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            class="rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-60"
            (click)="cancelled.emit()"
            [disabled]="busy()"
          >
            {{ cancelLabel() }}
          </button>
          <button
            type="button"
            class="rounded-md bg-rose-500 px-3 py-1.5 text-sm font-semibold text-slate-50 shadow-lg shadow-rose-500/25 transition hover:bg-rose-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-60"
            (click)="confirmed.emit()"
            [disabled]="busy()"
          >
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </app-dialog>
  `,
})
export class ConfirmDialog {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Delete');
  readonly cancelLabel = input('Cancel');
  readonly busy = input(false);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
