import type { Request, Response } from "express";

import {
  activateUser,
  createNewUser,
  deleteUser,
  disableUser,
  getAllUsers,
  getUserById,
  loginUser,
  updateUser,
} from "../services/userService.js";

import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  clearAuthCookieOptions,
} from "../config/jwt.js";

import { AppError } from "../utils/AppError.js";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const result = await loginUser({
    email,
    password,
  });

  res.cookie(AUTH_COOKIE_NAME, result.token, authCookieOptions);

  return res.json(result);
}

export async function logout(req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions);

  return res.json({
    message: "Logout realizado com sucesso",
  });
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError("Usuário não autenticado", 401);
  }

  const user = await getUserById(req.user.id);

  return res.json(user);
}

export async function index(req: Request, res: Response) {
  const users = await getAllUsers();

  return res.json(users);
}

export async function show(req: Request, res: Response) {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    throw new AppError("ID inválido", 400);
  }

  const user = await getUserById(id);

  return res.json(user);
}

export async function store(req: Request, res: Response) {
  const user = await createNewUser(req.body);

  return res.status(201).json(user);
}

export async function update(req: Request, res: Response) {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    throw new AppError("ID inválido", 400);
  }

  const user = await updateUser(id, req.body);

  return res.json(user);
}

export async function activate(req: Request, res: Response) {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    throw new AppError("ID inválido", 400);
  }

  const user = await activateUser(id);

  return res.json(user);
}

export async function disable(req: Request, res: Response) {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    throw new AppError("ID inválido", 400);
  }

  const user = await disableUser(id);

  return res.json(user);
}

export async function destroy(req: Request, res: Response) {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    throw new AppError("ID inválido", 400);
  }

  const user = await deleteUser(id);

  return res.json({
    message: "Usuário removido com sucesso",
    user,
  });
}