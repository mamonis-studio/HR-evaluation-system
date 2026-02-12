import clsx from 'clsx';
import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

// ===== Badge =====

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const badgeVariants = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', badgeVariants[variant])}>
      {children}
    </span>
  );
}

// ===== Button =====

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3',
  };

  return (
    <button
      className={clsx(
        'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          処理中...
        </span>
      ) : children}
    </button>
  );
}

// ===== Card =====

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, className, onClick, hover }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-gray-200',
        hover && 'hover:border-gray-400 transition-colors cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ===== Input =====

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        className={clsx(
          'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm',
          error ? 'border-red-300' : 'border-gray-300',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// ===== Textarea =====

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <textarea
        className={clsx(
          'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm',
          className
        )}
        {...props}
      />
    </div>
  );
}

// ===== Select =====

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        className={clsx(
          'px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ===== GradeSelector =====

interface GradeSelectorProps {
  value: string;
  onChange: (grade: string) => void;
  grades?: readonly string[];
}

export function GradeSelector({ value, onChange, grades = ['SS', 'S', 'A+', 'A', 'B', 'C', 'D'] }: GradeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {grades.map((grade) => (
        <button
          key={grade}
          type="button"
          onClick={() => onChange(grade)}
          className={clsx(
            'px-4 py-2 border rounded-lg text-sm font-medium transition-colors',
            value === grade
              ? 'bg-gray-900 text-white border-gray-900'
              : 'border-gray-300 text-gray-700 hover:border-gray-400'
          )}
        >
          {grade}
        </button>
      ))}
    </div>
  );
}

// ===== StatusBadge =====

import { STATUS_LABELS, type EvaluationStatus } from '../types';

const statusVariants: Record<EvaluationStatus, BadgeProps['variant']> = {
  NOT_STARTED: 'default',
  SELF_SUBMITTED: 'info',
  EVALUATOR_SUBMITTED: 'info',
  MANAGER_APPROVED: 'warning',
  DIRECTOR_EVALUATED: 'warning',
  FINALIZED: 'success',
};

export function StatusBadge({ status }: { status: EvaluationStatus }) {
  return <Badge variant={statusVariants[status]}>{STATUS_LABELS[status]}</Badge>;
}

// ===== GradeBadge =====

export function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span className="text-gray-400 text-sm">-</span>;
  return (
    <span className="inline-flex items-center justify-center px-3 py-1 bg-gray-900 text-white rounded text-sm font-bold min-w-[3rem]">
      {grade}
    </span>
  );
}

// ===== PageHeader =====

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
    </div>
  );
}

// ===== EmptyState =====

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
      {message}
    </div>
  );
}

// ===== Alert =====

interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'success' | 'error';
}

const alertVariants = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
};

export function Alert({ children, variant = 'info' }: AlertProps) {
  return (
    <div className={clsx('rounded-lg border p-4 mb-6 text-sm', alertVariants[variant])}>
      {children}
    </div>
  );
}
