export const SOCKET_PATH = '/api/socket.io/';

export const API_PATHS = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
  },
  tasks: {
    list: '/api/tasks',
    create: '/api/tasks',
    detail: (id: string) => `/api/tasks/${id}`,
    update: (id: string) => `/api/tasks/${id}`,
    remove: (id: string) => `/api/tasks/${id}`,
  },
  admin: {
    listByRole: (role: string) => `/api/admin/users/by-role/${role}`,
    listUnassigned: (role: string) => `/api/admin/users/unassigned/${role}`,
    setManager: (userId: string) => `/api/admin/users/${userId}/manager`,
    setTeamLead: (userId: string) => `/api/admin/users/${userId}/team-lead`,
  },
  users: {
    assignable: '/api/users/assignable',
  },
} as const;
