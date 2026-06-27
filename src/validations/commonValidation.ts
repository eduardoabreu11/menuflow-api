import { z } from "zod";

function emptyStringToNull(value: unknown) {
  if (value === "") {
    return null;
  }

  return value;
}

export const uuidParamSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

export const restaurantIdQuerySchema = z.object({
  restaurant_id: z.string().uuid("ID do restaurante inválido"),
});

export const optionalRestaurantIdQuerySchema = z.object({
  restaurant_id: z
    .string()
    .uuid("ID do restaurante inválido")
    .optional(),
});

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Nome deve ter no mínimo 2 caracteres")
  .max(100, "Nome deve ter no máximo 100 caracteres");

export const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug deve ter no mínimo 2 caracteres")
  .max(80, "Slug deve ter no máximo 80 caracteres")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug deve conter apenas letras minúsculas, números e hífens",
  );

export const slugParamSchema = z.object({
  slug: slugSchema,
});

export function optionalTextSchema(fieldName: string, max: number) {
  return z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .max(max, `${fieldName} deve ter no máximo ${max} caracteres`)
      .nullable()
      .optional(),
  );
}

export function optionalUrlSchema(fieldName: string) {
  return z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .url(`${fieldName} inválida`)
      .max(500, `${fieldName} deve ter no máximo 500 caracteres`)
      .nullable()
      .optional(),
  );
}

export const phoneSchema = z.preprocess(
  emptyStringToNull,
  z
    .string()
    .trim()
    .min(8, "Telefone deve ter no mínimo 8 caracteres")
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .regex(
      /^[0-9+()\-\s]+$/,
      "Telefone deve conter apenas números, espaços, +, -, ( e )",
    )
    .nullable()
    .optional(),
);