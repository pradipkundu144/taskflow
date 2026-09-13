import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AuthUser } from '@taskflow/shared';
import { Spinner } from '../../core/ui/spinner.component';
import { ToastService } from '../../core/ui/toast.service';
import { toErrorMessage } from '../../core/http/error-message';
import { UsersStore } from './users.store';

@Component({
  selector: 'app-team-leads-tab',
  imports: [FormsModule, Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-leads-tab.component.html',
})
export class TeamLeadsTab implements OnInit {
  private readonly store = inject(UsersStore);
  private readonly toast = inject(ToastService);

  readonly loading = this.store.loading;
  readonly loaded = this.store.loaded;
  readonly managers = this.store.managers;
  readonly teamLeads = this.store.teamLeads;
  readonly employees = this.store.employees;

  readonly search = signal('');
  readonly managerFilter = signal<string>('all');
  readonly onlyUnassigned = signal(false);
  readonly expanded = signal<Set<string>>(new Set());
  readonly savingIds = signal<Set<string>>(new Set());

  private readonly employeesByTL = computed(() => {
    const map = new Map<string, AuthUser[]>();
    for (const e of this.employees()) {
      if (!e.teamLead) continue;
      const list = map.get(e.teamLead) ?? [];
      list.push(e);
      map.set(e.teamLead, list);
    }
    return map;
  });

  readonly managerIndex = computed(() => {
    const map = new Map<string, AuthUser>();
    for (const m of this.managers()) map.set(m.id, m);
    return map;
  });

  readonly rows = computed(() => {
    const needle = this.search().trim().toLowerCase();
    const mgrFilter = this.managerFilter();
    const onlyU = this.onlyUnassigned();
    const empMap = this.employeesByTL();
    return this.teamLeads()
      .filter((tl) => (onlyU ? !tl.manager : true))
      .filter((tl) => (mgrFilter === 'all' ? true : mgrFilter === '__none__' ? !tl.manager : tl.manager === mgrFilter))
      .filter((tl) => !needle || tl.username.toLowerCase().includes(needle) || tl.email.toLowerCase().includes(needle))
      .map((tl) => ({ teamLead: tl, employees: empMap.get(tl.id) ?? [] }));
  });

  readonly totalCount = computed(() => this.teamLeads().length);
  readonly unassignedCount = computed(() => this.teamLeads().filter((u) => !u.manager).length);

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

  onManagerFilterChange(event: Event): void {
    this.managerFilter.set((event.target as HTMLSelectElement).value);
  }

  toggleUnassigned(event: Event): void {
    this.onlyUnassigned.set((event.target as HTMLInputElement).checked);
  }

  isExpanded(id: string): boolean {
    return this.expanded().has(id);
  }

  toggle(id: string): void {
    this.expanded.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  async onManagerChange(tl: AuthUser, event: Event): Promise<void> {
    const value = (event.target as HTMLSelectElement).value;
    const managerId = value === '' ? null : value;
    this.setSaving(tl.id, true);
    try {
      await this.store.assignManager(tl.id, managerId);
      this.toast.success(
        managerId ? `${tl.username} assigned to a manager` : `${tl.username} unassigned`,
      );
    } catch (err) {
      this.toast.error(toErrorMessage(err, 'Unable to update assignment'));
    } finally {
      this.setSaving(tl.id, false);
    }
  }
}
