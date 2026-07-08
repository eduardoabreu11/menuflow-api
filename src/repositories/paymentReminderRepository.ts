import { pool } from "../database/database.js";

export type PaymentReminderChannel = "EMAIL" | "WHATSAPP";

export type PaymentReminderType =
  | "BEFORE_DUE"
  | "DUE_TODAY"
  | "OVERDUE"
  | "BLOCKED";

export type PaymentReminderStatus = "PENDING" | "SENT" | "FAILED" | "SKIPPED";

export type PaymentReadyForReminder = {
  payment_id: string;
  owner_user_id: string;
  owner_name: string;
  owner_email: string;
  owner_whatsapp: string | null;
  amount: number;
  due_date: string;
  payment_status: string;
  gateway_invoice_url: string | null;
  gateway_payment_url: string | null;
  subscription_id: string;
  subscription_status: string;
  plan_name: string;
  days_until_due: number;
};

export type PaymentReminder = {
  id: string;
  payment_id: string;
  owner_user_id: string;
  channel: PaymentReminderChannel;
  reminder_type: PaymentReminderType;
  reminder_date: string;
  recipient: string | null;
  subject: string | null;
  message: string;
  sent_at: Date | null;
  status: PaymentReminderStatus;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

type CreatePaymentReminderData = {
  payment_id: string;
  owner_user_id: string;
  channel: PaymentReminderChannel;
  reminder_type: PaymentReminderType;
  recipient?: string | null | undefined;
  subject?: string | null | undefined;
  message: string;
  status?: PaymentReminderStatus | undefined;
  metadata?: Record<string, unknown> | undefined;
};

export async function listPaymentsReadyForReminders(data: {
  days_before_due: number;
  days_after_due: number;
}) {
  const result = await pool.query<PaymentReadyForReminder>(
    `
    SELECT
      payments.id AS payment_id,
      payments.owner_user_id,
      users.name AS owner_name,
      users.email AS owner_email,
      (
        SELECT restaurants.whatsapp
        FROM restaurants
        WHERE restaurants.owner_user_id = payments.owner_user_id
          AND restaurants.whatsapp IS NOT NULL
          AND restaurants.whatsapp <> ''
        ORDER BY restaurants.created_at DESC
        LIMIT 1
      ) AS owner_whatsapp,
      payments.amount::float AS amount,
      payments.due_date::text AS due_date,
      payments.status AS payment_status,
      payments.gateway_invoice_url,
      payments.gateway_payment_url,
      subscriptions.id AS subscription_id,
      subscriptions.status AS subscription_status,
      subscriptions.plan_name,
      (payments.due_date::date - CURRENT_DATE)::int AS days_until_due
    FROM payments
    INNER JOIN users ON users.id = payments.owner_user_id
    INNER JOIN subscriptions ON subscriptions.id = payments.subscription_id
    WHERE payments.gateway_provider = 'ASAAS'
      AND payments.status IN ('PENDING', 'OVERDUE')
      AND subscriptions.status <> 'CANCELED'
      AND payments.due_date::date <= CURRENT_DATE + ($1::int * INTERVAL '1 day')
      AND payments.due_date::date >= CURRENT_DATE - ($2::int * INTERVAL '1 day')
    ORDER BY payments.due_date ASC, users.name ASC
    `,
    [data.days_before_due, data.days_after_due],
  );

  return result.rows;
}

export async function createPaymentReminderIfNotExists(
  data: CreatePaymentReminderData,
) {
  const result = await pool.query<PaymentReminder>(
    `
    INSERT INTO payment_reminders (
      payment_id,
      owner_user_id,
      channel,
      reminder_type,
      reminder_date,
      recipient,
      subject,
      message,
      status,
      metadata
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      CURRENT_DATE,
      $5,
      $6,
      $7,
      $8,
      $9
    )
    ON CONFLICT (payment_id, channel, reminder_type, reminder_date)
    DO NOTHING
    RETURNING
      id,
      payment_id,
      owner_user_id,
      channel,
      reminder_type,
      reminder_date::text AS reminder_date,
      recipient,
      subject,
      message,
      sent_at,
      status,
      error_message,
      metadata,
      created_at,
      updated_at
    `,
    [
      data.payment_id,
      data.owner_user_id,
      data.channel,
      data.reminder_type,
      data.recipient ?? null,
      data.subject ?? null,
      data.message,
      data.status ?? "PENDING",
      data.metadata ?? null,
    ],
  );

  return result.rows[0] ?? null;
}

export async function markPaymentReminderAsSent(id: string) {
  const result = await pool.query<PaymentReminder>(
    `
    UPDATE payment_reminders
    SET status = 'SENT',
        sent_at = NOW(),
        error_message = NULL,
        updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      payment_id,
      owner_user_id,
      channel,
      reminder_type,
      reminder_date::text AS reminder_date,
      recipient,
      subject,
      message,
      sent_at,
      status,
      error_message,
      metadata,
      created_at,
      updated_at
    `,
    [id],
  );

  return result.rows[0];
}

export async function markPaymentReminderAsFailed(
  id: string,
  errorMessage: string,
) {
  const result = await pool.query<PaymentReminder>(
    `
    UPDATE payment_reminders
    SET status = 'FAILED',
        error_message = $2,
        updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      payment_id,
      owner_user_id,
      channel,
      reminder_type,
      reminder_date::text AS reminder_date,
      recipient,
      subject,
      message,
      sent_at,
      status,
      error_message,
      metadata,
      created_at,
      updated_at
    `,
    [id, errorMessage],
  );

  return result.rows[0];
}