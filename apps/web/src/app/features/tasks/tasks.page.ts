import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import type { Task, TaskStatus } from '@taskflow/shared';
import { AuthStore } from '../../core/auth/auth.store';
import { Spinner } from '../../core/ui/spinner.component';
import { ToastService } from '../../core/ui/toast.service';
import { toErrorMessage } from '../../core/http/error-message';
import { ConfirmDialog } from './confirm-dialog.component';
import { TaskForm } from './task-form.component';
import { TasksStore } from './tasks.store';

@Component({
  selector: 'app-tasks',
  imports: [Spinner, TaskForm, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tasks.page.html',
})
export class TasksPage implements OnInit {
  private readonly store = inject(TasksStore);
  private readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastService);

  readonly loading = this.store.loading;
  readonly loaded = this.store.loaded;
  readonly items = this.store.filteredItems;
  readonly filter = this.store.filter;
  readonly counts = this.store.counts;
  readonly assignable = this.store.assignable;
  readonly assignableIndex = this.store.assignableIndex;

  readonly role = this.auth.role;
  readonly currentUserId = computed(() => this.auth.user()?.id ?? null);
  readonly canFilterByAssignee = computed(
    () => this.role() === 'teamLead' || this.role() === 'manager',
  );

  readonly showForm = signal(false);
  readonly editing = signal<Task | null>(null);
  readonly confirmingDelete = signal<Task | null>(null);
  readonly deleting = signal(false);
  readonly togglingId = signal<string | null>(null);
  readonly deleteMessage = computed(() => {
    const t = this.confirmingDelete();
    return t ? `This will permanently delete "${t.title}".` : '';
  });

  async ngOnInit(): Promise<void> {
    try {
      await Promise.all([this.store.load(), this.store.loadAssignable()]);
    } catch (err) {
      this.toast.error(toErrorMessage(err, 'unable to load tasks'));
    }
  }

  openNew(): void {
    this.editing.set(null);
    this.showForm.set(true);
  }

  openEdit(t: Task): void {
    this.editing.set(t);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  onSaved(t: Task): void {
    this.closeForm();
    this.toast.success(this.editing() ? 'task updated' : `task created`);
  }

  askDelete(t: Task): void {
    this.confirmingDelete.set(t);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.confirmingDelete.set(null);
  }

  async confirmDelete(): Promise<void> {
    const t = this.confirmingDelete();
    if (!t || this.deleting()) return;
    this.deleting.set(true);
    try {
      await this.store.remove(t.id);
      this.toast.success('task deleted');
      this.confirmingDelete.set(null);
    } catch (err) {
      this.toast.error(toErrorMessage(err, 'unable to delete task'));
    } finally {
      this.deleting.set(false);
    }
  }

  async toggleStatus(t: Task): Promise<void> {
    if (this.togglingId()) return;
    const next: TaskStatus = t.status === 'pending' ? 'completed' : 'pending';
    this.togglingId.set(t.id);
    try {
      await this.store.update(t.id, { status: next });
    } catch (err) {
      this.toast.error(toErrorMessage(err, 'unable to update status'));
    } finally {
      this.togglingId.set(null);
    }
  }

  setStatusFilter(status?: TaskStatus): void {
    this.store.setStatusFilter(status);
  }

  setAssigneeFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.store.setAssigneeFilter(value === '' ? undefined : value);
  }

  assigneeName(id: string): string {
    const u = this.assignableIndex().get(id);
    if (u) return u.username;
    if (id === this.currentUserId()) return this.auth.user()?.username ?? 'you';
    return 'someone';
  }

  isMine(t: Task): boolean {
    return t.assignedTo === this.currentUserId() || t.createdBy === this.currentUserId();
  }

  formatDate(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
