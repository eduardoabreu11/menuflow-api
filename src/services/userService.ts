import bcrypt from "bcrypt";

import {
  findUserByEmail,
  findUserById,
  listUsers,
} from "../repositories/userRepository.js";

import { generateToken, type UserRole } from "../config/jwt.js";

type LoginData = {
  email: string;
  password: string;
};

function isBcryptHash(password: string) {
  return /^\$2b\$\d{2}\$[./A-Za-z0-9]{53}$/.test(password);
}

export async function loginUser({ email, password }: LoginData) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("E-mail ou senha inválidos");
  }

  if (!user.is_active) {
    throw new Error("Usuário inativo");
  }

  if (!isBcryptHash(user.password)) {
    console.warn(`Usuário ${user.email} está com senha fora do padrão bcrypt.`);

    throw new Error("E-mail ou senha inválidos");
  }

  const passwordIsValid = await bcrypt.compare(password, user.password);

  if (!passwordIsValid) {
    throw new Error("E-mail ou senha inválidos");
  }

  const token = generateToken({
    id: user.id,
    role: user.role as UserRole,
  });

  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
}

export async function getAllUsers() {
  return listUsers();
}

export async function getUserById(id: string) {
  const user = await findUserById(id);

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  return user;
}