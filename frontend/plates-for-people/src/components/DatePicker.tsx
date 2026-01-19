import React, { useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonDatetime } from '@ionic/react';
import { calendarOutline } from 'ionicons/icons';
import './DatePicker.css';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label: string;
  min?: string;
  required?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, label, min, required }) => {
  const [showModal, setShowModal] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleConfirm = () => {
    onChange(tempValue);
    setShowModal(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setShowModal(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Select date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <div className="custom-picker-container">
        <label className="custom-picker-label">
          {label} {required && <span className="required-asterisk">*</span>}
        </label>
        <button type="button" className="custom-picker-button" onClick={() => setShowModal(true)}>
          <span className="picker-icon">📅</span>
          <span className="picker-value">{formatDisplayDate(value)}</span>
        </button>
      </div>

      <IonModal isOpen={showModal} onDidDismiss={handleCancel} className="date-picker-modal">
        <IonHeader>
          <IonToolbar>
            <IonTitle>{label}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleCancel}>Cancel</IonButton>
              <IonButton strong onClick={handleConfirm}>
                Done
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="date-picker-content">
          <IonDatetime
            value={tempValue}
            onIonChange={(e) => setTempValue(e.detail.value as string)}
            presentation="date"
            min={min}
            size="cover"
            preferWheel={false}
          />
        </IonContent>
      </IonModal>
    </>
  );
};
