import { InputHTMLAttributes, forwardRef } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  valueFormat?: (value: number) => string;
  marks?: { value: number; label: string }[];
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ label, value, onChange, showValue = true, valueFormat, marks, className = '', ...props }, ref) => {
    const formattedValue = valueFormat ? valueFormat(value) : value.toString();

    return (
      <div className="w-full">
        {(label || showValue) && (
          <div className="flex justify-between items-center mb-2">
            {label && <label className="input-label mb-0">{label}</label>}
            {showValue && (
              <span className="text-lg font-semibold text-primary-600">{formattedValue}</span>
            )}
          </div>
        )}
        <input
          ref={ref}
          type="range"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600 ${className}`}
          {...props}
        />
        {marks && (
          <div className="flex justify-between mt-1">
            {marks.map((mark) => (
              <span
                key={mark.value}
                className={`text-xs ${value === mark.value ? 'text-primary-600 font-medium' : 'text-gray-400'}`}
              >
                {mark.label}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';
