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

import { AppError } from "../utils/AppError.js";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const result = await loginUser({
    email,
    password,
  });

  return res.json(result);
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