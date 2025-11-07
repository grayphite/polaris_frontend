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

export interface MemberAdditionPreviewResponse {
  allowed: boolean;
  will_be_overage: boolean;
  additional_member_cost_cents: number;
  currency: string;
  current_active_members: number;
  included_members_in_plan: number;
  additional_members: number;
}

// Billing Types
export interface Price {
  id: string;
  nickname: string | null;
  unit_amount: number;
  currency: string;
}

export interface Period {
  start: string;
  end: string;
}

export interface LineItem {
  id: string;
  description: string;
  amount: number;
  currency: string;
  quantity: number;
  price: Price;
  period: Period;
  proration: boolean;
}

export interface Invoice {
  invoice_id: string | null;
  subscription_id: string;
  customer_id: string;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  subtotal: number;
  total: number;
  currency: string;
  period_start: string;
  period_end: string;
  next_payment_attempt?: string;
  status: string;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;
  line_items: LineItem[];
  discount?: any | null;
  tax?: number;
  has_proration?: boolean;
}

export interface BillingSummaryResponse {
  current_invoice: Invoice;
  upcoming_invoice: Invoice;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  subscription: {
    status: string;
    cancel_at_period_end: boolean;
    current_period_end: string;
    canceled_at: string | null;
  };
}

export interface ResumeSubscriptionResponse {
  success: boolean;
  subscription: {
    status: string;
    cancel_at_period_end: boolean;
    current_period_end: string;
    canceled_at: string | null;
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

export async function previewMemberAddition(teamId: string): Promise<MemberAdditionPreviewResponse> {
  return makeRequest<MemberAdditionPreviewResponse>(`/subscriptions/${teamId}/members/preview`, {
    method: 'POST',
  });
}

export async function getBillingSummary(teamId: string): Promise<BillingSummaryResponse> {
  return makeRequest<BillingSummaryResponse>(`/subscriptions/${teamId}/billing-summary`, {
    method: 'GET',
  });
}

export async function cancelSubscription(
  teamId: string,
  cancelAtPeriodEnd: boolean
): Promise<CancelSubscriptionResponse> {
  return makeRequest<CancelSubscriptionResponse>(`/subscriptions/${teamId}/cancel`, {
    method: 'POST',
    data: { cancel_at_period_end: cancelAtPeriodEnd },
  });
}

export async function resumeSubscription(
  teamId: string
): Promise<ResumeSubscriptionResponse> {
  return makeRequest<ResumeSubscriptionResponse>(`/subscriptions/${teamId}/resume`, {
    method: 'POST',
  });
}

