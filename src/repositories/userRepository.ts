import { pool } from "../database/database.js";

import type { UserRole } from "../config/jwt.js";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type PublicUser = Omit<User, "password">;

type CreateUserData = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

type UpdateUserData = {
  name?: string;
  email?: string;
  role?: UserRole;
};

export async function findUserByEmail(email: string) {
  const result = await pool.query<User>(
    `SELECT *
     FROM users
     WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`,
    [email],
  );

  return result.rows[0];
}

export async function findUserById(id: string) {
  const result = await pool.query<PublicUser>(
    `SELECT id, name, email, role, is_active, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id],
  );

  return result.rows[0];
}

export async function listUsers() {
  const result = await pool.query<PublicUser>(
    `SELECT id, name, email, role, is_active, created_at, updated_at
     FROM users
     ORDER BY created_at DESC`,
  );

  return result.rows;
}

export async function createUser(data: CreateUserData) {
  const result = await pool.query<PublicUser>(
    `INSERT INTO users (
       name,
       email,
       password,
       role,
       is_active
     )
     VALUES ($1, LOWER(TRIM($2)), $3, $4, true)
     RETURNING id, name, email, role, is_active, created_at, updated_at`,
    [data.name.trim(), data.email, data.password, data.role],
  );

  return result.rows[0];
}

export async function updateUserById(id: string, data: UpdateUserData) {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    values.push(data.name.trim());
    fields.push(`name = $${values.length}`);
  }

  if (data.email !== undefined) {
    values.push(data.email);
    fields.push(`email = LOWER(TRIM($${values.length}))`);
  }

  if (data.role !== undefined) {
    values.push(data.role);
    fields.push(`role = $${values.length}`);
  }

  if (fields.length === 0) {
    return findUserById(id);
  }

  values.push(id);

  const result = await pool.query<PublicUser>(
    `UPDATE users
     SET ${fields.join(", ")},
         updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING id, name, email, role, is_active, created_at, updated_at`,
    values,
  );

  return result.rows[0];
}

export async function activateUserById(id: string) {
  const result = await pool.query<PublicUser>(
    `UPDATE users
     SET is_active = true,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, email, role, is_active, created_at, updated_at`,
    [id],
  );

  return result.rows[0];
}

export async function disableUserById(id: string) {
  const result = await pool.query<PublicUser>(
    `UPDATE users
     SET is_active = false,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, email, role, is_active, created_at, updated_at`,
    [id],
  );

  return result.rows[0];
}

export async function deleteUserById(id: string) {
  const result = await pool.query<PublicUser>(
    `DELETE FROM users
     WHERE id = $1
     RETURNING id, name, email, role, is_active, created_at, updated_at`,
    [id],
  );

  return result.rows[0];
}

export async function updateUserPassword(userId: string, hashedPassword: string) {
  await pool.query(
    `UPDATE users
     SET password = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [hashedPassword, userId],
  );
}