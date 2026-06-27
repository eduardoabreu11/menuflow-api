import { z } from "zod";

import {
  nameSchema,
  slugSchema,
  optionalTextSchema,
  optionalUrlSchema,
  phoneSchema,
} from "./commonValidation.js";

export const createRestaurantBodySchema = z
  .object({
    owner_user_id: z
      .string()
      .uuid("ID do dono do restaurante inválido")
      .optional(),

    name: nameSchema,

    slug: slugSchema,

    description: optionalTextSchema("Descrição", 500),

    logo_url: optionalUrlSchema("Logo"),

    whatsapp: phoneSchema,

    phone: phoneSchema,

    address: optionalTextSchema("Endereço", 200),

    opening_hours: optionalTextSchema("Horário de funcionamento", 150),
  })
  .strict();

export const updateRestaurantBodySchema = z
  .object({
    name: nameSchema,

    slug: slugSchema,

    description: optionalTextSchema("Descrição", 500),

    logo_url: optionalUrlSchema("Logo"),

    whatsapp: phoneSchema,

    phone: phoneSchema,

    address: optionalTextSchema("Endereço", 200),

    opening_hours: optionalTextSchema("Horário de funcionamento", 150),
  })
  .strict();