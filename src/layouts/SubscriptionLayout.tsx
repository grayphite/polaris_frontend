import React from 'react';
import SubscriptionHeader from '../components/common/SubscriptionHeader';

interface SubscriptionLayoutProps {
  children: React.ReactNode;
  centered?: boolean;
  background?: 'light' | 'dim';
  contentClassName?: string;
}

const SubscriptionLayout: React.FC<SubscriptionLayoutProps> = ({
  children,
  centered = false,
  background = 'light',
  contentClassName = 'w-full max-w-4xl',
}) => {
  const alignmentClasses = centered ? 'items-center justify-center' : 'items-start justify-center';
  const backgroundClass = background === 'dim' ? 'bg-gray-900/80' : 'bg-gray-50';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SubscriptionHeader />
      <main
        className={`flex-1 flex px-4 sm:px-6 lg:px-8 py-8 ${alignmentClasses} ${backgroundClass} overflow-y-auto`}
      >
        <div className={contentClassName}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default SubscriptionLayout;

