import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-team-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <nav
        aria-label="Team sections"
        class="flex overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-1 backdrop-blur-md"
      >
        <a
          routerLink="/team"
          [routerLinkActiveOptions]="{ exact: true }"
          routerLinkActive="bg-cyan-400/15 text-cyan-100 ring-1 ring-inset ring-cyan-400/30"
          class="rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-slate-300 hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          Overview
        </a>
        <a
          routerLink="/team/managers"
          routerLinkActive="bg-cyan-400/15 text-cyan-100 ring-1 ring-inset ring-cyan-400/30"
          class="ml-1 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-slate-300 hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          Managers
        </a>
        <a
          routerLink="/team/team-leads"
          routerLinkActive="bg-cyan-400/15 text-cyan-100 ring-1 ring-inset ring-cyan-400/30"
          class="ml-1 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-slate-300 hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          Team leads
        </a>
        <a
          routerLink="/team/employees"
          routerLinkActive="bg-cyan-400/15 text-cyan-100 ring-1 ring-inset ring-cyan-400/30"
          class="ml-1 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-slate-300 hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          Employees
        </a>
      </nav>
      <router-outlet></router-outlet>
    </div>
  `,
})
export class TeamShell {}
