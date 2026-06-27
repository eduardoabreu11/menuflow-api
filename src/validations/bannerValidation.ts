import { z } from "zod";

export const createBannerBodySchema = z
  .object({
    restaurant_id: z
      .string()
      .uuid("ID do restaurante inválido"),

    image_url: z
      .string()
      .trim()
      .url("URL da imagem inválida")
      .max(500, "URL da imagem deve ter no máximo 500 caracteres"),
  })
  .strict();

export const updateBannerBodySchema = z
  .object({
    image_url: z
      .string()
      .trim()
      .url("URL da imagem inválida")
      .max(500, "URL da imagem deve ter no máximo 500 caracteres")
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Informe pelo menos um campo para atualizar",
    },
  );