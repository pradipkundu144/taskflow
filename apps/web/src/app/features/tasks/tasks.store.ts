import { HttpClient } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import {
  API_PATHS,
  type AuthUser,
  type CreateTaskRequest,
  type Task,
  type TaskListFilter,
  type TaskStatus,
  type UpdateTaskRequest,
} from '@taskflow/shared';

type TasksState = {
  items: Task[];
  loading: boolean;
  loaded: boolean;
  filter: TaskListFilter;
  assignable: AuthUser[];
};

const initialState: TasksState = {
  items: [],
  loading: false,
  loaded: false,
  filter: {},
  assignable: [],
};

export const TasksStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((s) => ({
    counts: computed(() => {
      const items = s.items();
      const pending = items.filter((t) => t.status === 'pending').length;
      const completed = items.filter((t) => t.status === 'completed').length;
      return { all: items.length, pending, completed };
    }),
    filteredItems: computed(() => {
      const f = s.filter();
      let list = s.items();
      if (f.status) list = list.filter((t) => t.status === f.status);
      if (f.assignedTo) list = list.filter((t) => t.assignedTo === f.assignedTo);
      if (f.createdBy) list = list.filter((t) => t.createdBy === f.createdBy);
      return list;
    }),
    assignableIndex: computed(() => {
      const map = new Map<string, AuthUser>();
      for (const u of s.assignable()) map.set(u.id, u);
      return map;
    }),
  })),
  withMethods((store) => {
    const http = inject(HttpClient);

    return {
      async load(): Promise<void> {
        patchState(store, { loading: true });
        try {
          const items = await firstValueFrom(
            http.get<Task[]>(API_PATHS.tasks.list),
          );
          patchState(store, { items, loaded: true });
        } finally {
          patchState(store, { loading: false });
        }
      },

      async loadAssignable(): Promise<void> {
        const users = await firstValueFrom(
          http.get<AuthUser[]>(API_PATHS.users.assignable),
        );
        patchState(store, { assignable: users });
      },

      setStatusFilter(status?: TaskStatus): void {
        patchState(store, { filter: { ...store.filter(), status } });
      },

      setAssigneeFilter(assignedTo?: string): void {
        patchState(store, { filter: { ...store.filter(), assignedTo } });
      },

      async create(input: CreateTaskRequest): Promise<Task> {
        const created = await firstValueFrom(
          http.post<Task>(API_PATHS.tasks.create, input),
        );
        this.mergeOrInsert(created);
        return created;
      },

      async update(id: string, patch: UpdateTaskRequest): Promise<Task> {
        const updated = await firstValueFrom(
          http.patch<Task>(API_PATHS.tasks.update(id), patch),
        );
        this.mergeOrInsert(updated);
        return updated;
      },

      async remove(id: string): Promise<void> {
        await firstValueFrom(http.delete<void>(API_PATHS.tasks.remove(id)));
        patchState(store, { items: store.items().filter((t) => t.id !== id) });
      },

      mergeOrInsert(t: Task): void {
        const items = store.items();
        const idx = items.findIndex((x) => x.id === t.id);
        if (idx >= 0) {
          const next = items.slice();
          next[idx] = t;
          patchState(store, { items: next });
        } else {
          patchState(store, { items: [t, ...items] });
        }
      },

      removeById(id: string): void {
        patchState(store, { items: store.items().filter((t) => t.id !== id) });
      },

      clear(): void {
        patchState(store, initialState);
      },
    };
  }),
);
