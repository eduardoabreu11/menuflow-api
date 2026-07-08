import {
  listSubscriptionsWithPaymentsOverdueByDays,
  updateSubscriptionById,
} from "../repositories/subscriptionRepository.js";

import { blockRestaurantsByOwnerUserId } from "../repositories/restaurantRepository.js";

type BlockOverdueSubscriptionsOptions = {
  days_after_due_date?: number | undefined;
};

type BlockOverdueSubscriptionSummary = {
  subscription_id: string;
  owner_user_id: string;
  owner_name: string;
  owner_email: string;
  previous_subscription_status: string;
  restaurants_blocked_count: number;
};

export async function blockOverdueSubscriptionsService(
  options: BlockOverdueSubscriptionsOptions = {},
) {
  const daysAfterDueDate = options.days_after_due_date ?? 3;

  const subscriptions = await listSubscriptionsWithPaymentsOverdueByDays(
    daysAfterDueDate,
  );

  const summaries: BlockOverdueSubscriptionSummary[] = [];

  for (const subscription of subscriptions) {
    if (subscription.status !== "OVERDUE") {
      await updateSubscriptionById(subscription.id, {
        status: "OVERDUE",
      });
    }

    const blockedRestaurants = await blockRestaurantsByOwnerUserId(
      subscription.owner_user_id,
    );

    summaries.push({
      subscription_id: subscription.id,
      owner_user_id: subscription.owner_user_id,
      owner_name: subscription.owner_name,
      owner_email: subscription.owner_email,
      previous_subscription_status: subscription.status,
      restaurants_blocked_count: blockedRestaurants.length,
    });
  }

  return {
    days_after_due_date: daysAfterDueDate,
    total_subscriptions_checked: subscriptions.length,
    total_restaurants_blocked: summaries.reduce(
      (total, summary) => total + summary.restaurants_blocked_count,
      0,
    ),
    summaries,
  };
}