import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { homeForRole } from '../../core/auth/auth.guard';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12 text-center">
      <div class="rounded-full border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 shadow-lg shadow-rose-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm-.75 5a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0V7zM10 14.5a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
        </svg>
      </div>
      <p class="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">403</p>
      <h1 class="mt-1 text-2xl font-semibold text-slate-50">Not allowed</h1>
      <p class="mt-2 text-sm text-slate-400">Your role does not have access to this page.</p>
      <a
        [routerLink]="backHref()"
        class="mt-6 inline-flex items-center rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        Back to app
      </a>
    </div>
  `,
})
export class ForbiddenPage {
  private readonly auth = inject(AuthStore);
  readonly backHref = computed(() =>
    this.auth.isAuthenticated() ? homeForRole(this.auth.role()) : '/login',
  );
}
