import { z } from "zod";

export const createProductBodySchema = z
  .object({
    restaurant_id: z
      .string()
      .uuid("ID do restaurante inválido"),

    category_id: z
      .string()
      .uuid("ID da categoria inválido"),

    name: z
      .string()
      .trim()
      .min(2, "Nome do produto deve ter no mínimo 2 caracteres")
      .max(100, "Nome do produto deve ter no máximo 100 caracteres"),

    description: z
      .string()
      .trim()
      .max(500, "Descrição deve ter no máximo 500 caracteres")
      .optional()
      .nullable(),

    price: z
      .coerce
      .number()
      .positive("Preço do produto deve ser maior que zero"),

    image_url: z
      .string()
      .trim()
      .url("URL da imagem inválida")
      .max(500, "URL da imagem deve ter no máximo 500 caracteres")
      .optional()
      .nullable(),

    video_url: z
      .string()
      .trim()
      .url("URL do vídeo inválida")
      .max(500, "URL do vídeo deve ter no máximo 500 caracteres")
      .optional()
      .nullable(),

    is_promotion: z.boolean().optional(),

    is_new: z.boolean().optional(),
  })
  .strict();

export const updateProductBodySchema = z
  .object({
    category_id: z
      .string()
      .uuid("ID da categoria inválido")
      .optional(),

    name: z
      .string()
      .trim()
      .min(2, "Nome do produto deve ter no mínimo 2 caracteres")
      .max(100, "Nome do produto deve ter no máximo 100 caracteres")
      .optional(),

    description: z
      .string()
      .trim()
      .max(500, "Descrição deve ter no máximo 500 caracteres")
      .optional()
      .nullable(),

    price: z
      .coerce
      .number()
      .positive("Preço do produto deve ser maior que zero")
      .optional(),

    image_url: z
      .string()
      .trim()
      .url("URL da imagem inválida")
      .max(500, "URL da imagem deve ter no máximo 500 caracteres")
      .optional()
      .nullable(),

    video_url: z
      .string()
      .trim()
      .url("URL do vídeo inválida")
      .max(500, "URL do vídeo deve ter no máximo 500 caracteres")
      .optional()
      .nullable(),

    is_promotion: z.boolean().optional(),

    is_new: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Informe pelo menos um campo para atualizar",
    },
  );


  export const listProductsQuerySchema = z
  .object({
    restaurant_id: z
      .string()
      .uuid("ID do restaurante inválido")
      .optional(),

    category_id: z
      .string()
      .uuid("ID da categoria inválido")
      .optional(),
  })
  .strict();