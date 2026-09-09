/**
 * Ticket Status Badge Component
 * IT Helpdesk RAG + Agent Architecture
 *
 * Renders a high-contrast, accessible status indicator representing the ticket's
 * current operational lifecycle state ('Pending' | 'Resolved' | 'Escalated').
 *
 * Capabilities:
 * - Color-coded semantic styles with micro-indicators (clock, checkmark, arrow)
 * - Optional interactive mode: Supports click-to-cycle workflow for triage technicians
 * - Configurable sizing ('sm' | 'md' | 'lg') matching compact queue lists or detail panels
 */

import React from 'react';
import { TicketLifecycleState } from '../types';
import { Clock, CheckCircle2, ArrowUpRight } from 'lucide-react';

interface TicketStatusBadgeProps {
  /** The current lifecycle status of the ticket */
  status: TicketLifecycleState;
  /** Visual scale of the badge */
  size?: 'sm' | 'md' | 'lg';
  /** When true, allows clicking the badge to cycle through states */
  interactive?: boolean;
  /** Callback fired when status is changed interactively */
  onStatusChange?: (newStatus: TicketLifecycleState) => void;
  /** Additional custom Tailwind class names */
  className?: string;
}

/**
 * Visual styling, icons, and lifecycle transition order
 */
const STATUS_CONFIG: Record<
  TicketLifecycleState,
  {
    label: string;
    classes: string;
    icon: React.ReactNode;
    dotClass: string;
    nextStatus: TicketLifecycleState;
    description: string;
  }
> = {
  Pending: {
    label: 'Pending',
    classes:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700/80',
    icon: <Clock className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />,
    dotClass: 'bg-slate-400 dark:bg-slate-500',
    nextStatus: 'Resolved',
    description: 'Ticket queued / awaiting automated analysis or agent response',
  },
  Resolved: {
    label: 'Resolved',
    classes:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    dotClass: 'bg-emerald-500',
    nextStatus: 'Escalated',
    description: 'Ticket resolution completed (via AI grounding or verified solution)',
  },
  Escalated: {
    label: 'Escalated',
    classes:
      'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50',
    icon: <ArrowUpRight className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />,
    dotClass: 'bg-amber-500',
    nextStatus: 'Pending',
    description: 'Ticket escalated to human technician / Tier-2 priority queue',
  },
};

export const TicketStatusBadge: React.FC<TicketStatusBadgeProps> = ({
  status,
  size = 'sm',
  interactive = false,
  onStatusChange,
  className = '',
}) => {
  const meta = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;

  // Spacing and font sizing adapted to visual hierarchy
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 rounded-md gap-1 font-mono',
    md: 'text-xs px-2.5 py-1 rounded-lg gap-1.5 font-mono',
    lg: 'text-sm px-3 py-1.5 rounded-lg gap-2 font-mono',
  }[size];

  // Handle interactive state progression click
  const handleClick = (e: React.MouseEvent) => {
    if (interactive && onStatusChange) {
      e.stopPropagation();
      e.preventDefault();
      onStatusChange(meta.nextStatus);
    }
  };

  const badgeContent = (
    <>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotClass}`} />
      {meta.icon}
      <span className="font-medium whitespace-nowrap">{meta.label}</span>
    </>
  );

  // If interactive, render as button with keyboard navigation and active feedback
  if (interactive && onStatusChange) {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={`${meta.label} - ${meta.description}. Click to cycle status.`}
        className={`inline-flex items-center border transition-all cursor-pointer select-none active:scale-95 shadow-2xs ${meta.classes} ${sizeClasses} ${className}`}
      >
        {badgeContent}
      </button>
    );
  }

  // Static read-only badge
  return (
    <span
      title={`${meta.label} - ${meta.description}`}
      className={`inline-flex items-center border transition-colors select-none ${meta.classes} ${sizeClasses} ${className}`}
    >
      {badgeContent}
    </span>
  );
};

