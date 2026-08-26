import * as React from 'react';
import { Badge } from './badge';

interface StatusBadgeProps {
  status: string | undefined | null;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return null;

  const upper = status.toUpperCase();

  switch (upper) {
    case 'CONFIRMED':
    case 'POSTED':
    case 'COMPLETED':
    case 'FULLY_RECEIVED':
    case 'FULLY_SHIPPED':
    case 'CLOSED':
    case 'ACTIVE':
      return (
        <Badge variant="success" className={className}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {formatStatusText(upper)}
        </Badge>
      );

    case 'DRAFT':
    case 'OPEN':
      return (
        <Badge variant="secondary" className={className}>
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
          {formatStatusText(upper)}
        </Badge>
      );

    case 'IN_PROGRESS':
    case 'PARTIALLY_RECEIVED':
    case 'PARTIALLY_SHIPPED':
      return (
        <Badge variant="warning" className={className}>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          {formatStatusText(upper)}
        </Badge>
      );

    case 'CANCELLED':
    case 'INACTIVE':
    case 'SUSPENDED':
      return (
        <Badge variant="destructive" className={className}>
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          {formatStatusText(upper)}
        </Badge>
      );

    default:
      return (
        <Badge variant="info" className={className}>
          {formatStatusText(upper)}
        </Badge>
      );
  }
}

function formatStatusText(str: string): string {
  return str.replace(/_/g, ' ');
}
