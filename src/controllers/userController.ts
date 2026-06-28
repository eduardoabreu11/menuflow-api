import type { Request, Response } from "express";

import {
  getAllUsers,
  getUserById,
  loginUser,
} from "../services/userService.js";

import { AppError } from "../utils/AppError.js";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    const result = await loginUser({
      email,
      password,
    });

    return res.json(result);
  } catch (error) {
    throw new AppError(
      error instanceof Error
        ? error.message
        : "Erro ao realizar login",
      401,
    );
  }
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