import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function Card({ children, className = '', title, subtitle }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="card-header">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subvalue?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({ label, value, subvalue, trend, className = '' }: StatCardProps) {
  const trendColors = {
    up: 'text-success-600',
    down: 'text-danger-600',
    neutral: 'text-gray-500',
  };

  return (
    <div className={`stat-card ${className}`}>
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${trend ? trendColors[trend] : ''}`}>{value}</p>
      {subvalue && <p className="stat-subvalue">{subvalue}</p>}
    </div>
  );
}
