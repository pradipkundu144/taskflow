import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  OPERATIONAL_ROLES,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
  type OperationalRole,
} from '@taskflow/shared';
import { AuthStore } from '../../core/auth/auth.store';
import { homeForRole } from '../../core/auth/auth.guard';
import { extractIssues, toErrorMessage } from '../../core/http/error-message';
import { Spinner } from '../../core/ui/spinner.component';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.page.html',
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);

  readonly roles = OPERATIONAL_ROLES;
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly serverIssues = signal<Record<string, string>>({});

  readonly form = this.fb.nonNullable.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(USERNAME_MIN_LENGTH),
        Validators.maxLength(USERNAME_MAX_LENGTH),
        Validators.pattern(USERNAME_PATTERN),
      ],
    ],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)],
    ],
    role: ['employee' as OperationalRole, [Validators.required]],
  });

  async submit(): Promise<void> {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.serverError.set(null);
    this.serverIssues.set({});
    this.submitting.set(true);
    try {
      await this.store.register(this.form.getRawValue());
      await this.router.navigateByUrl(homeForRole(this.store.role()));
    } catch (err) {
      this.serverError.set(toErrorMessage(err, 'unable to create account'));
      this.serverIssues.set(extractIssues(err));
    } finally {
      this.submitting.set(false);
    }
  }

  hasClientError(field: 'username' | 'email' | 'password' | 'role'): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.touched || c.dirty);
  }

  serverIssueFor(field: string): string | null {
    return this.serverIssues()[field] ?? null;
  }
}
