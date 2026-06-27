import { z } from "zod";

export const loginBodySchema = z.object({
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .max(120, "E-mail deve ter no máximo 120 caracteres")
    .toLowerCase(),

  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .max(100, "Senha muito grande"),
});