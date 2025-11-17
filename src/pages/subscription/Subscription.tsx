import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import { getPlans, createCheckoutSession, Plan } from '../../services/paymentService';
import { showErrorToast, showInfoToast } from '../../utils/toast';
import SubscriptionLayout from '../../layouts/SubscriptionLayout';
import SubscriptionBlockModal from '../../components/ui/SubscriptionBlockModal';
import { useAuth } from '../../context/AuthContext';

const Subscription: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { subscription, user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [hasDismissedModal, setHasDismissedModal] = useState(false);

  const viewerRole = user?.role ?? 'member';
  const invalidStatuses = new Set(['past_due', 'incomplete', 'incomplete_expired', 'canceled', 'unpaid']);
  const shouldShowBlockModal = subscription ? invalidStatuses.has(subscription.status) : false;
  const locationState = location.state as { showRenewOverlay?: boolean } | null;
  const showRenewOverlayFromState = Boolean(locationState?.showRenewOverlay);
  const [showBlockModal, setShowBlockModal] = useState<boolean>(() => shouldShowBlockModal || showRenewOverlayFromState);

  // Show message if redirected from cancellation
  useEffect(() => {
    const message = (location.state as any)?.message;
    if (message) {
      showInfoToast(message);
    }
  }, [location.state]);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (showRenewOverlayFromState) {
      setHasDismissedModal(false);
      setShowBlockModal(true);
      navigate(location.pathname, { replace: true });
    }
  }, [showRenewOverlayFromState, navigate, location.pathname]);

  useEffect(() => {
    if (shouldShowBlockModal && !hasDismissedModal) {
      setShowBlockModal(true);
    }

    if (!shouldShowBlockModal) {
      setHasDismissedModal(false);
      if (!showRenewOverlayFromState) {
        setShowBlockModal(false);
      }
    }
  }, [shouldShowBlockModal, hasDismissedModal, showRenewOverlayFromState]);

  const fetchPlans = async () => {
    const teamId = localStorage.getItem('teamId');

    if (!teamId) {
      showErrorToast(t('subscription.teamInfoError'));
      setLoading(false);
      return;
    }

    try {
      const response = await getPlans(teamId);
      setPlans(response.plans);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      showErrorToast(t('subscription.loadPlansError', { tryAgain: t('common.errors.tryAgain') }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (stripeePriceId: string) => {
    const teamId = localStorage.getItem('teamId');
    
    if (!teamId) {
      showErrorToast(t('subscription.teamInfoError'));
      return;
    }

    setCheckoutLoading(stripeePriceId);

    try {
      const response = await createCheckoutSession(teamId, stripeePriceId);
      // Redirect to Stripe checkout
      window.location.href = response.checkout_url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      showErrorToast(t('subscription.checkoutError', { tryAgain: t('common.errors.tryAgain') }));
      setCheckoutLoading(null);
    }
  };

  const handleRenewTransition = () => {
    setHasDismissedModal(true);
    setShowBlockModal(false);
  };

  const formatPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  };

  return (
    <SubscriptionLayout
      centered={loading}
      contentClassName="w-full max-w-xl"
    >
      <div className="relative">
        {showBlockModal && (
          <SubscriptionBlockModal
            subscription={subscription}
            viewerRole={viewerRole}
            onRenew={handleRenewTransition}
            useStandaloneLayout={false}
          />
        )}
        {loading ? (
          <div className="flex items-center justify-center w-full">
            <Loader />
          </div>
        ) : (
          !showBlockModal && (
            <div
              className="w-full transition-opacity duration-300"
            >
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {t('subscription.choosePlan')}
                </h1>
                <p className="text-lg text-gray-600">
                  {t('subscription.choosePlanSubtitle')}
                </p>
              </div>

              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="flex flex-col">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {plan.display_name}
                      </h2>
                      <p className="text-gray-600 mb-6">{plan.description}</p>

                      <div className="mb-6">
                        <div className="flex items-baseline mb-2">
                          <span className="text-sm text-gray-500">
                            {t('subscription.upToMembers', { count: plan.max_team_members_per_team })}
                          </span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-sm text-gray-500">
                            {plan.max_projects === -1
                              ? t('subscription.unlimitedProjects')
                              : t('subscription.projects', { count: plan.max_projects })}
                          </span>
                        </div>
                      </div>

                      {plan.prices.map((price) => {
                        const eligibleTrialDays = price.eligible_trial_days ?? 0;
                        const hasTrialAvailable = price.has_trial_available ?? eligibleTrialDays > 0;
                        const showTrialDetails = hasTrialAvailable && eligibleTrialDays > 0;

                        return (
                          <div key={price.id} className="mb-6">
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {price.nickname}
                              </h3>
                              
                              <div className="flex items-baseline mb-2">
                                <span className="text-4xl font-bold text-gray-900">
                                  BRL 500.00
                                </span>
                                <span className="ml-2 text-gray-500">
                                  {t('subscription.perMonth', { interval: price.interval })}
                                </span>
                              </div>

                              {showTrialDetails && (
                                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-4">
                                  {t('subscription.trialDays', { days: eligibleTrialDays })}
                                </div>
                              )}

                              {showTrialDetails && (
                                <p className="text-sm text-gray-600">
                                  {t('subscription.afterTrial', { price: formatPrice(price.amount_cents, price.currency), interval: price.interval })}
                                </p>
                              )}
                            </div>

                            {price.per_seat_amount_cents > 0 && (
                              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">{t('subscription.additionalMembers')}</span><br />
                                  {t('subscription.perExtraMember', { price: formatPrice(price.per_seat_amount_cents, price.currency), interval: price.interval })}
                                </p>
                              </div>
                            )}

                            <Button
                              variant="primary"
                              fullWidth
                              size="lg"
                              className="mt-4"
                              isLoading={checkoutLoading === price.stripe_price_id}
                              onClick={() => handleSubscribe(price.stripe_price_id)}
                            >
                              {t(hasTrialAvailable ? 'subscription.startFreeTrial' : 'subscription.subscribe')}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>
    </SubscriptionLayout>
  );
};

export default Subscription;
