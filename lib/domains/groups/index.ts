// DEFERRED — interface only, no v1 implementation.
// See README "Deferred features" for plug-in location.

export interface GroupRepository {
  create(input: { name: string; createdByUserId: string }): Promise<{ id: string }>;
  addMember(groupId: string, userId: string, role?: "MEMBER" | "ADMIN"): Promise<void>;
  removeMember(groupId: string, userId: string): Promise<void>;
  listForUser(userId: string): Promise<Array<{ id: string; name: string }>>;
}
