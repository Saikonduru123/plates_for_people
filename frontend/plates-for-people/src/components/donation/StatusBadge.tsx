import React from 'react';
import { IonBadge, IonIcon } from '@ionic/react';
import {
  timeOutline,
  checkmarkCircle,
  closeCircle,
  alertCircle,
  checkmarkDoneCircle,
} from 'ionicons/icons';
import type { DonationStatus } from '../../types';
import './StatusBadge.css';

interface StatusBadgeProps {
  status: DonationStatus;
  size?: 'small' | 'medium' | 'large';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const getStatusConfig = (status: DonationStatus) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          color: 'warning',
          icon: timeOutline,
          label: 'Pending',
        };
      case 'confirmed':
        return {
          color: 'primary',
          icon: checkmarkCircle,
          label: 'Confirmed',
        };
      case 'completed':
        return {
          color: 'success',
          icon: checkmarkDoneCircle,
          label: 'Completed',
        };
      case 'cancelled':
        return {
          color: 'medium',
          icon: closeCircle,
          label: 'Cancelled',
        };
      case 'rejected':
        return {
          color: 'danger',
          icon: alertCircle,
          label: 'Rejected',
        };
      default:
        return {
          color: 'medium',
          icon: alertCircle,
          label: status,
        };
    }
  };

  const config = getStatusConfig(status);
  
  const sizeClass = 
    size === 'small' ? 'status-badge-small' :
    size === 'large' ? 'status-badge-large' :
    'status-badge-medium';

  return (
    <IonBadge color={config.color} className={`status-badge ${sizeClass}`}>
      <IonIcon icon={config.icon} />
      <span>{config.label}</span>
    </IonBadge>
  );
};

export default StatusBadge;
