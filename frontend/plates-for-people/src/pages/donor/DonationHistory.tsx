import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonChip,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonToast,
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import {
  filterOutline,
  checkmarkCircle,
  sadOutline,
} from 'ionicons/icons';
import { donationService } from '../../services/donationService';
import DonationCard from '../../components/donation/DonationCard';
import type { Donation, DonationStatus } from '../../types';
import './DonationHistory.css';

const DonationHistory: React.FC = () => {
  const [present] = useIonToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<DonationStatus | 'all'>('all');

  const statusFilters: Array<{ value: DonationStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const loadDonations = async () => {
    try {
      const data = await donationService.getMyDonations();
      // Sort by created_at descending (newest first)
      const sorted = data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setDonations(sorted);
      setFilteredDonations(sorted);
    } catch (error: any) {
      console.error('Failed to load donations:', error);
      present({
        message: 'Failed to load donation history',
        duration: 2000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = [...donations];

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(
        (d) => d.status.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    // Filter by search text (food type or meal type)
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.food_type.toLowerCase().includes(search) ||
          d.meal_type.toLowerCase().includes(search)
      );
    }

    setFilteredDonations(filtered);
  }, [selectedStatus, searchText, donations]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadDonations();
    event.detail.complete();
  };

  const handleStatusFilter = (status: DonationStatus | 'all') => {
    setSelectedStatus(status);
  };

  const getStatusCount = (status: DonationStatus | 'all'): number => {
    if (status === 'all') return donations.length;
    return donations.filter(
      (d) => d.status.toLowerCase() === status.toLowerCase()
    ).length;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/donor/dashboard" />
          </IonButtons>
          <IonTitle>My Donations</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Search Bar */}
        <div className="search-section">
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search by food type..."
            animated
          />
        </div>

        {/* Status Filters */}
        <div className="filter-section">
          <div className="filter-header">
            <IonIcon icon={filterOutline} />
            <span>Filter by Status</span>
          </div>
          <div className="filter-chips">
            {statusFilters.map((filter) => (
              <IonChip
                key={filter.value}
                onClick={() => handleStatusFilter(filter.value)}
                color={selectedStatus === filter.value ? 'primary' : 'medium'}
                outline={selectedStatus !== filter.value}
                className="filter-chip"
              >
                {filter.label} ({getStatusCount(filter.value)})
              </IonChip>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading donations...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && donations.length === 0 && (
          <div className="empty-state">
            <IonIcon icon={sadOutline} color="medium" />
            <h2>No Donations Yet</h2>
            <p>You haven't created any donation requests yet.</p>
            <p>Start by searching for NGOs and creating your first donation!</p>
          </div>
        )}

        {/* No Results State */}
        {!loading && donations.length > 0 && filteredDonations.length === 0 && (
          <div className="empty-state">
            <IonIcon icon={sadOutline} color="medium" />
            <h2>No Results Found</h2>
            <p>No donations match your current filters.</p>
            <p>Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Donation List */}
        {!loading && filteredDonations.length > 0 && (
          <div className="donations-list">
            <div className="results-count">
              <IonIcon icon={checkmarkCircle} color="success" />
              <span>
                Showing {filteredDonations.length} of {donations.length} donation
                {donations.length !== 1 ? 's' : ''}
              </span>
            </div>
            {filteredDonations.map((donation) => (
              <DonationCard key={donation.id} donation={donation} />
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default DonationHistory;
