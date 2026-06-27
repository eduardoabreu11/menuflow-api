import { z } from "zod";

export const createPlanBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nome do plano deve ter no mínimo 2 caracteres")
      .max(100, "Nome do plano deve ter no máximo 100 caracteres"),

    description: z
      .string()
      .trim()
      .max(500, "Descrição deve ter no máximo 500 caracteres")
      .optional()
      .nullable(),

    monthly_price: z
      .coerce
      .number()
      .min(0, "Preço mensal não pode ser negativo"),

    annual_price: z
      .coerce
      .number()
      .min(0, "Preço anual não pode ser negativo"),

    max_restaurants: z
      .coerce
      .number()
      .int("Limite de restaurantes deve ser um número inteiro")
      .min(1, "Limite de restaurantes deve ser no mínimo 1"),

    max_products: z
      .coerce
      .number()
      .int("Limite de produtos deve ser um número inteiro")
      .min(1, "Limite de produtos deve ser no mínimo 1"),

    max_categories: z
      .coerce
      .number()
      .int("Limite de categorias deve ser um número inteiro")
      .min(1, "Limite de categorias deve ser no mínimo 1"),

    max_users: z
      .coerce
      .number()
      .int("Limite de usuários deve ser um número inteiro")
      .min(1, "Limite de usuários deve ser no mínimo 1"),
  })
  .strict();

export const updatePlanBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nome do plano deve ter no mínimo 2 caracteres")
      .max(100, "Nome do plano deve ter no máximo 100 caracteres")
      .optional(),

    description: z
      .string()
      .trim()
      .max(500, "Descrição deve ter no máximo 500 caracteres")
      .optional()
      .nullable(),

    monthly_price: z
      .coerce
      .number()
      .min(0, "Preço mensal não pode ser negativo")
      .optional(),

    annual_price: z
      .coerce
      .number()
      .min(0, "Preço anual não pode ser negativo")
      .optional(),

    max_restaurants: z
      .coerce
      .number()
      .int("Limite de restaurantes deve ser um número inteiro")
      .min(1, "Limite de restaurantes deve ser no mínimo 1")
      .optional(),

    max_products: z
      .coerce
      .number()
      .int("Limite de produtos deve ser um número inteiro")
      .min(1, "Limite de produtos deve ser no mínimo 1")
      .optional(),

    max_categories: z
      .coerce
      .number()
      .int("Limite de categorias deve ser um número inteiro")
      .min(1, "Limite de categorias deve ser no mínimo 1")
      .optional(),

    max_users: z
      .coerce
      .number()
      .int("Limite de usuários deve ser um número inteiro")
      .min(1, "Limite de usuários deve ser no mínimo 1")
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe pelo menos um campo para atualizar",
  });