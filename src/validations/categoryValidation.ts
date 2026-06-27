import { z } from "zod";

export const createCategoryBodySchema = z
  .object({
    restaurant_id: z
      .string()
      .uuid("ID do restaurante inválido"),

    name: z
      .string()
      .trim()
      .min(2, "Nome da categoria deve ter no mínimo 2 caracteres")
      .max(80, "Nome da categoria deve ter no máximo 80 caracteres"),

    emoji: z
      .string()
      .trim()
      .max(10, "Emoji deve ter no máximo 10 caracteres")
      .optional()
      .nullable(),

    sort_order: z
      .coerce
      .number()
      .int("Ordem deve ser um número inteiro")
      .min(0, "Ordem não pode ser negativa")
      .optional(),
  })
  .strict();

export const updateCategoryBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nome da categoria deve ter no mínimo 2 caracteres")
      .max(80, "Nome da categoria deve ter no máximo 80 caracteres")
      .optional(),

    emoji: z
      .string()
      .trim()
      .max(10, "Emoji deve ter no máximo 10 caracteres")
      .optional()
      .nullable(),

    sort_order: z
      .coerce
      .number()
      .int("Ordem deve ser um número inteiro")
      .min(0, "Ordem não pode ser negativa")
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Informe pelo menos um campo para atualizar",
    },
  );