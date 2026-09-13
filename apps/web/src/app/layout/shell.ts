import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../core/auth/auth.store';
import { homeForRole } from '../core/auth/auth.guard';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
})
export class Shell {
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);

  readonly user = this.store.user;
  readonly role = this.store.role;
  readonly home = computed(() => homeForRole(this.role()));
  readonly showTasks = computed(() => this.role() !== 'admin');
  readonly showUsers = computed(() => this.role() === 'admin');
  readonly loggingOut = signal(false);
  readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  async logout(): Promise<void> {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    try {
      await this.store.logout();
      await this.router.navigateByUrl('/login');
    } finally {
      this.loggingOut.set(false);
      this.menuOpen.set(false);
    }
  }
}
