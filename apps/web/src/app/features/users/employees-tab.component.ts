import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AuthUser } from '@taskflow/shared';
import { Spinner } from '../../core/ui/spinner.component';
import { ToastService } from '../../core/ui/toast.service';
import { toErrorMessage } from '../../core/http/error-message';
import { UsersStore } from './users.store';

@Component({
  selector: 'app-employees-tab',
  imports: [FormsModule, Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employees-tab.component.html',
})
export class EmployeesTab implements OnInit {
  private readonly store = inject(UsersStore);
  private readonly toast = inject(ToastService);

  readonly loading = this.store.loading;
  readonly loaded = this.store.loaded;
  readonly teamLeads = this.store.teamLeads;
  readonly employees = this.store.employees;

  readonly search = signal('');
  readonly tlFilter = signal<string>('all');
  readonly onlyUnassigned = signal(false);
  readonly savingIds = signal<Set<string>>(new Set());

  readonly teamLeadIndex = computed(() => {
    const map = new Map<string, AuthUser>();
    for (const t of this.teamLeads()) map.set(t.id, t);
    return map;
  });

  readonly rows = computed(() => {
    const needle = this.search().trim().toLowerCase();
    const tlFilter = this.tlFilter();
    const onlyU = this.onlyUnassigned();
    return this.employees()
      .filter((e) => (onlyU ? !e.teamLead : true))
      .filter((e) => (tlFilter === 'all' ? true : tlFilter === '__none__' ? !e.teamLead : e.teamLead === tlFilter))
      .filter((e) => !needle || e.username.toLowerCase().includes(needle) || e.email.toLowerCase().includes(needle));
  });

  readonly totalCount = computed(() => this.employees().length);
  readonly unassignedCount = computed(() => this.employees().filter((u) => !u.teamLead).length);

  async ngOnInit(): Promise<void> {
    if (!this.loaded()) {
      try {
        await this.store.load();
      } catch (err) {
        this.toast.error(toErrorMessage(err, 'Unable to load users'));
      }
    }
  }

  onSearchInput(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.search.set('');
  }

  onTLFilterChange(event: Event): void {
    this.tlFilter.set((event.target as HTMLSelectElement).value);
  }

  toggleUnassigned(event: Event): void {
    this.onlyUnassigned.set((event.target as HTMLInputElement).checked);
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

  async onTeamLeadChange(emp: AuthUser, event: Event): Promise<void> {
    const value = (event.target as HTMLSelectElement).value;
    const teamLeadId = value === '' ? null : value;
    this.setSaving(emp.id, true);
    try {
      await this.store.assignTeamLead(emp.id, teamLeadId);
      this.toast.success(
        teamLeadId ? `${emp.username} assigned to a team lead` : `${emp.username} unassigned`,
      );
    } catch (err) {
      this.toast.error(toErrorMessage(err, 'Unable to update assignment'));
    } finally {
      this.setSaving(emp.id, false);
    }
  }
}
