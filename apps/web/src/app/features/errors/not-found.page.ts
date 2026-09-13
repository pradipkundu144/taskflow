import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { homeForRole } from '../../core/auth/auth.guard';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12 text-center">
      <div class="rounded-full border border-white/10 bg-white/[0.04] p-3 text-slate-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.08 3.08a1 1 0 01-1.42 1.42l-3.08-3.08A7 7 0 012 9z" clip-rule="evenodd"/>
        </svg>
      </div>
      <p class="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">404</p>
      <h1 class="mt-1 text-2xl font-semibold text-slate-50">Page not found</h1>
      <p class="mt-2 text-sm text-slate-400">The page you were looking for doesn't exist.</p>
      <a
        [routerLink]="backHref()"
        class="mt-6 inline-flex items-center rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        Back to app
      </a>
    </div>
  `,
})
export class NotFoundPage {
  private readonly auth = inject(AuthStore);
  readonly backHref = computed(() =>
    this.auth.isAuthenticated() ? homeForRole(this.auth.role()) : '/login',
  );
}
