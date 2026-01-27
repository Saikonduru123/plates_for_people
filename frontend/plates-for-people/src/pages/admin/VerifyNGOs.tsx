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
  IonFooter,
  IonSegment,
  IonSegmentButton,
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
  hourglassOutline,
} from 'ionicons/icons';
import { adminService } from '../../services/adminService';
import type { NGOProfile } from '../../types';
import './VerifyNGOs.css';

const VerifyNGOs: React.FC = () => {
  const [present] = useIonToast();
  const [allNgos, setAllNgos] = useState<NGOProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedNgo, setSelectedNgo] = useState<NGOProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadAllNGOs();
  }, []);

  const loadAllNGOs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllNGOs();
      setAllNgos(data);
      setCurrentPage(1);
    } catch (error: any) {
      present({
        message: error.response?.data?.detail || 'Failed to load NGOs',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter NGOs based on selected tab
  const getFilteredNgos = () => {
    return allNgos.filter((ngo) => {
      if (selectedTab === 'pending') return ngo.verification_status === 'pending';
      if (selectedTab === 'approved') return ngo.verification_status === 'verified';
      if (selectedTab === 'rejected') return ngo.verification_status === 'rejected';
      return true;
    });
  };

  // Pagination
  const filteredNgos = getFilteredNgos();
  const totalPages = Math.ceil(filteredNgos.length / itemsPerPage);
  const paginatedNgos = filteredNgos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleTabChange = (tab: 'pending' | 'approved' | 'rejected') => {
    setSelectedTab(tab);
    setCurrentPage(1);
  };

  // Excel Export
  const exportToExcel = () => {
    const headers = ['Organization Name', 'Registration No.', 'Contact Person', 'Phone', 'Status', 'Date'];
    const rows = filteredNgos.map((ngo) => [
      ngo.organization_name,
      ngo.registration_number,
      ngo.contact_person,
      ngo.phone,
      ngo.verification_status.charAt(0).toUpperCase() + ngo.verification_status.slice(1),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ngos-${selectedTab}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadAllNGOs();
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

      // Trigger notification refresh
      window.dispatchEvent(new Event('refreshNotifications'));

      await loadAllNGOs();
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
    console.log('🔴 handleRejectConfirm called');
    console.log('selectedNgo:', selectedNgo);
    console.log('rejectionReason:', rejectionReason);

    if (!selectedNgo) {
      console.error('❌ No NGO selected');
      present({
        message: 'No NGO selected',
        duration: 2000,
        color: 'danger',
      });
      return;
    }

    if (!rejectionReason || rejectionReason.trim() === '') {
      console.warn('⚠️  No rejection reason provided');
      present({
        message: 'Please provide a rejection reason',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    try {
      setProcessing(true);
      console.log(`🔄 Rejecting NGO ${selectedNgo.id} with reason: ${rejectionReason}`);
      console.log(`📤 Calling API: /admin/ngos/${selectedNgo.id}/reject?rejection_reason=${rejectionReason}`);

      // Call the reject API
      const result = await adminService.rejectNGO(selectedNgo.id, rejectionReason);
      console.log('✅ NGO rejected successfully:', result);

      // Show success message
      present({
        message: `${selectedNgo.organization_name} has been rejected!`,
        duration: 3000,
        color: 'success',
      });

      // Trigger notification refresh
      window.dispatchEvent(new Event('refreshNotifications'));

      // Close modal and refresh list
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedNgo(null);

      // Reload the pending NGOs list after a short delay
      setTimeout(() => {
        loadAllNGOs();
      }, 500);
    } catch (error: any) {
      console.error('❌ Reject error:', error);
      console.error('Response status:', error.response?.status);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);

      const errorMessage = error.response?.data?.detail || error.message || 'Failed to reject NGO';
      present({
        message: errorMessage,
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
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Tab Navigation */}
        <div className="verify-ngos-container">
          <IonSegment
            value={selectedTab}
            onIonChange={(e) => setSelectedTab(e.detail.value as 'pending' | 'approved' | 'rejected')}
            className="ngos-segment">
            <IonSegmentButton value="pending" layout="icon-top">
              <IonIcon icon={hourglassOutline} />
              <IonLabel>Pending</IonLabel>
              <IonBadge color="warning">{allNgos.filter((n) => n.verification_status === 'pending').length}</IonBadge>
            </IonSegmentButton>
            <IonSegmentButton value="approved" layout="icon-top">
              <IonIcon icon={checkmarkCircleOutline} />
              <IonLabel>Approved</IonLabel>
              <IonBadge color="success">{allNgos.filter((n) => n.verification_status === 'verified').length}</IonBadge>
            </IonSegmentButton>
            <IonSegmentButton value="rejected" layout="icon-top">
              <IonIcon icon={closeCircleOutline} />
              <IonLabel>Rejected</IonLabel>
              <IonBadge color="danger">{allNgos.filter((n) => n.verification_status === 'rejected').length}</IonBadge>
            </IonSegmentButton>
          </IonSegment>

          {/* Table View */}
          {loading ? (
            <div className="loading-container">
              <IonSpinner name="crescent" />
              <p>Loading NGOs...</p>
            </div>
          ) : getFilteredNgos().length === 0 ? (
            <div className="empty-state">
              <IonIcon icon={checkmarkCircleOutline} className="empty-icon" />
              <h2>No {selectedTab} NGOs</h2>
              <p>No {selectedTab} NGOs at the moment.</p>
            </div>
          ) : (
            <>
              <div className="ngos-table-wrapper">
                <table className="ngos-table">
                  <thead>
                    <tr>
                      <th>Organization Name</th>
                      <th>Registration No.</th>
                      <th>Contact Person</th>
                      <th>Phone</th>
                      <th>Status</th>
                      {selectedTab === 'pending' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedNgos.map((ngo) => (
                      <tr key={ngo.id}>
                        <td className="org-name">{ngo.organization_name}</td>
                        <td>{ngo.registration_number}</td>
                        <td>{ngo.contact_person}</td>
                        <td>{ngo.phone}</td>
                        <td>
                          <IonBadge color={selectedTab === 'approved' ? 'success' : selectedTab === 'rejected' ? 'danger' : 'warning'}>
                            {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}
                          </IonBadge>
                        </td>
                        {selectedTab === 'pending' && (
                          <td className="actions-cell">
                            <IonButton size="small" color="success" onClick={() => handleApprove(ngo)} disabled={processing}>
                              <IonIcon icon={checkmarkCircleOutline} slot="icon-only" />
                            </IonButton>
                            <IonButton size="small" color="danger" onClick={() => handleRejectClick(ngo)} disabled={processing}>
                              <IonIcon icon={closeCircleOutline} slot="icon-only" />
                            </IonButton>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <IonButton size="small" disabled={currentPage === 1} onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
                    Previous
                  </IonButton>
                  <span className="page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <IonButton size="small" disabled={currentPage === totalPages} onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}>
                    Next
                  </IonButton>
                </div>
              )}
            </>
          )}
        </div>

        {/* Reject Modal */}
        <IonModal isOpen={showRejectModal} onDidDismiss={() => setShowRejectModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Reject NGO</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowRejectModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div style={{ marginTop: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Reject {selectedNgo?.organization_name}?</h2>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                Please provide a reason for rejection. This will be sent to the NGO.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Rejection Reason:</label>
                <IonTextarea
                  value={rejectionReason}
                  onIonChange={(e) => setRejectionReason(e.detail.value || '')}
                  placeholder="Enter rejection reason (e.g., Invalid documents, Missing information, etc.)"
                  rows={6}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    marginBottom: '8px',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#999' }}>Characters: {rejectionReason?.length || 0}</div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <IonButton expand="block" fill="outline" color="medium" onClick={() => setShowRejectModal(false)} disabled={processing}>
                  Cancel
                </IonButton>

                <IonButton expand="block" color="danger" onClick={handleRejectConfirm} disabled={processing}>
                  {processing ? (
                    <>
                      <IonSpinner name="crescent" slot="start" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <IonIcon icon={closeCircleOutline} slot="start" />
                      Reject
                    </>
                  )}
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default VerifyNGOs;
