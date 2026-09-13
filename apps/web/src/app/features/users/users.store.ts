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
import { API_PATHS, type AuthUser } from '@taskflow/shared';

export interface HierarchyTeamLeadNode {
  teamLead: AuthUser;
  employees: AuthUser[];
}

export interface HierarchyManagerNode {
  manager: AuthUser;
  teamLeads: HierarchyTeamLeadNode[];
  employeeCount: number;
}

type UsersState = {
  managers: AuthUser[];
  teamLeads: AuthUser[];
  employees: AuthUser[];
  loading: boolean;
  loaded: boolean;
  search: string;
};

const initialState: UsersState = {
  managers: [],
  teamLeads: [],
  employees: [],
  loading: false,
  loaded: false,
  search: '',
};

function matches(user: AuthUser, needle: string): boolean {
  if (!needle) return true;
  const n = needle.toLowerCase();
  return (
    user.username.toLowerCase().includes(n) ||
    user.email.toLowerCase().includes(n)
  );
}

export const UsersStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((s) => {
    const unassignedTeamLeads = computed(() =>
      s.teamLeads().filter((u) => !u.manager),
    );
    const unassignedEmployees = computed(() =>
      s.employees().filter((u) => !u.teamLead),
    );
    const totalCount = computed(
      () => s.managers().length + s.teamLeads().length + s.employees().length,
    );
    const unassignedCount = computed(
      () => unassignedTeamLeads().length + unassignedEmployees().length,
    );

    const hierarchy = computed<HierarchyManagerNode[]>(() => {
      const managers = s.managers();
      const teamLeads = s.teamLeads();
      const employees = s.employees();

      const employeesByTeamLead = new Map<string, AuthUser[]>();
      for (const e of employees) {
        if (!e.teamLead) continue;
        const list = employeesByTeamLead.get(e.teamLead) ?? [];
        list.push(e);
        employeesByTeamLead.set(e.teamLead, list);
      }

      return managers.map((manager) => {
        const tls = teamLeads
          .filter((tl) => tl.manager === manager.id)
          .map<HierarchyTeamLeadNode>((tl) => ({
            teamLead: tl,
            employees: employeesByTeamLead.get(tl.id) ?? [],
          }));
        const employeeCount = tls.reduce((n, t) => n + t.employees.length, 0);
        return { manager, teamLeads: tls, employeeCount };
      });
    });

    const filteredHierarchy = computed<HierarchyManagerNode[]>(() => {
      const needle = s.search().trim();
      const tree = hierarchy();
      if (!needle) return tree;
      const out: HierarchyManagerNode[] = [];
      for (const node of tree) {
        const managerHit = matches(node.manager, needle);
        const tlNodes: HierarchyTeamLeadNode[] = [];
        for (const t of node.teamLeads) {
          const tlHit = matches(t.teamLead, needle);
          const empHits = t.employees.filter((e) => matches(e, needle));
          if (tlHit || empHits.length > 0 || managerHit) {
            tlNodes.push({
              teamLead: t.teamLead,
              employees: tlHit || managerHit ? t.employees : empHits,
            });
          }
        }
        if (managerHit || tlNodes.length > 0) {
          out.push({
            manager: node.manager,
            teamLeads: tlNodes,
            employeeCount: tlNodes.reduce((n, t) => n + t.employees.length, 0),
          });
        }
      }
      return out;
    });

    const filteredUnassignedTeamLeads = computed(() => {
      const needle = s.search().trim();
      const list = unassignedTeamLeads();
      return needle ? list.filter((u) => matches(u, needle)) : list;
    });

    const filteredUnassignedEmployees = computed(() => {
      const needle = s.search().trim();
      const list = unassignedEmployees();
      return needle ? list.filter((u) => matches(u, needle)) : list;
    });

    return {
      unassignedTeamLeads,
      unassignedEmployees,
      totalCount,
      unassignedCount,
      hierarchy,
      filteredHierarchy,
      filteredUnassignedTeamLeads,
      filteredUnassignedEmployees,
    };
  }),
  withMethods((store) => {
    const http = inject(HttpClient);

    async function fetchAll(): Promise<void> {
      patchState(store, { loading: true });
      try {
        const [managers, teamLeads, employees] = await Promise.all([
          firstValueFrom(http.get<AuthUser[]>(API_PATHS.admin.listByRole('manager'))),
          firstValueFrom(http.get<AuthUser[]>(API_PATHS.admin.listByRole('teamLead'))),
          firstValueFrom(http.get<AuthUser[]>(API_PATHS.admin.listByRole('employee'))),
        ]);
        patchState(store, { managers, teamLeads, employees, loaded: true });
      } finally {
        patchState(store, { loading: false });
      }
    }

    return {
      load(): Promise<void> {
        return fetchAll();
      },
      setSearch(value: string): void {
        patchState(store, { search: value });
      },
      async assignManager(userId: string, managerId: string | null): Promise<void> {
        const updated = await firstValueFrom(
          http.patch<AuthUser>(API_PATHS.admin.setManager(userId), { managerId }),
        );
        patchState(store, {
          teamLeads: store.teamLeads().map((u) => (u.id === userId ? updated : u)),
        });
      },
      async assignTeamLead(userId: string, teamLeadId: string | null): Promise<void> {
        const updated = await firstValueFrom(
          http.patch<AuthUser>(API_PATHS.admin.setTeamLead(userId), { teamLeadId }),
        );
        patchState(store, {
          employees: store.employees().map((u) => (u.id === userId ? updated : u)),
        });
      },
      clear(): void {
        patchState(store, initialState);
      },
    };
  }),
);
