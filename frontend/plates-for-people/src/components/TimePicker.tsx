import React, { useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonDatetime } from '@ionic/react';
import { timeOutline } from 'ionicons/icons';
import './TimePicker.css';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label: string;
  required?: boolean;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, label, required }) => {
  const [showModal, setShowModal] = useState(false);
  const [tempValue, setTempValue] = useState(`2000-01-01T${value}:00`);

  const handleConfirm = () => {
    const timeStr = tempValue.split('T')[1].substring(0, 5);
    onChange(timeStr);
    setShowModal(false);
  };

  const handleCancel = () => {
    setTempValue(`2000-01-01T${value}:00`);
    setShowModal(false);
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return 'Select time';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <>
      <div className="custom-picker-container">
        <label className="custom-picker-label">
          {label} {required && <span className="required-asterisk">*</span>}
        </label>
        <button type="button" className="custom-picker-button" onClick={() => setShowModal(true)}>
          <span className="picker-icon">🕐</span>
          <span className="picker-value">{formatDisplayTime(value)}</span>
        </button>
      </div>

      <IonModal isOpen={showModal} onDidDismiss={handleCancel} className="time-picker-modal">
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
        <IonContent className="time-picker-content">
          <IonDatetime
            value={tempValue}
            onIonChange={(e) => setTempValue(e.detail.value as string)}
            presentation="time"
            size="cover"
            preferWheel={false}
          />
        </IonContent>
      </IonModal>
    </>
  );
};
