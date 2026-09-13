import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'invalid id');

export const setManagerSchema = z.object({
  managerId: objectId.nullable(),
});

export const setTeamLeadSchema = z.object({
  teamLeadId: objectId.nullable(),
});

export type SetManagerInput = z.infer<typeof setManagerSchema>;
export type SetTeamLeadInput = z.infer<typeof setTeamLeadSchema>;
