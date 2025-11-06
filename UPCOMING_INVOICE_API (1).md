# Billing Summary API Documentation

## Overview
This API endpoint returns both the latest finalized (current) invoice and the upcoming invoice preview for a team's active subscription. Use it to power your billing dashboard and show prorations when members change mid-cycle.

## Endpoint
```
GET /api/subscriptions/{team_id}/billing-summary
```

## Authentication
Currently, this endpoint does not require authentication (consistent with other subscription endpoints in `stripe_payment.py`). You may add authentication in production as needed.

## Request

### Path Parameters
- `team_id` (integer, required): The ID of the team to fetch the upcoming invoice for.

### Example Request
```bash
curl -X GET "http://127.0.0.1:5001/api/subscriptions/18/billing-summary"
```

## Response

### Success Response (200 OK)
```json
{
  "current_invoice": {
    "invoice_id": "in_123...",
    "subscription_id": "sub_123...",
    "customer_id": "cus_123...",
    "amount_due": 50000,
    "amount_paid": 50000,
    "amount_remaining": 0,
    "subtotal": 50000,
    "total": 50000,
    "currency": "BRL",
    "period_start": "2025-10-10T09:02:02+00:00",
    "period_end": "2025-11-10T09:02:02+00:00",
    "status": "paid",
    "hosted_invoice_url": "https://...",
    "invoice_pdf": "https://...",
    "line_items": [
      {
        "id": "il_...",
        "description": "1 × polaris-stripe-product (at R$ 500.00 / month)",
        "amount": 50000,
        "currency": "brl",
        "quantity": 1,
        "price": {
          "id": "price_1SNAuKAIZic08EhhdUtSPQ1r",
          "nickname": null,
          "unit_amount": 50000,
          "currency": "brl"
        },
        "period": {
          "start": "2025-10-10T09:02:02+00:00",
          "end": "2025-11-10T09:02:02+00:00"
        },
        "proration": false
      }
    ]
  },
  "upcoming_invoice": {
    "invoice_id": null,  // null for upcoming invoices (not yet finalized)
    "subscription_id": "sub_1234567890",
    "customer_id": "cus_1234567890",
    "amount_due": 55000,  // in cents (550.00 BRL)
    "amount_paid": 0,
    "amount_remaining": 55000,
    "subtotal": 55000,
    "total": 55000,
    "currency": "BRL",
    "period_start": "2024-01-01T00:00:00+00:00",
    "period_end": "2024-02-01T00:00:00+00:00",
    "next_payment_attempt": "2024-02-01T00:00:00+00:00",
    "status": "draft",
    "line_items": [
      {
        "id": "il_1234567890",
        "description": "Polaris Basic Plan (Monthly)",
        "amount": 50000,  // 500.00 BRL - base plan
        "currency": "brl",
        "quantity": 1,
        "price": {
          "id": "price_1SNAuKAIZic08EhhdUtSPQ1r",
          "nickname": "Basic Monthly",
          "unit_amount": 50000,
          "currency": "brl"
        },
        "period": {
          "start": "2024-01-01T00:00:00+00:00",
          "end": "2024-02-01T00:00:00+00:00"
        },
        "proration": false
      },
      {
        "id": "il_9876543210",
        "description": "Additional team members (Overage)",
        "amount": 5000,  // 50.00 BRL - 1 overage member
        "currency": "brl",
        "quantity": 1,
        "price": {
          "id": "price_1SOEJOAIZic08EhhMj7DdWST",
          "nickname": "Overage per member",
          "unit_amount": 5000,
          "currency": "brl"
        },
        "period": {
          "start": "2024-01-01T00:00:00+00:00",
          "end": "2024-02-01T00:00:00+00:00"
        },
        "proration": true  // indicates this is a prorated charge
      }
    ],
    "discount": null,  // or discount object if applicable
    "tax": 0,
    "has_proration": true  // true if any line item has proration
  }
}
```

### Error Responses

#### 404 - No Active Subscription
```json
{
  "error": "No active subscription found"
}
```

#### 404 - Subscription Not Linked to Stripe
```json
{
  "error": "Subscription not linked to Stripe"
}
```

#### 404 - No Upcoming Invoice Available
```json
{
  "error": "No upcoming invoice available for this subscription"
```
This can occur when:
- The subscription is in trial period and no invoice is generated yet
- The subscription has been canceled
- The subscription is in an invalid state

#### 400 - Stripe API Error
```json
{
  "error": "Stripe error: [error message]"
}
```

#### 500 - Server Error
```json
{
  "error": "Server error: [error message]"
}
```

## Response Fields

### Main Invoice Object
- `invoice_id`: The Stripe invoice ID (null for upcoming invoices)
- `subscription_id`: The Stripe subscription ID
- `customer_id`: The Stripe customer ID
- `amount_due`: Total amount due in cents (includes all charges)
- `amount_paid`: Amount already paid (usually 0 for upcoming invoices)
- `amount_remaining`: Amount remaining to be paid
- `subtotal`: Subtotal before discounts/taxes
- `total`: Total amount including taxes
- `currency`: Currency code (e.g., "BRL")
- `period_start`: ISO 8601 date when the billing period starts
- `period_end`: ISO 8601 date when the billing period ends
- `next_payment_attempt`: ISO 8601 date when the payment will be attempted
- `status`: Invoice status (usually "draft" for upcoming invoices)
- `line_items`: Array of invoice line items (see below)
- `discount`: Discount object if applicable (null otherwise)
- `tax`: Tax amount in cents
- `has_proration`: Boolean indicating if any line item is prorated

