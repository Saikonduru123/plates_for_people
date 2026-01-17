import React from 'react';
import { IonCard, IonCardContent, IonIcon, IonChip } from '@ionic/react';
import {
  locationOutline,
  calendarOutline,
  restaurantOutline,
  timeOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import type { Donation } from '../../types';
import './DonationCard.css';

interface DonationCardProps {
  donation: Donation;
}

const DonationCard: React.FC<DonationCardProps> = ({ donation }) => {
  const history = useHistory();

  const handleClick = () => {
    history.push(`/donor/donation/${donation.id}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  return (
    <IonCard className="donation-card" button onClick={handleClick}>
      <IonCardContent>
        <div className="card-header">
          <div className="card-title-section">
            <h3 className="donation-id">Donation #{donation.id}</h3>
            <StatusBadge status={donation.status} size="small" />
          </div>
          <p className="time-ago">{getTimeAgo(donation.created_at)}</p>
        </div>

        <div className="card-body">
          <div className="info-row">
            <IonIcon icon={restaurantOutline} color="primary" />
            <div className="info-content">
              <span className="info-label">Food</span>
              <span className="info-value">
                {donation.food_type} ({donation.quantity_plates} plates)
              </span>
            </div>
          </div>

          <div className="info-row">
            <IonIcon icon={calendarOutline} color="primary" />
            <div className="info-content">
              <span className="info-label">Date</span>
              <span className="info-value">{formatDate(donation.donation_date)}</span>
            </div>
          </div>

          <div className="info-row">
            <IonIcon icon={timeOutline} color="primary" />
            <div className="info-content">
              <span className="info-label">Pickup Time</span>
              <span className="info-value">
                {donation.pickup_time_start} - {donation.pickup_time_end}
              </span>
            </div>
          </div>
        </div>

        <div className="card-footer">
          <IonChip className="meal-chip" color="primary" outline>
            <IonIcon icon={restaurantOutline} />
            {donation.meal_type}
          </IonChip>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default DonationCard;
