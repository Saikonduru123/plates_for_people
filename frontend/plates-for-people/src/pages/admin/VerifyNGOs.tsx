import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonBadge,
  IonChip,
  IonModal,
  IonTextarea,
  useIonToast,
  IonButtons,
  IonBackButton,
  IonLabel,
  IonItem,
} from '@ionic/react';
import {
  checkmarkCircleOutline,
  closeCircleOutline,
  documentTextOutline,
  businessOutline,
  callOutline,
  mailOutline,
  personOutline,
  cardOutline,
} from 'ionicons/icons';
import { adminService } from '../../services/adminService';
import type { NGOProfile } from '../../types';
import './VerifyNGOs.css';

const VerifyNGOs: React.FC = () => {
  const [present] = useIonToast();
  const [ngos, setNgos] = useState<NGOProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedNgo, setSelectedNgo] = useState<NGOProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingNGOs();
  }, []);

  const loadPendingNGOs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPendingNGOs();
      setNgos(data);
    } catch (error: any) {
      present({
        message: error.response?.data?.detail || 'Failed to load pending NGOs',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadPendingNGOs();
    event.detail.complete();
  };

  const handleApprove = async (ngo: NGOProfile) => {
    try {
      setProcessing(true);
      await adminService.approveNGO(ngo.id);
      present({
        message: `${ngo.organization_name} has been approved!`,
        duration: 3000,
        color: 'success',
      });
      await loadPendingNGOs();
    } catch (error: any) {
      present({
        message: error.response?.data?.detail || 'Failed to approve NGO',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectClick = (ngo: NGOProfile) => {
    setSelectedNgo(ngo);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedNgo || !rejectionReason.trim()) {
      present({
        message: 'Please provide a rejection reason',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    try {
      setProcessing(true);
      await adminService.rejectNGO(selectedNgo.id, rejectionReason);
      present({
        message: `${selectedNgo.organization_name} has been rejected`,
        duration: 3000,
        color: 'success',
      });
      setShowRejectModal(false);
      await loadPendingNGOs();
    } catch (error: any) {
      present({
        message: error.response?.data?.detail || 'Failed to reject NGO',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/admin/dashboard" />
            </IonButtons>
            <IonTitle>Verify NGOs</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading pending verifications...</p>
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
            <IonBackButton defaultHref="/admin/dashboard" />
          </IonButtons>
          <IonTitle>Verify NGOs</IonTitle>
          <IonChip slot="end" color="warning">
            <IonLabel>{ngos.length} Pending</IonLabel>
          </IonChip>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="verify-ngos-container">
          {ngos.length === 0 ? (
            <div className="empty-state">
              <IonIcon icon={checkmarkCircleOutline} className="empty-icon" />
              <h2>All caught up!</h2>
              <p>No pending NGO verifications at the moment.</p>
            </div>
          ) : (
            ngos.map((ngo) => (
              <IonCard key={ngo.id} className="ngo-card">
                <IonCardContent>
                  <div className="ngo-header">
                    <div className="ngo-icon">
                      <IonIcon icon={businessOutline} />
                    </div>
                    <div className="ngo-title">
                      <h2>{ngo.organization_name}</h2>
                      <IonBadge color="warning">Pending Verification</IonBadge>
                    </div>
                  </div>

                  <div className="ngo-details">
                    <IonItem lines="none" className="detail-item">
                      <IonIcon icon={cardOutline} slot="start" />
                      <IonLabel>
                        <p>Registration Number</p>
                        <h3>{ngo.registration_number}</h3>
                      </IonLabel>
                    </IonItem>

                    <IonItem lines="none" className="detail-item">
                      <IonIcon icon={personOutline} slot="start" />
                      <IonLabel>
                        <p>Contact Person</p>
                        <h3>{ngo.contact_person}</h3>
                      </IonLabel>
                    </IonItem>

                    <IonItem lines="none" className="detail-item">
                      <IonIcon icon={callOutline} slot="start" />
                      <IonLabel>
                        <p>Phone</p>
                        <h3>{ngo.phone}</h3>
                      </IonLabel>
                    </IonItem>

                    <IonItem lines="none" className="detail-item">
                      <IonIcon icon={mailOutline} slot="start" />
                      <IonLabel>
                        <p>Email</p>
                        <h3>{ngo.user_id}</h3>
                      </IonLabel>
                    </IonItem>

                    {ngo.verification_document_url && (
                      <IonButton
                        expand="block"
                        fill="outline"
                        size="small"
                        href={ngo.verification_document_url}
                        target="_blank"
                        className="doc-button"
                      >
                        <IonIcon icon={documentTextOutline} slot="start" />
                        View Verification Documents
                      </IonButton>
                    )}
                  </div>

                  <div className="action-buttons">
                    <IonButton
                      expand="block"
                      color="success"
                      onClick={() => handleApprove(ngo)}
                      disabled={processing}
                    >
                      <IonIcon icon={checkmarkCircleOutline} slot="start" />
                      Approve
                    </IonButton>

                    <IonButton
                      expand="block"
                      color="danger"
                      fill="outline"
                      onClick={() => handleRejectClick(ngo)}
                      disabled={processing}
                    >
                      <IonIcon icon={closeCircleOutline} slot="start" />
                      Reject
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))
          )}
        </div>

        {/* Reject Modal */}
        <IonModal isOpen={showRejectModal} onDidDismiss={() => setShowRejectModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Reject NGO</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowRejectModal(false)}>Cancel</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="reject-modal-content">
              <h2>Reject {selectedNgo?.organization_name}?</h2>
              <p>Please provide a reason for rejection. This will be sent to the NGO.</p>

              <IonTextarea
                value={rejectionReason}
                onIonInput={(e) => setRejectionReason(e.detail.value!)}
                placeholder="Enter rejection reason (e.g., Invalid documents, Missing information, etc.)"
                rows={6}
                className="rejection-textarea"
              />

              <IonButton
                expand="block"
                color="danger"
                onClick={handleRejectConfirm}
                disabled={processing || !rejectionReason.trim()}
                className="confirm-reject-button"
              >
                {processing ? (
                  <>
                    <IonSpinner name="crescent" slot="start" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <IonIcon icon={closeCircleOutline} slot="start" />
                    Confirm Rejection
                  </>
                )}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default VerifyNGOs;
