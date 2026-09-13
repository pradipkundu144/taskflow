import { effect, inject, Injectable, untracked } from '@angular/core';
import { io, type Socket } from 'socket.io-client';
import {
  SOCKET_PATH,
  TASK_EVENTS,
  type TaskCreatedEvent,
  type TaskDeletedEvent,
  type TaskUpdatedEvent,
} from '@taskflow/shared';
import { AuthStore } from '../auth/auth.store';
import { TasksStore } from '../../features/tasks/tasks.store';
import { ToastService } from '../ui/toast.service';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly auth = inject(AuthStore);
  private readonly tasks = inject(TasksStore);
  private readonly toast = inject(ToastService);

  private socket: Socket | null = null;
  private currentToken: string | null = null;

  constructor() {
    effect(() => {
      const token = this.auth.accessToken();
      untracked(() => this.reconcile(token));
    });
  }

  private reconcile(token: string | null): void {
    if (!token) {
      this.disconnect();
      return;
    }
    if (this.socket && this.currentToken === token) return;
    this.disconnect();
    this.connect(token);
  }

  private connect(token: string): void {
    this.currentToken = token;
    const socket = io({
      path: SOCKET_PATH,
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 500,
    });

    socket.on(TASK_EVENTS.CREATED, (payload: TaskCreatedEvent) => {
      this.tasks.mergeOrInsert(payload.task);
      this.notifyIfMineByOther(payload.task, 'assigned to you');
    });
    socket.on(TASK_EVENTS.UPDATED, (payload: TaskUpdatedEvent) => {
      this.tasks.mergeOrInsert(payload.task);
      this.notifyIfMineByOther(payload.task, 'updated');
    });
    socket.on(TASK_EVENTS.DELETED, (payload: TaskDeletedEvent) => {
      this.tasks.removeById(payload.taskId);
    });

    socket.on('connect_error', () => {
      // transient
    });

    this.socket = socket;
  }

  private disconnect(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.currentToken = null;
  }

  private notifyIfMineByOther(task: { assignedTo: string; title: string }, verb: string): void {
    const me = this.auth.user();
    if (!me) return;
    if (task.assignedTo !== me.id) return;
    this.toast.info(`${task.title} was ${verb}`);
  }
}
