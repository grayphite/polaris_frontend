import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import { getPlans, createCheckoutSession, Plan } from '../../services/paymentService';
import { listTeams, createTeam } from '../../services/teamService';
import { useAuth } from '../../context/AuthContext';
import { showErrorToast } from '../../utils/toast';

const Subscription: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await getPlans();
      setPlans(response.plans);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      showErrorToast('Failed to load plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to ensure teamId exists (fetch from API or create if missing)
  const ensureTeamId = async (): Promise<string | null> => {
    // First, try to get from localStorage
    let teamId = localStorage.getItem('teamId');
    
    if (teamId) {
      return teamId;
    }

    // If not in localStorage, try to fetch from API
    try {
      const { teams } = await listTeams({ 
        page: 1, 
        per_page: 1,
        teamsFilter: user?.role === 'owner' ? 'own-teams' : 'enrolled-teams'
      });
      
      if (teams && teams.length > 0) {
        teamId = String(teams[0].id);
        localStorage.setItem('teamId', teamId);
        return teamId;
      }

      // If no teams exist and user is owner, create a new team
      if (user && user.role === 'owner') {
        const firstName = user.firstName || 'User';
        const teamName = `${firstName} Team 1`;
        
        const team = await createTeam({ 
          name: teamName, 
          description: 'Default team' 
        });
        
        teamId = String(team.id);
        localStorage.setItem('teamId', teamId);
        return teamId;
      }
    } catch (error) {
      console.error('Failed to fetch or create team:', error);
      showErrorToast('Failed to load team information. Please try again.');
      return null;
    }

    return null;
  };

  const handleSubscribe = async (stripeePriceId: string) => {
    // Ensure teamId exists before proceeding
    const teamId = await ensureTeamId();
    
    if (!teamId) {
      showErrorToast('Unable to get team information. Please try logging in again.');
      return;
    }

    setCheckoutLoading(stripeePriceId);

    try {
      const response = await createCheckoutSession(teamId, stripeePriceId);
      // Redirect to Stripe checkout
      window.location.href = response.checkout_url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      showErrorToast('Failed to start checkout. Please try again.');
      setCheckoutLoading(null);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600">
            Select the perfect plan for your team and start your journey
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
                      Up to {plan.max_team_members_per_team} team members
                    </span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-sm text-gray-500">
                      {plan.max_projects === -1
                        ? 'Unlimited projects'
                        : `${plan.max_projects} projects`}
                    </span>
                  </div>
                </div>

                {plan.prices.map((price) => (
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
                          /{price.interval}
                        </span>
                      </div>

                      {price.trial_days > 0 && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-4">
                          {price.trial_days}-day free trial
                        </div>
                      )}

                      <p className="text-sm text-gray-600">
                        After trial: BRL 500.00/month
                      </p>
                    </div>

                    {price.per_seat_amount_cents > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Additional team members:</span><br />
                          {formatPrice(price.per_seat_amount_cents, price.currency)}/{price.interval} per extra member
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
                      Start Free Trial
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Subscription;
