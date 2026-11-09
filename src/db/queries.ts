/**
 * The app's own database queries (everything that isn't Better Auth).
 * The Prisma version of this file has the same exports, so pages and
 * scripts work with either ORM.
 */
import { count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "./index";
import { user } from "./schema";

export type UserStats = {
  total: number;
  verified: number;
  twoFactor: number;
  admins: number;
  banned: number;
};

export type UserRecord = typeof user.$inferSelect;

export async function getUserStats(): Promise<UserStats> {
  const [row] = await db
    .select({
      total: count(),
      verified: sql<number>`count(*) filter (where ${user.emailVerified})`.mapWith(Number),
      twoFactor: sql<number>`count(*) filter (where ${user.twoFactorEnabled})`.mapWith(Number),
      admins: sql<number>`count(*) filter (where ${user.role} = 'admin')`.mapWith(Number),
      banned: sql<number>`count(*) filter (where ${user.banned})`.mapWith(Number),
    })
    .from(user);
  return row;
}

/** Newest first. `query` matches name or email, ignoring case. */
export async function listUsers({
  query,
  page,
  pageSize,
}: {
  query: string;
  page: number;
  pageSize: number;
}): Promise<{ users: UserRecord[]; total: number }> {
  // `%` and `_` in the search text are matched literally.
  const pattern = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const where = query ? or(ilike(user.name, pattern), ilike(user.email, pattern)) : undefined;

  const [users, [{ total }]] = await Promise.all([
    db
      .select()
      .from(user)
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(user).where(where),
  ]);
  return { users, total };
}

/** Returns false when no user has that email. */
export async function setRoleByEmail(email: string, role: string): Promise<boolean> {
  const updated = await db
    .update(user)
    .set({ role })
    .where(eq(user.email, email))
    .returning({ id: user.id });
  return updated.length > 0;
}
