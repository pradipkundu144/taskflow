import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AuthUser } from '@taskflow/shared';
import { Spinner } from '../../core/ui/spinner.component';
import { ToastService } from '../../core/ui/toast.service';
import { toErrorMessage } from '../../core/http/error-message';
import { UsersStore } from './users.store';

@Component({
  selector: 'app-users',
  imports: [FormsModule, Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.page.html',
})
export class UsersPage implements OnInit {
  private readonly store = inject(UsersStore);
  private readonly toast = inject(ToastService);

  readonly loading = this.store.loading;
  readonly loaded = this.store.loaded;
  readonly managers = this.store.managers;
  readonly teamLeads = this.store.teamLeads;
  readonly employees = this.store.employees;
  readonly search = this.store.search;

  readonly totalCount = this.store.totalCount;
  readonly unassignedCount = this.store.unassignedCount;
  readonly unassignedTLs = this.store.filteredUnassignedTeamLeads;
  readonly unassignedEmps = this.store.filteredUnassignedEmployees;
  readonly hierarchy = this.store.filteredHierarchy;

  readonly savingIds = signal<Set<string>>(new Set());
  readonly collapsed = signal<Set<string>>(new Set());

  readonly hasNeedsAttention = computed(
    () => this.unassignedTLs().length + this.unassignedEmps().length > 0,
  );
  readonly hasResults = computed(
    () => this.hierarchy().length > 0 || this.hasNeedsAttention(),
  );

  async ngOnInit(): Promise<void> {
    try {
      await this.store.load();
    } catch (err) {
      this.toast.error(toErrorMessage(err, 'Unable to load users'));
    }
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.store.setSearch(value);
  }

  clearSearch(): void {
    this.store.setSearch('');
  }

  isCollapsed(managerId: string): boolean {
    return this.collapsed().has(managerId);
  }

  toggleCollapse(managerId: string): void {
    this.collapsed.update((s) => {
      const next = new Set(s);
      if (next.has(managerId)) next.delete(managerId);
      else next.add(managerId);
      return next;
    });
  }

  isSaving(id: string): boolean {
    return this.savingIds().has(id);
  }

  private setSaving(id: string, on: boolean): void {
    this.savingIds.update((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async onManagerChange(u: AuthUser, event: Event): Promise<void> {
    const value = (event.target as HTMLSelectElement).value;
    const managerId = value === '' ? null : value;
    this.setSaving(u.id, true);
    try {
      await this.store.assignManager(u.id, managerId);
      this.toast.success(
        managerId ? `${u.username} assigned to a manager` : `${u.username} unassigned`,
      );
    } catch (err) {
      this.toast.error(toErrorMessage(err, 'Unable to update assignment'));
    } finally {
      this.setSaving(u.id, false);
    }
  }

  async onTeamLeadChange(u: AuthUser, event: Event): Promise<void> {
    const value = (event.target as HTMLSelectElement).value;
    const teamLeadId = value === '' ? null : value;
    this.setSaving(u.id, true);
    try {
      await this.store.assignTeamLead(u.id, teamLeadId);
      this.toast.success(
        teamLeadId ? `${u.username} assigned to a team lead` : `${u.username} unassigned`,
      );
    } catch (err) {
      this.toast.error(toErrorMessage(err, 'Unable to update assignment'));
    } finally {
      this.setSaving(u.id, false);
    }
  }
}
