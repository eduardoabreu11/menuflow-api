import { pool } from "../database/database.js";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export async function findUserByEmail(email: string) {
  const result = await pool.query<User>(
    "SELECT * FROM users WHERE email = $1",
    [email],
  );

  return result.rows[0];
}

export async function findUserById(id: string) {
  const result = await pool.query(
    `SELECT id, name, email, role, is_active, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id],
  );

  return result.rows[0];
}

export async function listUsers() {
  const result = await pool.query(
    `SELECT id, name, email, role, is_active, created_at, updated_at
     FROM users
     ORDER BY created_at DESC`,
  );

  return result.rows;
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