import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly _items = signal<Toast[]>([]);
  readonly items = this._items.asReadonly();

  push(kind: ToastKind, message: string, ttlMs = 4500): number {
    const id = this.nextId++;
    this._items.update((list) => [...list, { id, kind, message }]);
    if (ttlMs > 0) {
      setTimeout(() => this.dismiss(id), ttlMs);
    }
    return id;
  }

  success(message: string, ttlMs?: number): number {
    return this.push('success', message, ttlMs);
  }
  error(message: string, ttlMs?: number): number {
    return this.push('error', message, ttlMs ?? 6500);
  }
  info(message: string, ttlMs?: number): number {
    return this.push('info', message, ttlMs);
  }

  dismiss(id: number): void {
    this._items.update((list) => list.filter((t) => t.id !== id));
  }
}
