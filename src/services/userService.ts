import bcrypt from "bcrypt";

import {
  activateUserById,
  createUser,
  deleteUserById,
  disableUserById,
  findUserByEmail,
  findUserById,
  listUsers,
  updateUserById,
} from "../repositories/userRepository.js";

import { generateToken, type UserRole } from "../config/jwt.js";
import { AppError } from "../utils/AppError.js";

type LoginData = {
  email: string;
  password: string;
};

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

function isBcryptHash(password: string) {
  return /^\$2b\$\d{2}\$[./A-Za-z0-9]{53}$/.test(password);
}

export async function loginUser({ email, password }: LoginData) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError("E-mail ou senha inválidos", 401);
  }

  if (!user.is_active) {
    throw new AppError("Usuário inativo", 401);
  }

  if (!isBcryptHash(user.password)) {
    console.warn(`Usuário ${user.email} está com senha fora do padrão bcrypt.`);

    throw new AppError("E-mail ou senha inválidos", 401);
  }

  const passwordIsValid = await bcrypt.compare(password, user.password);

  if (!passwordIsValid) {
    throw new AppError("E-mail ou senha inválidos", 401);
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
    throw new AppError("Usuário não encontrado", 404);
  }

  return user;
}

export async function createNewUser(data: CreateUserData) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await createUser({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: data.role,
  });

  return user;
}

export async function updateUser(id: string, data: UpdateUserData) {
  const userExists = await findUserById(id);

  if (!userExists) {
    throw new AppError("Usuário não encontrado", 404);
  }

  const user = await updateUserById(id, data);

  if (!user) {
    throw new AppError("Usuário não encontrado", 404);
  }

  return user;
}

export async function activateUser(id: string) {
  const user = await activateUserById(id);

  if (!user) {
    throw new AppError("Usuário não encontrado", 404);
  }

  return user;
}

export async function disableUser(id: string) {
  const user = await disableUserById(id);

  if (!user) {
    throw new AppError("Usuário não encontrado", 404);
  }

  return user;
}

export async function deleteUser(id: string) {
  const user = await deleteUserById(id);

  if (!user) {
    throw new AppError("Usuário não encontrado", 404);
  }

  return user;
}