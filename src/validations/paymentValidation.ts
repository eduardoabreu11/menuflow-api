import { z } from "zod";

const paymentStatusSchema = z.enum([
  "PAID",
  "PENDING",
  "OVERDUE",
  "CANCELED",
]);

const billingTypeSchema = z.enum([
  "BOLETO",
  "PIX",
  "CREDIT_CARD",
  "UNDEFINED",
]);

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD");

export const paymentIdParamsSchema = z
  .object({
    id: z.string().uuid("ID da fatura inválido"),
  })
  .strict();

export const paymentRestaurantIdParamsSchema = z
  .object({
    restaurant_id: z.string().uuid("ID do restaurante inválido"),
  })
  .strict();

export const paymentSubscriptionIdParamsSchema = z
  .object({
    subscription_id: z.string().uuid("ID da assinatura inválido"),
  })
  .strict();

export const createPaymentBodySchema = z
  .object({
    owner_user_id: z.string().uuid("ID do cliente/dono inválido").optional(),

    restaurant_id: z
      .string()
      .uuid("ID do restaurante inválido")
      .nullable()
      .optional(),

    subscription_id: z.string().uuid("ID da assinatura inválido"),

    amount: z.coerce
      .number()
      .positive("Valor da fatura deve ser maior que zero"),

    due_date: dateSchema,

    status: paymentStatusSchema.optional(),
  })
  .strict();

export const updatePaymentBodySchema = z
  .object({
    amount: z.coerce
      .number()
      .positive("Valor da fatura deve ser maior que zero")
      .optional(),

    due_date: dateSchema.optional(),

    status: paymentStatusSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe pelo menos um campo para atualizar",
  });

export const markPaymentAsPaidBodySchema = z
  .object({
    paid_at: z.string().datetime("Data de pagamento inválida").optional(),
  })
  .strict();

export const generateMonthlyPaymentsBodySchema = z
  .object({
    up_to_date: dateSchema.optional(),
    create_asaas_charges: z.boolean().optional().default(false),
  })
  .strict();

export const createAsaasChargeBodySchema = z
  .object({
    billing_type: billingTypeSchema.optional(),
  })
  .strict();