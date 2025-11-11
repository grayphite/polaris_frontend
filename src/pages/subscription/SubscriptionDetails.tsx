import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import PageTitle from '../../components/common/PageTitle';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/ui/Button';
import CancelSubscriptionModal from '../../components/ui/CancelSubscriptionModal';
import { getBillingSummary, Invoice, BillingSummaryResponse, resumeSubscription } from '../../services/paymentService';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import { formatDate } from '../../utils/dateTime';
import { formatLineItemDescription } from '../../utils/billing';

const SubscriptionDetails: React.FC = () => {
  const { t } = useTranslation();
  const { user, subscription, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState<BillingSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  // Redirect if not owner
  useEffect(() => {
    if (user && user.role !== 'owner') {
      navigate('/projects');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role === 'owner') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const teamId = localStorage.getItem('teamId');
    if (!teamId) {
      setError(t('billing.errors.noTeamId'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch billing summary only (subscription data comes from localStorage via AuthContext)
      const billingResponse = await getBillingSummary(teamId);
      setBillingData(billingResponse);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message;
      // Only set error if it's critical, otherwise just log
      if (errorMessage && !errorMessage.includes('No upcoming invoice')) {
        setError('serverError');
        showErrorToast(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number, currency: string): string => {
    const amount = cents / 100;
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  };

  const getSubscriptionStatusInfo = () => {
    if (!subscription) return null;

    const status = subscription.status;
    const daysLeft = subscription.trial_end 
      ? Math.ceil((new Date(subscription.trial_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    switch (status) {
      case 'trialing':
        return {
          type: 'success' as const,
          badge: 'bg-green-100 text-green-800',
          message: daysLeft !== null && daysLeft > 0 
            ? t('billing.status.trialing', { days: daysLeft })
            : t('billing.status.trialingActive'),
          showCancel: true,
        };
      case 'active':
        return {
          type: 'success' as const,
          badge: 'bg-green-100 text-green-800',
          message: t('billing.status.active'),
          showCancel: true,
        };
      case 'past_due':
        return {
          type: 'warning' as const,
          badge: 'bg-orange-100 text-orange-800',
          message: t('billing.status.pastDue'),
          showCancel: true,
        };
      case 'incomplete':
        return {
          type: 'warning' as const,
          badge: 'bg-yellow-100 text-yellow-800',
          message: t('billing.status.incomplete'),
          showCancel: false,
          action: {
            label: t('billing.completePayment'),
            onClick: () => navigate('/subscription'),
          },
        };
      case 'canceled':
        return {
          type: 'error' as const,
          badge: 'bg-red-100 text-red-800',
          message: t('billing.status.canceled'),
          showCancel: false,
          action: {
            label: t('billing.resubscribe'),
            onClick: () => navigate('/subscription'),
          },
        };
      case 'unpaid':
        return {
          type: 'error' as const,
          badge: 'bg-red-100 text-red-800',
          message: t('billing.status.unpaid'),
          showCancel: false,
          action: {
            label: t('billing.updatePayment'),
            onClick: () => navigate('/subscription'),
          },
        };
      default:
        return null;
    }
  };

  const handleCancelSuccess = async (isImmediate: boolean) => {
    // Only fetch billing data if cancellation is at period end (not immediate)
    // When cancelled immediately, user is redirected away, so no need to fetch
    if (!isImmediate) {
      await fetchData();
    }
    // Modal handles redirect if subscription is canceled immediately
  };

  const handleResumeSubscription = async () => {
    const teamId = localStorage.getItem('teamId');
    if (!teamId) {
      showErrorToast(t('billing.errors.noTeamId'));
      return;
    }

    setIsResuming(true);
    try {
      const response = await resumeSubscription(teamId);
      
      // Update subscription status from resume response
      if (subscription && response.subscription) {
        const updatedSubscription = {
          ...subscription,
          status: response.subscription.status as 'trialing' | 'active' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'canceled' | 'unpaid',
          current_period_end: response.subscription.current_period_end,
          cancel_at_period_end: response.subscription.cancel_at_period_end,
          canceled_at: response.subscription.canceled_at,
        };
        refreshSubscription([updatedSubscription]);
      }

      showSuccessToast(t('billing.success.resumed'));
      await fetchData();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || t('billing.errors.resumeFailed');
      showErrorToast(errorMessage);
    } finally {
      setIsResuming(false);
    }
  };

  if (!user || user.role !== 'owner') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex w-full items-center justify-center py-16">
        <Loader />
      </div>
    );
  }

  if (error && !subscription && !billingData) {
    const getErrorContent = () => {
      switch (error) {
        case 'noSubscription':
          return {
            title: t('billing.errors.noSubscription'),
            description: t('billing.errors.noSubscriptionDescription'),
          };
        case 'notLinked':
          return {
            title: t('billing.errors.notLinked'),
            description: t('billing.errors.notLinkedDescription'),
          };
        case 'noUpcoming':
          return {
            title: t('billing.errors.noUpcoming'),
            description: t('billing.errors.noUpcomingDescription'),
          };
        case 'serverError':
          return {
            title: t('billing.errors.serverError'),
            description: t('billing.errors.serverErrorDescription'),
          };
        default:
          return {
            title: t('billing.errors.loadFailed'),
            description: error,
          };
      }
    };

    const errorContent = getErrorContent();
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <PageTitle title={t('billing.title')} />
        <Card>
          <EmptyState
            title={errorContent.title}
            description={errorContent.description}
            action={{
              label: t('common.retry'),
              onClick: fetchData,
            }}
          />
        </Card>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  const current_invoice = billingData?.current_invoice;
  const upcoming_invoice = billingData?.upcoming_invoice;

  const renderLineItems = (lineItems: Invoice['line_items']) => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('billing.description')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('billing.quantity')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('billing.amount')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('billing.proration')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lineItems.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-sm text-gray-900">{formatLineItemDescription(item)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {formatPrice(item.amount, item.currency)}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {item.proration ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {t('billing.prorated')}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const statusInfo = getSubscriptionStatusInfo();
  const canShowInvoices = subscription && ['trialing', 'active', 'past_due'].includes(subscription.status);
  const isScheduledForCancellation = subscription?.cancel_at_period_end === true;
  const shouldShowCancelButton = statusInfo?.showCancel && !isScheduledForCancellation;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageTitle
        title={t('billing.title')}
        subtitle={t('billing.subtitle')}
        actions={
          isScheduledForCancellation ? (
            <Button 
              variant="primary" 
              onClick={handleResumeSubscription}
              isLoading={isResuming}
            >
              {t('billing.resumeSubscription')}
            </Button>
          ) : null
        }
      />

      <div className="mt-6 space-y-6">
        {isScheduledForCancellation && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="mb-1 text-sm font-medium text-blue-900">
              {t('billing.cancellationNotice.title')}
            </p>
            <p className="text-sm text-blue-700">
              {t('billing.cancellationNotice.message')}
            </p>
          </div>
        )}

        {canShowInvoices && current_invoice && current_invoice.line_items?.[0] && (
          <>
            <Card title={t('billing.purchasedPlan')}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-gray-900">
                        {current_invoice.line_items[0] ? formatLineItemDescription(current_invoice.line_items[0]) : 'N/A'}
                      </h3>
                    </div>
                    {current_invoice.status === 'paid' && (
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-green-100 text-green-800">
                        PAID
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPrice(current_invoice.total, current_invoice.currency)}
                    </p>
                    <p className="text-sm text-gray-500">{t('billing.monthlyPrice')}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-2">
                  <div className="text-sm">
                    <div>
                      <p className="text-gray-500">{t('billing.quantity')}</p>
                      <p className="font-medium text-gray-900">{current_invoice.line_items[0]?.quantity || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {upcoming_invoice && !isScheduledForCancellation && (
              <Card title={t('billing.upcomingInvoice')}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      {upcoming_invoice.next_payment_attempt && (
                        <p className="mb-2 text-sm text-gray-600">
                          {t('billing.nextPayment')}: {formatDate(upcoming_invoice.next_payment_attempt)}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {t('billing.period')}: {formatDate(upcoming_invoice.period_start)} - {formatDate(upcoming_invoice.period_end)}
                      </p>
                      {upcoming_invoice.has_proration && (
                        <span className="mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                          {t('billing.hasProration')}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPrice(upcoming_invoice.amount_due, upcoming_invoice.currency)}
                      </p>
                      <p className="text-sm text-gray-500">{t('billing.amountDue')}</p>
                    </div>
                  </div>

                  {upcoming_invoice.line_items.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="mb-3 text-sm font-medium text-gray-900">{t('billing.lineItems')}</h4>
                      {renderLineItems(upcoming_invoice.line_items)}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </>
        )}

        {!canShowInvoices && subscription && (
          <Card>
            <EmptyState
              title={t('billing.noInvoiceAccess')}
              description={t('billing.noInvoiceAccessDescription')}
              action={statusInfo?.action
                ? {
                    label: statusInfo.action.label,
                    onClick: statusInfo.action.onClick,
                  }
                : undefined}
            />
          </Card>
        )}
      </div>

      {shouldShowCancelButton && (
        <div className="mt-8 flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCancelModalOpen(true)}
          >
            {t('billing.cancelSubscription')}
          </Button>
        </div>
      )}

      {localStorage.getItem('teamId') && shouldShowCancelButton && (
        <CancelSubscriptionModal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          teamId={localStorage.getItem('teamId')!}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
};

export default SubscriptionDetails;

