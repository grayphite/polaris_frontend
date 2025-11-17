import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Card from '../common/Card';
import Loader from '../common/Loader';
import { makeRequest } from '../../services/api';
import { Plan, PlanPrice } from '../../services/paymentService';
import { showErrorToast } from '../../utils/toast';

interface PlansResponse {
  plans: Plan[];
}

const PricingSection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      // Fetch plans without team_id for public landing page
      const response = await makeRequest<PlansResponse>('/plans', {
        method: 'GET',
      });
      
      // Get the premium plan (assuming it's the first one or the one with code 'premium')
      const premiumPlan = response.plans.find(p => p.code === 'premium') || response.plans[0];
      
      if (premiumPlan) {
        setPlan(premiumPlan);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      // Don't show error toast on landing page, just log it
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (stripePriceId: string) => {
    // Redirect to register page for new users
    navigate('/register');
  };

  const formatPrice = (cents: number, currency: string) => {
    const effectiveCents = cents > 0 ? cents : 50000;
    const amount = effectiveCents / 100;
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <Loader />
          </div>
        </div>
      </section>
    );
  }

  if (!plan || !plan.prices || plan.prices.length === 0) {
    return null;
  }

  // Get the first price (assuming monthly)
  const price = plan.prices[0];
  const eligibleTrialDays = price?.eligible_trial_days ?? 7;
  const hasTrialAvailable = price?.has_trial_available ?? eligibleTrialDays > 0;
  const showTrialDetails = hasTrialAvailable && eligibleTrialDays > 0;

  return (
    <section className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('landing.pricing.subtitle')}
          </p>
        </div>

        <div className="max-w-md mx-auto">
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

              {price && (
                <div className="mb-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {price.nickname}
                    </h3>
                    
                    <div className="flex items-baseline mb-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(price.amount_cents, price.currency)}
                      </span>
                      <span className="ml-2 text-gray-500">
                        {t('subscription.perMonth', { interval: price.interval })}
                      </span>
                    </div>

                    {showTrialDetails && (
                      <>
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-4">
                          {t('subscription.trialDays', { days: eligibleTrialDays })}
                        </div>
                        <p className="text-sm text-gray-600">
                          {t('subscription.afterTrial', { 
                            price: formatPrice(price.amount_cents, price.currency), 
                            interval: price.interval 
                          })}
                        </p>
                      </>
                    )}
                  </div>

                  {price.per_seat_amount_cents > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{t('subscription.additionalMembers')}</span><br />
                        {t('subscription.perExtraMember', { 
                          price: formatPrice(price.per_seat_amount_cents, price.currency), 
                          interval: price.interval 
                        })}
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
              )}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

