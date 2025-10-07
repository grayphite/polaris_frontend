import React, { ReactNode } from 'react';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-gray-600">{subtitle}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
};

export default PageTitle;
