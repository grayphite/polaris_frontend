import { makeRequest } from './api';

// Types
export interface PlanPrice {
  id: number;
  key: string;
  nickname: string;
  currency: string;
  amount_cents: number;
  compare_at_cents: number | null;
  interval: string;
  interval_count: number;
  trial_days: number;
  stripe_price_id: string;
  per_seat_amount_cents: number;
  per_seat_metric: string;
}

export interface Plan {
  id: number;
  code: string;
  display_name: string;
  description: string;
  max_teams: number;
  max_projects: number;
  max_team_members_per_team: number;
  max_project_members_per_project: number;
  can_add_users_to_project: boolean;
  features: Record<string, any>;
  prices: PlanPrice[];
}

export interface PlansResponse {
  plans: Plan[];
}

export interface CheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
}

export interface SubscriptionResponse {
  subscription: {
    id: number;
    status: string;
    trial_end: string;
    current_period_start: string;
    current_period_end: string;
    quantity: number;
    plan: {
      id: number;
      code: string;
      display_name: string;
      max_team_members_per_team: number;
    };
    price: {
      id: number;
      nickname: string;
      amount_cents: number;
      currency: string;
      trial_days: number;
      per_seat_amount_cents: number;
    };
    billing_user_id: number;
  };
}

// API Functions
export async function getPlans(): Promise<PlansResponse> {
  return makeRequest<PlansResponse>('/plans', {
    method: 'GET',
  });
}

export async function createCheckoutSession(
  teamId: string,
  priceId: string
): Promise<CheckoutSessionResponse> {
  return makeRequest<CheckoutSessionResponse>(`/stripe/checkout/${teamId}`, {
    method: 'POST',
    data: { price_id: priceId },
  });
}

export async function getSubscriptionStatus(teamId: string): Promise<SubscriptionResponse> {
  return makeRequest<SubscriptionResponse>(`/subscriptions/${teamId}`, {
    method: 'GET',
  });
}

