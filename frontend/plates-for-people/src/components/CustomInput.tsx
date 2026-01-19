import React from 'react';
import { IonIcon } from '@ionic/react';
import './CustomInput.css';

interface CustomInputProps {
  label?: string;
  placeholder?: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'time';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  icon?: any;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  className?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  error,
  icon,
  min,
  max,
  step,
  className = '',
}) => {
  return (
    <div className={`custom-input-wrapper ${className} ${error ? 'has-error' : ''}`}>
      {label && (
        <label className="custom-input-label">
          {icon && <IonIcon icon={icon} className="label-icon" />}
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      <div className="custom-input-container">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className="custom-input-field"
        />
      </div>
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};
