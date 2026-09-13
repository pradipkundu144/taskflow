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
  type LoginRequest,
  type LoginResponse,
  type RefreshResponse,
  type RegisterRequest,
} from '@taskflow/shared';

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  hydrating: boolean;
};

const initialState: AuthState = {
  accessToken: null,
  user: null,
  hydrating: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((s) => ({
    isAuthenticated: computed(() => s.accessToken() !== null),
    role: computed(() => s.user()?.role ?? null),
  })),
  withMethods((store) => {
    const http = inject(HttpClient);

    function setSession(res: LoginResponse | RefreshResponse): void {
      patchState(store, { accessToken: res.accessToken, user: res.user });
    }

    return {
      async login(input: LoginRequest): Promise<void> {
        const res = await firstValueFrom(
          http.post<LoginResponse>(API_PATHS.auth.login, input),
        );
        setSession(res);
      },
      async register(input: RegisterRequest): Promise<void> {
        const res = await firstValueFrom(
          http.post<LoginResponse>(API_PATHS.auth.register, input),
        );
        setSession(res);
      },
      async logout(): Promise<void> {
        try {
          await firstValueFrom(http.post(API_PATHS.auth.logout, {}));
        } finally {
          patchState(store, { accessToken: null, user: null });
        }
      },
      async hydrate(): Promise<void> {
        patchState(store, { hydrating: true });
        try {
          const res = await firstValueFrom(
            http.post<RefreshResponse>(API_PATHS.auth.refresh, {}),
          );
          setSession(res);
        } catch {
          patchState(store, { accessToken: null, user: null });
        } finally {
          patchState(store, { hydrating: false });
        }
      },
      applyRefresh(res: RefreshResponse): void {
        setSession(res);
      },
      clear(): void {
        patchState(store, { accessToken: null, user: null });
      },
    };
  }),
);
