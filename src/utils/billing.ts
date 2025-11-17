import { LineItem } from '../services/paymentService';

/**
 * Formats a line item description based on the unit price.
 * - 500.00 (50000 cents) = "Polaris Premium Plan"
 * - 50.00 (5000 cents) = "{quantity} × Additional Members (at {currency} {amount}/month)"
 * - Otherwise returns the original description
 */
export function formatLineItemDescription(item: LineItem): string {
  const unitAmount = item.price?.unit_amount ?? item.amount / item.quantity;

  // Plan price: 500.00 (50000 cents)
  if (unitAmount === 50000) {
    return 'Polaris Premium Plan';
  }

  // Additional members: 50.00 (5000 cents)
  if (unitAmount === 5000) {
    const amount = (unitAmount / 100).toFixed(2);
    const currency = item.currency.toUpperCase();
    return `${item.quantity} Additional Members (at ${currency} ${amount}/month)`;
  }

  // Fallback to original description
  return item.description;
}

