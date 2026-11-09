/**
 * The app's own database queries (everything that isn't Better Auth).
 * The Drizzle version of this file has the same exports, so pages and
 * scripts work with either ORM.
 */
import type { Prisma, User } from "../generated/prisma/client";
import { db } from "./index";

export type UserStats = {
  total: number;
  verified: number;
  twoFactor: number;
  admins: number;
  banned: number;
};

export type UserRecord = User;

export async function getUserStats(): Promise<UserStats> {
  const [total, verified, twoFactor, admins, banned] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { emailVerified: true } }),
    db.user.count({ where: { twoFactorEnabled: true } }),
    db.user.count({ where: { role: "admin" } }),
    db.user.count({ where: { banned: true } }),
  ]);
  return { total, verified, twoFactor, admins, banned };
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
  // Prisma passes `%` and `_` through to LIKE, so escape them to match literally.
  const text = query.replace(/[\\%_]/g, (c) => `\\${c}`);
  const where: Prisma.UserWhereInput = query
    ? {
        OR: [
          { name: { contains: text, mode: "insensitive" } },
          { email: { contains: text, mode: "insensitive" } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    db.user.count({ where }),
  ]);
  return { users, total };
}

/** Returns false when no user has that email. */
export async function setRoleByEmail(email: string, role: string): Promise<boolean> {
  const { count } = await db.user.updateMany({ where: { email }, data: { role } });
  return count > 0;
}
