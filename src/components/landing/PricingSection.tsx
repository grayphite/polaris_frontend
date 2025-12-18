import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Card from '../common/Card';

const PricingSection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const formatPrice = (cents: number, currency: string) => {
    const effectiveCents = cents > 0 ? cents : 50000;
    const amount = effectiveCents / 100;
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  };

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
                {t('subscription.premiumPlan')}
              </h2>
              <p className="text-gray-600 mb-6">{t('subscription.premiumPlanDescription')}</p>

              <div className="mb-6">
                <div className="flex items-baseline mb-2">
                  <span className="text-sm text-gray-500">
                    {t('subscription.upToMembers', { count: 2 })}
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-sm text-gray-500">
                    {t('subscription.unlimitedProjects')}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('subscription.basicMonthly')}
                  </h3>
                  
                  <div className="flex items-baseline mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(50000, "brl")}
                    </span>
                    <span className="ml-2 text-gray-500">
                      {t('subscription.perMonth', { interval: "month" })}
                    </span>
                  </div>


                  <>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-4">
                      {t('subscription.trialDays', { days: 7 })}
                    </div>
                    <p className="text-sm text-gray-600">
                      {t('subscription.afterTrial', { 
                        price: formatPrice(50000, "brl"), 
                        interval: "month"
                      })}
                    </p>
                  </>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{t('subscription.additionalMembers')}</span><br />
                    {t('subscription.perExtraMember', { 
                      price: formatPrice(5000, "brl"), 
                      interval: "month"
                    })}
                  </p>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  className="mt-4"
                  onClick={() => navigate('/register')}
                >
                  {t('subscription.startFreeTrial')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

