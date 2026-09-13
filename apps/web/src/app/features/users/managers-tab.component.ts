import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Spinner } from '../../core/ui/spinner.component';
import { ToastService } from '../../core/ui/toast.service';
import { toErrorMessage } from '../../core/http/error-message';
import { UsersStore } from './users.store';

type SortMode = 'name' | 'team';

@Component({
  selector: 'app-managers-tab',
  imports: [Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './managers-tab.component.html',
})
export class ManagersTab implements OnInit {
  private readonly store = inject(UsersStore);
  private readonly toast = inject(ToastService);

  readonly loading = this.store.loading;
  readonly loaded = this.store.loaded;
  readonly hierarchy = this.store.hierarchy;

  readonly search = signal('');
  readonly sort = signal<SortMode>('team');
  readonly expanded = signal<Set<string>>(new Set());

  readonly rows = computed(() => {
    const needle = this.search().trim().toLowerCase();
    const list = this.hierarchy().slice();
    if (needle) {
      const filtered = list.filter((n) =>
        n.manager.username.toLowerCase().includes(needle) ||
        n.manager.email.toLowerCase().includes(needle) ||
        n.teamLeads.some((t) => t.teamLead.username.toLowerCase().includes(needle) || t.teamLead.email.toLowerCase().includes(needle)),
      );
      return this.applySort(filtered);
    }
    return this.applySort(list);
  });

  readonly totalManagers = computed(() => this.hierarchy().length);

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

  setSort(mode: SortMode): void {
    this.sort.set(mode);
  }

  clearSearch(): void {
    this.search.set('');
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

  private applySort(list: typeof this.hierarchy extends () => infer T ? T : never): typeof list {
    const arr = [...list];
    if (this.sort() === 'name') {
      arr.sort((a, b) => a.manager.username.localeCompare(b.manager.username));
    } else {
      arr.sort((a, b) => {
        const scoreA = a.teamLeads.length * 100 + a.employeeCount;
        const scoreB = b.teamLeads.length * 100 + b.employeeCount;
        return scoreB - scoreA;
      });
    }
    return arr;
  }
}
