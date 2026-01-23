import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonToast,
  IonCard,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSearchbar,
  IonBackButton,
  IonBadge,
  IonButtons,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { Donation } from '../../types';
import './AdminDonations.css';

const AdminDonations: React.FC = () => {
  const history = useHistory();
  const [present] = useIonToast();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadDonations();
  }, []);

  useEffect(() => {
    filterDonations();
  }, [donations, searchText, selectedStatus]);

  const loadDonations = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllDonations();
      setDonations(data);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to load donations';
      present({
        message,
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterDonations = () => {
    let filtered = [...donations];

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((donation) => donation.status === selectedStatus);
    }

    // Filter by search text
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (donation) =>
          donation.meal_type?.toLowerCase().includes(search) ||
          donation.food_type?.toLowerCase().includes(search) ||
          donation.description?.toLowerCase().includes(search) ||
          donation.ngo_name?.toLowerCase().includes(search) ||
          donation.location_name?.toLowerCase().includes(search),
      );
    }

    setFilteredDonations(filtered);
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadDonations();
    event.detail.complete();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'medium';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton />
            </IonButtons>
            <IonTitle>All Donations</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading donations...</p>
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
            <IonBackButton />
          </IonButtons>
          <IonTitle>All Donations</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="admin-donations">
          {/* Filters Section */}
          <div className="filters-section">
            <IonSearchbar
              value={searchText}
              onIonInput={(e) => setSearchText(e.detail.value || '')}
              placeholder="Search donations..."
              className="search-bar"
            />

            <IonSegment value={selectedStatus} onIonChange={(e) => setSelectedStatus(e.detail.value as string)}>
              <IonSegmentButton value="all">
                <IonLabel>All ({donations.length})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="pending">
                <IonLabel>Pending ({donations.filter((d) => d.status === 'pending').length})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="completed">
                <IonLabel>Completed ({donations.filter((d) => d.status === 'completed').length})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="cancelled">
                <IonLabel>Cancelled ({donations.filter((d) => d.status === 'cancelled').length})</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          {/* Donations List */}
          {filteredDonations.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '64px' }}>🍽️</div>
              <p>No donations found</p>
            </div>
          ) : (
            <div className="donations-list">
              {filteredDonations.map((donation) => (
                <IonCard key={donation.id} className="donation-card">
                  <IonCardContent>
                    <div className="donation-header">
                      <div className="donation-info">
                        <div className="donation-title">{donation.food_type || 'Meal Donation'}</div>
                        <div className="donation-meta">
                          <span className="meta-item">🍽️ {donation.meal_type?.toUpperCase() || 'N/A'}</span>
                          {donation.ngo_name && <span className="meta-item">🏢 {donation.ngo_name}</span>}
                        </div>
                        <div className="donation-date">📅 {formatDate(donation.created_at || '')}</div>
                      </div>
                      <div className="donation-status">
                        <IonBadge color={getStatusColor(donation.status)}>{donation.status?.toUpperCase()}</IonBadge>
                      </div>
                    </div>
                    {donation.description && <div className="donation-description">{donation.description}</div>}
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminDonations;
