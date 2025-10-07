import React, { useState } from 'react';

import Button from '../../components/ui/Button';
import { motion } from 'framer-motion';

interface Plan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    users: number | 'unlimited';
    projects: number | 'unlimited';
    storage: number | 'unlimited'; // in GB
  };
  recommended?: boolean;
}

const Subscription: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  
  // Current subscription
  const currentSubscription = {
    plan: 'Pro',
    status: 'active',
    nextBillingDate: '2023-11-15',
    users: 8,
    maxUsers: 10 as number | 'unlimited', // Type annotation to match Plan interface
    projects: 12,
    storage: {
      used: 2.4, // in GB
      total: 50, // in GB
    },
  };
  
  // Plans data
  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: billingCycle === 'monthly' ? 29 : 290,
      billingCycle,
      features: [
        'Up to 3 users',
        '5 projects',
        '10 GB storage',
        'Basic AI capabilities',
        'Email support',
      ],
      limits: {
        users: 3,
        projects: 5,
        storage: 10,
      },
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingCycle === 'monthly' ? 49 : 490,
      billingCycle,
      features: [
        'Up to 10 users',
        'Unlimited projects',
        '50 GB storage',
        'Advanced AI capabilities',
        'Priority email support',
        'Analytics dashboard',
      ],
      limits: {
        users: 10,
        projects: 'unlimited',
        storage: 50,
      },
      recommended: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: billingCycle === 'monthly' ? 99 : 990,
      billingCycle,
      features: [
        'Unlimited users',
        'Unlimited projects',
        '500 GB storage',
        'Premium AI capabilities',
        'Dedicated support',
        'Advanced analytics',
        'Custom integrations',
        'SSO authentication',
      ],
      limits: {
        users: 'unlimited',
        projects: 'unlimited',
        storage: 500,
      },
    },
  ];
  
  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };
  
  const handleConfirmPlan = () => {
    // In a real app, you would make an API call to update the subscription
    console.log('Subscribing to plan:', selectedPlan);
    setShowConfirmModal(false);
  };
  
  const formatStorage = (gb: number | 'unlimited') => {
    if (gb === 'unlimited') return 'Unlimited';
    return `${gb} GB`;
  };
  
  const formatUsers = (users: number | 'unlimited') => {
    if (users === 'unlimited') return 'Unlimited users';
    return `${users} user${users > 1 ? 's' : ''}`;
  };
  
  const formatProjects = (projects: number | 'unlimited') => {
    if (projects === 'unlimited') return 'Unlimited projects';
    return `${projects} project${projects > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
      </div>
      
      {/* Current subscription */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Current Plan</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{currentSubscription.plan} Plan</h3>
              <p className="text-gray-600 mt-1">
                {currentSubscription.plan === 'Pro' ? '$49/month per user' : 
                 currentSubscription.plan === 'Starter' ? '$29/month per user' : 
                 '$99/month per user'} • Billed monthly
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Users</h4>
              <div className="mt-2 flex justify-between">
                <span className="text-lg font-medium text-gray-900">{currentSubscription.users}</span>
                <span className="text-gray-500">/ {currentSubscription.maxUsers === 'unlimited' ? 'Unlimited' : currentSubscription.maxUsers}</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full" 
                  style={{ 
                    width: currentSubscription.maxUsers === 'unlimited' 
                      ? '10%' 
                      : `${(currentSubscription.users / currentSubscription.maxUsers) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Projects</h4>
              <div className="mt-2 flex justify-between">
                <span className="text-lg font-medium text-gray-900">{currentSubscription.projects}</span>
                <span className="text-gray-500">/ Unlimited</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Storage</h4>
              <div className="mt-2 flex justify-between">
                <span className="text-lg font-medium text-gray-900">{currentSubscription.storage.used} GB</span>
                <span className="text-gray-500">/ {currentSubscription.storage.total} GB</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full" 
                  style={{ width: `${(currentSubscription.storage.used / currentSubscription.storage.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Your subscription will renew on <span className="font-medium">{new Date(currentSubscription.nextBillingDate).toLocaleDateString()}</span>.
              </p>
              <Button
                variant="outline"
                size="sm"
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Plans */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-medium text-gray-900">Available Plans</h2>
            <div className="bg-gray-100 p-1 rounded-lg inline-flex">
              <button
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  billingCycle === 'monthly'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  billingCycle === 'yearly'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setBillingCycle('yearly')}
              >
                Yearly <span className="text-green-600 font-medium">Save 15%</span>
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`border rounded-lg overflow-hidden ${
                  plan.recommended
                    ? 'border-primary-500 ring-1 ring-primary-500'
                    : 'border-gray-200'
                }`}
              >
                {plan.recommended && (
                  <div className="bg-primary-500 text-white text-center py-1 text-sm font-medium">
                    Recommended
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500 ml-2">
                      /month {plan.id !== 'enterprise' && 'per user'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Billed {plan.billingCycle === 'monthly' ? 'monthly' : 'annually'}
                  </p>
                  
                  <div className="mt-6">
                    <Button
                      variant={currentSubscription.plan === plan.name ? 'outline' : 'primary'}
                      fullWidth
                      disabled={currentSubscription.plan === plan.name}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {currentSubscription.plan === plan.name ? 'Current Plan' : 'Select Plan'}
                    </Button>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatUsers(plan.limits.users)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatProjects(plan.limits.projects)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatStorage(plan.limits.storage)} storage
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900">Features</h4>
                    <ul className="mt-2 space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Billing history */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Billing History</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { date: '2023-10-15', description: 'Pro Plan - Monthly', amount: '$392.00', status: 'Paid' },
                  { date: '2023-09-15', description: 'Pro Plan - Monthly', amount: '$392.00', status: 'Paid' },
                  { date: '2023-08-15', description: 'Pro Plan - Monthly', amount: '$392.00', status: 'Paid' },
                  { date: '2023-07-15', description: 'Starter Plan - Monthly', amount: '$87.00', status: 'Paid' },
                  { date: '2023-06-15', description: 'Starter Plan - Monthly', amount: '$87.00', status: 'Paid' },
                ].map((invoice, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href="#" className="text-primary-600 hover:text-primary-900">
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Payment method */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Payment Method</h2>
            <Button
              variant="outline"
              size="sm"
            >
              Update Payment Method
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 4H2c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h20c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H2V8h20v10zM14 12c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Visa ending in 4242</h3>
              <p className="text-gray-600">Expires 12/2025</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation modal */}
      {showConfirmModal && selectedPlan && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Confirm Subscription Change</h3>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600">
                You are about to switch to the <span className="font-medium">{selectedPlan.name} Plan</span> at ${selectedPlan.price}/month{selectedPlan.id !== 'enterprise' && ' per user'}.
              </p>
              
              <div className="mt-4">
                <h4 className="font-medium text-gray-900">This plan includes:</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-600">{formatUsers(selectedPlan.limits.users)}</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-600">{formatProjects(selectedPlan.limits.projects)}</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-600">{formatStorage(selectedPlan.limits.storage)} storage</span>
                  </li>
                </ul>
              </div>
              
              <div className="mt-6">
                <p className="text-sm text-gray-500">
                  Your new subscription will be effective immediately. You will be charged the prorated amount for the remainder of the current billing cycle.
                </p>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmPlan}
                >
                  Confirm Change
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
