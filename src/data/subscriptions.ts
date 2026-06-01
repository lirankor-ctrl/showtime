import { supabase } from "../lib/supabase";
import type { Subscription } from "../types";
import { subscriptionFromRow, subscriptionToRow } from "./mappers";

type SubscriptionDraft = Omit<Subscription, "id" | "createdAt" | "updatedAt">;

export async function fetchSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(subscriptionFromRow);
}

export async function insertSubscription(
  userId: string,
  draft: SubscriptionDraft,
): Promise<Subscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({ ...subscriptionToRow(draft), user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return subscriptionFromRow(data);
}

export async function updateSubscription(
  id: string,
  draft: SubscriptionDraft,
): Promise<Subscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .update(subscriptionToRow(draft))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return subscriptionFromRow(data);
}

/** Directly set the remaining-ticket count (used by ticket accounting). */
export async function setRemainingTickets(
  id: string,
  remaining: number,
): Promise<void> {
  const { error } = await supabase
    .from("subscriptions")
    .update({ remaining_tickets: remaining })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSubscriptionRow(id: string): Promise<void> {
  const { error } = await supabase.from("subscriptions").delete().eq("id", id);
  if (error) throw error;
}
