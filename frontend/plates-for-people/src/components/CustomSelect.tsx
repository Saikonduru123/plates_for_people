import React from 'react';
import { IonIcon } from '@ionic/react';
import './CustomSelect.css';

interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
  icon?: any;
  placeholder?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  error,
  icon,
  placeholder = 'Select an option',
  className = '',
}) => {
  return (
    <div className={`custom-select-wrapper ${className} ${error ? 'has-error' : ''}`}>
      {label && (
        <label className="custom-select-label">
          {icon && <IonIcon icon={icon} className="label-icon" />}
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      <div className="custom-select-container">
        <select value={value} onChange={(e) => onChange(e.target.value)} required={required} disabled={disabled} className="custom-select-field">
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="select-arrow">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {error && <span className="select-error-message">{error}</span>}
    </div>
  );
};
