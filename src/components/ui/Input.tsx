import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, suffix, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="input-label" htmlFor={props.id}>
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={`input-field ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''} ${
              error ? 'border-danger-500 focus:ring-danger-500' : ''
            } ${className}`}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface CurrencyInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  className?: string;
  id?: string;
}

export function CurrencyInput({ value, onChange, label, error, className, id }: CurrencyInputProps) {
  return (
    <Input
      type="number"
      prefix="$"
      label={label}
      error={error}
      className={className}
      id={id}
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  );
}

interface PercentInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  className?: string;
  id?: string;
}

export function PercentInput({ value, onChange, label, error, className, id }: PercentInputProps) {
  return (
    <Input
      type="number"
      suffix="%"
      step="0.01"
      label={label}
      error={error}
      className={className}
      id={id}
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  );
}
