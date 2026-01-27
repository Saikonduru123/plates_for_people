import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonBadge,
  IonIcon,
  IonButton,
  IonChip,
  IonAlert,
  IonTextarea,
  IonModal,
  useIonToast,
  useIonViewWillEnter,
  RefresherEventDetail,
} from '@ionic/react';
import {
  calendarOutline,
  locationOutline,
  restaurantOutline,
  timeOutline,
  personOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  eyeOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { donationService } from '../../services/donationService';
import type { Donation, DonationStatus } from '../../types';
import StatusBadge from '../../components/donation/StatusBadge';
import './ManageDonations.css';

const ManageDonations: React.FC = () => {
  const history = useHistory();
  const [present] = useIonToast();

  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Confirmation alerts
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [showCompleteAlert, setShowCompleteAlert] = useState(false);

  useEffect(() => {
    loadDonations();
  }, []);

  // Reload donations every time the page comes into view (handles back navigation)
  useIonViewWillEnter(() => {
    loadDonations();
  });

  // Listen for donation refresh events (when new donations are created by donors)
  useEffect(() => {
    const handleRefreshDonations = () => {
      console.log('[ManageDonations] Refresh event received, reloading donations...');
      loadDonations();
    };

    window.addEventListener('refreshDonations', handleRefreshDonations);
    return () => {
      window.removeEventListener('refreshDonations', handleRefreshDonations);
    };
  }, []);

  useEffect(() => {
    filterDonations();
  }, [donations, searchText, selectedStatus]);

  const loadDonations = async () => {
    try {
      setLoading(true);
      console.log('[ManageDonations] Loading NGO donation requests...');
      const data = await donationService.getNGORequests();
      console.log('[ManageDonations] Loaded donations:', data);
      console.log('[ManageDonations] Data type:', typeof data);
      console.log('[ManageDonations] Is array:', Array.isArray(data));
      console.log('[ManageDonations] Data length:', data?.length);
      if (data && data.length > 0) {
        console.log('[ManageDonations] First donation:', data[0]);
      }
      setDonations(data || []);
    } catch (error: any) {
      console.error('[ManageDonations] Failed to load donations:', error);
      console.error('[ManageDonations] Error response:', error.response?.data);
      console.error('[ManageDonations] Error status:', error.response?.status);
      present({
        message: error.response?.data?.detail || 'Failed to load donation requests',
        duration: 3000,
        color: 'danger',
      });
      // Set empty array on error
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDonations = () => {
    let filtered = donations;

    console.log('[ManageDonations] Filtering - selectedStatus:', selectedStatus);
    console.log('[ManageDonations] Total donations:', donations.length);
    console.log('[ManageDonations] Search text:', searchText);
    if (donations.length > 0) {
      console.log('[ManageDonations] Sample donation status:', donations[0].status);
      console.log('[ManageDonations] Sample donation food_type:', donations[0].food_type);
      console.log('[ManageDonations] Sample donation meal_type:', donations[0].meal_type);
      // Log all statuses for debugging
      const allStatuses = donations.map((d) => d.status);
      console.log('[ManageDonations] All donation statuses:', allStatuses);
    }

    // Filter by status (handle case-insensitive comparison)
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((d) => {
        const matches = d.status.toLowerCase() === selectedStatus.toLowerCase();
        if (!matches) {
          console.log(`[ManageDonations] Status mismatch: "${d.status.toLowerCase()}" !== "${selectedStatus.toLowerCase()}"`);
        }
        return matches;
      });
    }

    console.log('[ManageDonations] After status filter count:', filtered.length);

    // Filter by search text
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      console.log('[ManageDonations] Searching for:', search);
      filtered = filtered.filter(
        (d) =>
          d.food_type.toLowerCase().includes(search) || d.meal_type.toLowerCase().includes(search) || d.description?.toLowerCase().includes(search),
      );
      console.log('[ManageDonations] After search filter count:', filtered.length);
      if (filtered.length > 0) {
        console.log('[ManageDonations] First match:', filtered[0].food_type, filtered[0].meal_type);
      }
    }

    console.log('[ManageDonations] Final filtered count:', filtered.length);
    setFilteredDonations(filtered);
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadDonations();
    event.detail.complete();
  };

  const getStatusCount = (status: string): number => {
    if (status === 'all') return donations.length;
    return donations.filter((d) => d.status.toLowerCase() === status.toLowerCase()).length;
  };

  const handleConfirmDonation = async () => {
    if (!selectedDonation) return;

    try {
      setActionLoading(true);
      await donationService.confirmDonation(selectedDonation.id);

      present({
        message: 'Donation request confirmed successfully',
        duration: 3000,
        color: 'success',
        icon: checkmarkCircleOutline,
      });

      // Reload donations
      await loadDonations();
    } catch (error: any) {
      present({
        message: error.response?.data?.detail || 'Failed to confirm donation',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setActionLoading(false);
      setShowConfirmAlert(false);
      setSelectedDonation(null);
    }
  };

  const handleRejectDonation = async () => {
    if (!selectedDonation || !rejectionReason.trim()) {
      present({
        message: 'Please provide a rejection reason',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    try {
      setActionLoading(true);
      await donationService.rejectDonation(selectedDonation.id, rejectionReason);

      present({
        message: 'Donation request rejected',
        duration: 3000,
        color: 'warning',
      });

      // Reload donations
      await loadDonations();
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error: any) {
      present({
        message: error.response?.data?.detail || 'Failed to reject donation',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setActionLoading(false);
      setSelectedDonation(null);
    }
  };

  const handleCompleteDonation = async () => {
    if (!selectedDonation) return;

    try {
      setActionLoading(true);
      await donationService.completeDonation(selectedDonation.id);

      present({
        message: 'Donation marked as completed',
        duration: 3000,
        color: 'success',
        icon: checkmarkCircleOutline,
      });

      // Reload donations
      await loadDonations();
    } catch (error: any) {
      present({
        message: error.response?.data?.detail || 'Failed to complete donation',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setActionLoading(false);
      setShowCompleteAlert(false);
      setSelectedDonation(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(`2000-01-01T${timeStr}`);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getMealTypeColor = (mealType: string) => {
    const colors: Record<string, string> = {
      breakfast: 'warning',
      lunch: 'success',
      dinner: 'tertiary',
      snacks: 'primary',
    };
    return colors[mealType.toLowerCase()] || 'medium';
  };

  const handleViewDetails = (donation: Donation) => {
    history.push(`/donor/donation/${donation.id}`);
  };

  const renderDonationCard = (donation: Donation) => {
    const canConfirm = donation.status.toLowerCase() === 'pending';
    const canComplete = donation.status.toLowerCase() === 'confirmed';

    return (
      <IonCard key={donation.id} className="donation-request-card">
        <IonCardContent>
          <div className="card-header">
            <div className="card-title-section">
              <h3 className="card-title">{donation.food_type}</h3>
              <StatusBadge status={donation.status} size="small" />
            </div>
            <IonChip color={getMealTypeColor(donation.meal_type)}>
              <IonLabel>{donation.meal_type.charAt(0).toUpperCase() + donation.meal_type.slice(1)}</IonLabel>
            </IonChip>
          </div>

          <div className="card-details">
            <div className="detail-row">
              <IonIcon icon={restaurantOutline} />
              <span>{donation.quantity_plates} plates</span>
            </div>

            <div className="detail-row">
              <IonIcon icon={calendarOutline} />
              <span>{formatDate(donation.donation_date)}</span>
            </div>

            <div className="detail-row">
              <IonIcon icon={timeOutline} />
              <span>
                {formatTime(donation.pickup_time_start)} - {formatTime(donation.pickup_time_end)}
              </span>
            </div>

            {donation.description && (
              <div className="detail-row description">
                <p>{donation.description}</p>
              </div>
            )}
          </div>

          <div className="card-actions">
            <IonButton fill="clear" size="small" onClick={() => handleViewDetails(donation)}>
              <IonIcon slot="start" icon={eyeOutline} />
              View Details
            </IonButton>

            {canConfirm && (
              <>
                <IonButton
                  fill="solid"
                  size="small"
                  color="success"
                  onClick={() => {
                    setSelectedDonation(donation);
                    setShowConfirmAlert(true);
                  }}>
                  <IonIcon slot="start" icon={checkmarkCircleOutline} />
                  Accept
                </IonButton>

                <IonButton
                  fill="solid"
                  size="small"
                  color="danger"
                  onClick={() => {
                    setSelectedDonation(donation);
                    setShowRejectModal(true);
                  }}>
                  <IonIcon slot="start" icon={closeCircleOutline} />
                  Reject
                </IonButton>
              </>
            )}

            {canComplete && (
              <IonButton
                fill="solid"
                size="small"
                color="primary"
                onClick={() => {
                  setSelectedDonation(donation);
                  setShowCompleteAlert(true);
                }}>
                <IonIcon slot="start" icon={checkmarkCircleOutline} />
                Mark Complete
              </IonButton>
            )}
          </div>
        </IonCardContent>
      </IonCard>
    );
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/ngo/dashboard" />
            </IonButtons>
            <IonTitle>Donation Requests</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading donation requests...</p>
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
            <IonBackButton defaultHref="/ngo/dashboard" />
          </IonButtons>
          <IonTitle>Donation Requests</IonTitle>
        </IonToolbar>

        {/* Search Bar */}
        <IonToolbar>
          <IonSearchbar value={searchText} onIonInput={(e) => setSearchText(e.detail.value!)} placeholder="Search by food type or meal..." animated />
        </IonToolbar>

        {/* Status Filter */}
        <IonToolbar>
          <IonSegment value={selectedStatus} onIonChange={(e) => setSelectedStatus(e.detail.value as string)} scrollable>
            <IonSegmentButton value="all">
              <IonLabel>
                All
                <IonBadge color="medium">{getStatusCount('all')}</IonBadge>
              </IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="pending">
              <IonLabel>
                Pending
                <IonBadge color="warning">{getStatusCount('pending')}</IonBadge>
              </IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="confirmed">
              <IonLabel>
                Confirmed
                <IonBadge color="primary">{getStatusCount('confirmed')}</IonBadge>
              </IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="completed">
              <IonLabel>
                Completed
                <IonBadge color="success">{getStatusCount('completed')}</IonBadge>
              </IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="rejected">
              <IonLabel>
                Rejected
                <IonBadge color="danger">{getStatusCount('rejected')}</IonBadge>
              </IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="manage-donations-container">
          {filteredDonations.length === 0 ? (
            <div className="empty-state">
              <IonIcon icon={restaurantOutline} className="empty-icon" />
              <h3>No Donation Requests</h3>
              <p>
                {searchText
                  ? 'No requests match your search'
                  : selectedStatus === 'all'
                    ? 'No donation requests yet'
                    : `No ${selectedStatus} requests`}
              </p>
            </div>
          ) : (
            <div className="donations-list">{filteredDonations.map((donation) => renderDonationCard(donation))}</div>
          )}
        </div>

        {/* Confirm Alert */}
        <IonAlert
          isOpen={showConfirmAlert}
          onDidDismiss={() => {
            setShowConfirmAlert(false);
            setSelectedDonation(null);
          }}
          header="Confirm Donation Request"
          message="Are you sure you want to accept this donation request? The donor will be notified."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Accept',
              handler: handleConfirmDonation,
            },
          ]}
        />

        {/* Complete Alert */}
        <IonAlert
          isOpen={showCompleteAlert}
          onDidDismiss={() => {
            setShowCompleteAlert(false);
            setSelectedDonation(null);
          }}
          header="Mark as Complete"
          message="Has the donation been successfully picked up? This action cannot be undone."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Complete',
              handler: handleCompleteDonation,
            },
          ]}
        />

        {/* Reject Modal */}
        <IonModal
          className="reject-modal"
          isOpen={showRejectModal}
          onDidDismiss={() => {
            setShowRejectModal(false);
            setSelectedDonation(null);
            setRejectionReason('');
          }}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Reject Donation Request</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowRejectModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <p className="modal-description">Please provide a reason for rejecting this donation request. The donor will be notified.</p>

            <IonTextarea
              value={rejectionReason}
              onIonInput={(e) => setRejectionReason(e.detail.value!)}
              placeholder="e.g., Insufficient capacity on this date, Location closed..."
              rows={6}
              maxlength={500}
              counter
              className="rejection-textarea"
            />

            <IonButton expand="block" color="danger" onClick={handleRejectDonation} disabled={actionLoading || !rejectionReason.trim()}>
              {actionLoading ? (
                <>
                  <IonSpinner name="crescent" slot="start" />
                  Rejecting...
                </>
              ) : (
                <>
                  <IonIcon slot="start" icon={closeCircleOutline} />
                  Reject Request
                </>
              )}
            </IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default ManageDonations;
