import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PASSWORD_MIN_LENGTH } from '@taskflow/shared';
import { AuthStore } from '../../core/auth/auth.store';
import { homeForRole } from '../../core/auth/auth.guard';
import { toErrorMessage } from '../../core/http/error-message';
import { Spinner } from '../../core/ui/spinner.component';
import { DEMO_ADMIN } from './admin-demo';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
  });

  async submit(): Promise<void> {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.serverError.set(null);
    this.submitting.set(true);
    try {
      await this.store.login(this.form.getRawValue());
      await this.router.navigateByUrl(homeForRole(this.store.role()));
    } catch (err) {
      this.serverError.set(toErrorMessage(err, 'unable to sign in'));
    } finally {
      this.submitting.set(false);
    }
  }

  useAdminDemo(): void {
    this.form.setValue({ email: DEMO_ADMIN.email, password: DEMO_ADMIN.password });
    this.serverError.set(null);
  }

  hasError(field: 'email' | 'password'): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.touched || c.dirty);
  }
}