### Line Item Object
- `id`: Stripe line item ID
- `description`: Description of the line item
- `amount`: Amount for this line item in cents
- `currency`: Currency code
- `quantity`: Quantity of items (for overage, this is the number of additional members)
- `price`: Price object with details
- `period`: Billing period for this line item
- `proration`: Boolean indicating if this is a prorated charge

## Use Cases

### 1. Dashboard Display
Show users what they will be charged on the next billing cycle:
```javascript
const response = await fetch(`/api/subscriptions/${teamId}/billing-summary`);
const data = await response.json();
const { current_invoice, upcoming_invoice } = data;

// Display total
console.log(`Last charge: ${(current_invoice.total / 100).toFixed(2)} ${current_invoice.currency}`);
console.log(`Next charge: ${(upcoming_invoice.total / 100).toFixed(2)} ${upcoming_invoice.currency}`);

// Show breakdown
upcoming_invoice.line_items.forEach(item => {
  console.log(`${item.description}: ${(item.amount / 100).toFixed(2)} ${item.currency}`);
});
```

### 2. Proration Preview
When adding team members mid-cycle, show users the prorated cost:
```javascript
// Check if there are prorations
if (upcoming_invoice.has_proration) {
  const proratedItems = upcoming_invoice.line_items.filter(item => item.proration);
  console.log('Prorated charges:', proratedItems);
}
```

### 3. Overage Tracking
Track how many additional members are being charged:
```javascript
const overageItem = upcoming_invoice.line_items.find(item => 
  item.price?.id === 'price_1SOEJOAIZic08EhhMj7DdWST' // overage price ID
);
if (overageItem) {
  console.log(`Additional members: ${overageItem.quantity}`);
  console.log(`Overage cost: ${(overageItem.amount / 100).toFixed(2)} ${upcoming_invoice.currency}`);
}
```

## Notes

1. **Trial Periods**: If a subscription is in trial, there may be no upcoming invoice until the trial ends.

2. **Prorations**: When team members are added mid-cycle, the overage charges are prorated. The `proration: true` flag on line items indicates this.

3. **Currency**: All amounts are in cents. Divide by 100 to get the actual currency amount.

4. **Two-Item Model**: The invoice will show:
   - Base plan item (quantity: 1, amount: 50000 cents = 500 BRL)
   - Overage item (quantity: number of additional members, amount: 5000 cents per member = 50 BRL per member)

5. **Refresh Frequency**: The invoice data is fetched live from Stripe, so it reflects the most current state of the subscription.

## Integration Example

```javascript
async function fetchBillingSummary(teamId) {
  try {
    const response = await fetch(`/api/subscriptions/${teamId}/billing-summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if authentication is added
        // 'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch billing summary');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching billing summary:', error);
    throw error;
  }
}

// Usage
const { current_invoice, upcoming_invoice } = await fetchBillingSummary(18);
console.log(`Last payment: ${(current_invoice.total / 100).toFixed(2)} ${current_invoice.currency}`);
console.log(`Next payment: ${(upcoming_invoice.total / 100).toFixed(2)} ${upcoming_invoice.currency}`);
```

## Cancel Subscription API

### Overview
Cancel a team's active subscription either at the end of the current billing period (default) or immediately.

### Endpoint
```
POST /api/subscriptions/{team_id}/cancel
```

### Authentication
Same as other subscription endpoints in this module (add your auth middleware if desired).

### Request

Path params:
- `team_id` (integer, required)

Body (JSON, optional):
```json
{
  "cancel_at_period_end": true
}
```

- `cancel_at_period_end` (boolean, optional):
  - `true` (default): subscription remains active until the current period ends, then cancels
  - `false`: cancels immediately

### Responses

Success (cancel at period end):
```json
{
  "success": true,
  "subscription": {
    "status": "active",
    "cancel_at_period_end": true,
    "current_period_end": "2025-11-30T12:00:00+00:00",
    "canceled_at": null
  }
}
```

Success (cancel immediately):
```json
{
  "success": true,
  "subscription": {
    "status": "canceled",
    "cancel_at_period_end": false,
    "current_period_end": "2025-11-30T12:00:00+00:00",
    "canceled_at": "2025-11-15T09:45:00+00:00"
  }
}
```

Errors:
```json
{ "error": "No active subscription found" }            // 404
{ "error": "Subscription not linked to Stripe" }       // 404
{ "error": "Stripe error: <message>" }                 // 400
{ "error": "Server error: <message>" }                 // 500
```

### Notes
- Default behavior is “cancel at period end” so users keep access through the paid period.
- Immediate cancel may result in Stripe prorations/refunds depending on your Stripe settings.

