import { z } from "zod";

const userRoleSchema = z.enum([
  "MASTER",
  "RESTAURANT_OWNER",
  "RESTAURANT_STAFF",
]);

export const createUserBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Nome deve ter no mínimo 3 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres"),

    email: z
      .string()
      .trim()
      .email("E-mail inválido")
      .max(255, "E-mail deve ter no máximo 255 caracteres")
      .transform((email) => email.toLowerCase()),

    password: z
      .string()
      .min(6, "Senha deve ter no mínimo 6 caracteres")
      .max(100, "Senha deve ter no máximo 100 caracteres"),

    role: userRoleSchema,
  })
  .strict();

export const updateUserBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Nome deve ter no mínimo 3 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres")
      .optional(),

    email: z
      .string()
      .trim()
      .email("E-mail inválido")
      .max(255, "E-mail deve ter no máximo 255 caracteres")
      .transform((email) => email.toLowerCase())
      .optional(),

    role: userRoleSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe pelo menos um campo para atualizar",
  });