import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-8 backdrop-blur-sm"
      role="presentation"
      (click)="onBackdrop($event)"
    >
      <div
        #panel
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="labelledBy()"
        class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/85 shadow-2xl shadow-black/50 backdrop-blur-xl"
        tabindex="-1"
        (click)="$event.stopPropagation()"
      >
        <ng-content />
      </div>
    </div>
  `,
})
export class Dialog implements AfterViewInit, OnDestroy {
  readonly labelledBy = input<string | null>(null);
  readonly dismissOnBackdrop = input(true);
  readonly close = output<void>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private previousActive: Element | null = null;

  ngAfterViewInit(): void {
    this.previousActive = document.activeElement;
    queueMicrotask(() => this.focusFirst());
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    if (this.previousActive instanceof HTMLElement) {
      this.previousActive.focus();
    }
  }

  onBackdrop(event: MouseEvent): void {
    if (!this.dismissOnBackdrop()) return;
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const panel = this.panel().nativeElement;
    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey) {
      if (active === first || !panel.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  private focusFirst(): void {
    const panel = this.panel().nativeElement;
    const target = panel.querySelector<HTMLElement>(
      'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    (target ?? panel).focus();
  }
}
