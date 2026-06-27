import type { Request, Response } from "express";

import {
  getAllUsers,
  getUserById,
  loginUser,
} from "../services/userService.js";

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const result = await loginUser({
      email,
      password,
    });

    return res.json(result);
  } catch (error) {
    return res.status(401).json({
      message:
        error instanceof Error
          ? error.message
          : "Erro ao realizar login",
    });
  }
}

export async function index(req: Request, res: Response) {
  const users = await getAllUsers();

  return res.json(users);
}

export async function show(req: Request, res: Response) {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      message: "ID inválido",
    });
  }

  const user = await getUserById(id);

  return res.json(user);
}