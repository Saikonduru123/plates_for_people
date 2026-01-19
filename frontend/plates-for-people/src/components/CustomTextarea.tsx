import React from 'react';
import { IonIcon } from '@ionic/react';
import './CustomTextarea.css';

interface CustomTextareaProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  icon?: any;
  rows?: number;
  maxLength?: number;
  className?: string;
}

export const CustomTextarea: React.FC<CustomTextareaProps> = ({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  icon,
  rows = 3,
  maxLength,
  className = '',
}) => {
  return (
    <div className={`custom-textarea-wrapper ${className} ${error ? 'has-error' : ''}`}>
      {label && (
        <label className="custom-textarea-label">
          {icon && <IonIcon icon={icon} className="label-icon" />}
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      <div className="custom-textarea-container">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className="custom-textarea-field"
        />
        {maxLength && (
          <div className="character-count">
            {value.length} / {maxLength}
          </div>
        )}
      </div>
      {error && <span className="textarea-error-message">{error}</span>}
    </div>
  );
};
