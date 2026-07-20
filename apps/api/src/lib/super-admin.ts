import { prisma } from "./prisma";

export async function userIsSuperAdmin(userId: string): Promise<boolean> {
  const assignment = await prisma.userRole.findFirst({
    where: {
      userId,
      deletedAt: null,
      role: { code: "super_admin", deletedAt: null },
    },
    select: { id: true },
  });

  return assignment !== null;
}
