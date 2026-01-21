import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonBackButton,
  IonButtons,
  IonSpinner,
  IonIcon,
  IonBadge,
  IonButton,
  useIonToast,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';
import { timeOutline, calendarOutline, restaurantOutline, locationOutline, closeCircle, checkmarkCircle, alertCircle } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { donationService } from '../../services/donationService';
import type { Donation } from '../../types';
import './DonationDetails.css';

const DonationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [present] = useIonToast();
  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDonation = async () => {
    try {
      const data = await donationService.getDonation(parseInt(id, 10));
      setDonation(data);
    } catch (error: any) {
      console.error('Failed to load donation:', error);
      present({
        message: 'Failed to load donation details',
        duration: 2000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonation();
  }, [id]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadDonation();
    event.detail.complete();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
      case 'rejected':
        return 'danger';
      default:
        return 'medium';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return alertCircle;
      case 'confirmed':
        return checkmarkCircle;
      case 'completed':
        return checkmarkCircle;
      case 'cancelled':
      case 'rejected':
        return closeCircle;
      default:
        return alertCircle;
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/donor/donations" />
            </IonButtons>
            <IonTitle>Donation Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading donation details...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!donation) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/donor/donations" />
            </IonButtons>
            <IonTitle>Donation Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="error-container">
            <IonIcon icon={alertCircle} color="danger" />
            <h2>Donation not found</h2>
            <p>The donation you're looking for doesn't exist.</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/donor/donations" />
          </IonButtons>
          <IonTitle>Donation Details</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="donation-details-container">
          {/* Status Header */}
          <div className="status-header">
            <IonBadge color={getStatusColor(donation.status)} className="status-badge-large">
              <IonIcon icon={getStatusIcon(donation.status)} />
              {donation.status}
            </IonBadge>
            <p className="donation-id">Donation #{donation.id}</p>
          </div>

          {/* Food Details */}
          <IonCard>
            <IonCardContent>
              <h2 className="card-title">
                <IonIcon icon={restaurantOutline} />
                Food Details
              </h2>
              <div className="detail-row">
                <span className="detail-label">Meal Type:</span>
                <span className="detail-value">{donation.meal_type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Food Type:</span>
                <span className="detail-value">{donation.food_type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Quantity:</span>
                <span className="detail-value">{donation.quantity_plates} plates</span>
              </div>
              {donation.description && (
                <div className="detail-row">
                  <span className="detail-label">Description:</span>
                  <span className="detail-value">{donation.description}</span>
                </div>
              )}
            </IonCardContent>
          </IonCard>

          {/* NGO Details */}
          {donation.ngo_name && (
            <IonCard>
              <IonCardContent>
                <h2 className="card-title">
                  <IonIcon icon={locationOutline} />
                  NGO Details
                </h2>
                <div className="detail-row">
                  <span className="detail-label">Organization:</span>
                  <span className="detail-value">{donation.ngo_name}</span>
                </div>
                {donation.location_name && (
                  <div className="detail-row">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{donation.location_name}</span>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          )}

          {/* Schedule Details */}
          <IonCard>
            <IonCardContent>
              <h2 className="card-title">
                <IonIcon icon={calendarOutline} />
                Schedule
              </h2>
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {new Date(donation.donation_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Pickup Time:</span>
                <span className="detail-value">
                  {donation.pickup_time_start} - {donation.pickup_time_end}
                </span>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Special Instructions */}
          {donation.special_instructions && (
            <IonCard>
              <IonCardContent>
                <h2 className="card-title">
                  <IonIcon icon={alertCircle} />
                  Special Instructions
                </h2>
                <p className="instructions-text">{donation.special_instructions}</p>
              </IonCardContent>
            </IonCard>
          )}

          {/* Rejection Reason */}
          {donation.rejection_reason && (
            <IonCard color="danger">
              <IonCardContent>
                <h2 className="card-title">
                  <IonIcon icon={closeCircle} />
                  Rejection Reason
                </h2>
                <p className="rejection-text">{donation.rejection_reason}</p>
              </IonCardContent>
            </IonCard>
          )}

          {/* Timeline */}
          <IonCard>
            <IonCardContent>
              <h2 className="card-title">
                <IonIcon icon={timeOutline} />
                Timeline
              </h2>
              <div className="timeline">
                <div className="timeline-item completed">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <p className="timeline-label">Created</p>
                    <p className="timeline-date">{new Date(donation.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {donation.confirmed_at && (
                  <div className="timeline-item completed">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <p className="timeline-label">Confirmed by NGO</p>
                      <p className="timeline-date">{new Date(donation.confirmed_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {donation.completed_at && (
                  <div className="timeline-item completed">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <p className="timeline-label">Completed</p>
                      <p className="timeline-date">{new Date(donation.completed_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {donation.cancelled_at && (
                  <div className="timeline-item cancelled">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <p className="timeline-label">Cancelled</p>
                      <p className="timeline-date">{new Date(donation.cancelled_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DonationDetails;
