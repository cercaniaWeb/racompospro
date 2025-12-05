import React from 'react';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';

interface ReportCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend,
  description,
  onAction,
  actionLabel = 'Ver detalles',
  className = ''
}) => {
  return (
    <div className={`glass rounded-xl border border-white/10 shadow p-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {icon || (
            <div className="bg-primary-100 p-3 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="ml-4 flex-1">
          <Text variant="h5" className="font-semibold text-foreground">
            {title}
          </Text>

          <div className="flex items-baseline mt-1">
            <Text variant="h3" className="font-bold text-foreground">
              {value}
            </Text>

            {change !== undefined && (
              <div className={`ml-2 flex items-baseline ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                <Text variant="caption" className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {changeLabel || `${Math.abs(change)}%`}
                </Text>
              </div>
            )}
          </div>

          {description && (
            <Text variant="caption" className="mt-1 text-muted-foreground">
              {description}
            </Text>
          )}

          {onAction && (
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={onAction}
              >
                {actionLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportCard;