import { z } from "zod";

const subscriptionStatusSchema = z.enum([
  "ACTIVE",
  "PENDING",
  "OVERDUE",
  "CANCELED",
]);

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD");

export const subscriptionIdParamsSchema = z
  .object({
    id: z.string().uuid("ID da assinatura inválido"),
  })
  .strict();

export const subscriptionOwnerUserIdParamsSchema = z
  .object({
    owner_user_id: z.string().uuid("ID do dono inválido"),
  })
  .strict();

export const subscriptionRestaurantIdParamsSchema = z
  .object({
    restaurant_id: z.string().uuid("ID do restaurante inválido"),
  })
  .strict();

export const createSubscriptionBodySchema = z
  .object({
    owner_user_id: z.string().uuid("ID do dono inválido").optional(),

    // Mantido temporariamente para compatibilidade com telas antigas.
    // A assinatura oficial é por owner_user_id.
    restaurant_id: z
      .string()
      .uuid("ID do restaurante inválido")
      .nullable()
      .optional(),

    status: subscriptionStatusSchema.optional(),

    plan_name: z
      .string()
      .trim()
      .min(2, "Nome do plano deve ter no mínimo 2 caracteres")
      .max(100, "Nome do plano deve ter no máximo 100 caracteres")
      .optional(),

    monthly_price: z.coerce
      .number()
      .min(0, "Valor mensal não pode ser negativo"),

    started_at: dateSchema.optional(),

    next_billing_date: dateSchema,
  })
  .strict()
  .refine((data) => Boolean(data.owner_user_id || data.restaurant_id), {
    message: "Informe o ID do dono da conta",
    path: ["owner_user_id"],
  });

export const updateSubscriptionBodySchema = z
  .object({
    status: subscriptionStatusSchema.optional(),

    plan_name: z
      .string()
      .trim()
      .min(2, "Nome do plano deve ter no mínimo 2 caracteres")
      .max(100, "Nome do plano deve ter no máximo 100 caracteres")
      .optional(),

    monthly_price: z.coerce
      .number()
      .min(0, "Valor mensal não pode ser negativo")
      .optional(),

    started_at: dateSchema.optional(),

    next_billing_date: dateSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe pelo menos um campo para atualizar",
  });