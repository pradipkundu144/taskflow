import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TASK_PRIORITIES,
  TASK_TITLE_MAX_LENGTH,
  TASK_DESCRIPTION_MAX_LENGTH,
  type Task,
  type TaskPriority,
} from '@taskflow/shared';
import { AuthStore } from '../../core/auth/auth.store';
import { Dialog } from '../../core/ui/dialog.component';
import { Spinner } from '../../core/ui/spinner.component';
import { toErrorMessage, extractIssues } from '../../core/http/error-message';
import { TasksStore } from './tasks.store';

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule, Spinner, Dialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-form.component.html',
})
export class TaskForm {
  readonly editing = input<Task | null>(null);
  readonly closed = output<void>();
  readonly saved = output<Task>();

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(TasksStore);
  private readonly auth = inject(AuthStore);

  readonly priorities = TASK_PRIORITIES;
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly serverIssues = signal<Record<string, string>>({});

  readonly assignable = this.store.assignable;
  readonly canPickAssignee = computed(() => this.auth.role() !== 'employee');
  readonly titleMax = TASK_TITLE_MAX_LENGTH;
  readonly descriptionMax = TASK_DESCRIPTION_MAX_LENGTH;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(TASK_TITLE_MAX_LENGTH)]],
    description: ['', [Validators.maxLength(TASK_DESCRIPTION_MAX_LENGTH)]],
    priority: ['medium' as TaskPriority, [Validators.required]],
    dueDate: [''],
    assignedTo: [''],
  });

  constructor() {
    effect(() => {
      const t = this.editing();
      const self = this.auth.user();
      if (t) {
        this.form.setValue({
          title: t.title,
          description: t.description ?? '',
          priority: t.priority,
          dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '',
          assignedTo: t.assignedTo,
        });
      } else {
        this.form.reset({
          title: '',
          description: '',
          priority: 'medium',
          dueDate: '',
          assignedTo: self?.id ?? '',
        });
      }
      this.serverError.set(null);
      this.serverIssues.set({});
    });
  }

  hasClientError(field: 'title' | 'description' | 'priority' | 'dueDate' | 'assignedTo'): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.touched || c.dirty);
  }

  serverIssueFor(field: string): string | null {
    return this.serverIssues()[field] ?? null;
  }

  async submit(): Promise<void> {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.serverError.set(null);
    this.serverIssues.set({});
    this.submitting.set(true);
    const v = this.form.getRawValue();
    try {
      const editing = this.editing();
      let task: Task;
      if (editing) {
        task = await this.store.update(editing.id, {
          title: v.title,
          description: v.description,
          priority: v.priority,
          dueDate: v.dueDate ? v.dueDate : null,
          assignedTo: v.assignedTo || undefined,
        });
      } else {
        task = await this.store.create({
          title: v.title,
          description: v.description,
          priority: v.priority,
          dueDate: v.dueDate || undefined,
          assignedTo: v.assignedTo || undefined,
        });
      }
      this.saved.emit(task);
    } catch (err) {
      this.serverError.set(toErrorMessage(err, 'unable to save task'));
      this.serverIssues.set(extractIssues(err));
    } finally {
      this.submitting.set(false);
    }
  }

  cancel(): void {
    if (this.submitting()) return;
    this.closed.emit();
  }
}
