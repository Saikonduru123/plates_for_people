import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonLabel,
  IonItem,
  IonList,
  IonText,
  IonBadge,
  IonFab,
  IonFabButton,
} from '@ionic/react';
import {
  logOutOutline,
  searchOutline,
  addCircleOutline,
  restaurantOutline,
  checkmarkCircleOutline,
  timeOutline,
  closeCircleOutline,
  trophyOutline,
  statsChartOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { donorService } from '../../services/donorService';
import { donationService } from '../../services/donationService';
import type { DonorDashboard, Donation } from '../../types';
import { getErrorMessage } from '../../utils/errorUtils';
import { getStatusColor, getStatusText } from '../../utils/formatUtils';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateUtils';
import './DonorDashboard.css';

const DonorDashboardPage: React.FC = () => {
  const history = useHistory();
  const { user, logout } = useAuth();
  
  const [dashboard, setDashboard] = useState<DonorDashboard | null>(null);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load dashboard stats
      const dashboardData = await donorService.getDashboard();
      setDashboard(dashboardData);
      
      // Load recent donations
      const donations = await donationService.getMyDonations();
      // Sort by created_at desc and take first 5
      const recent = donations
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentDonations(recent);
      
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadDashboardData();
    event.detail.complete();
  };

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  const handleDonationClick = (donation: Donation) => {
    history.push(`/donor/donations/${donation.id}`);
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading dashboard...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Dashboard</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleLogout}>
              <IonIcon icon={logOutOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="dashboard-container">
          {/* Welcome Section */}
          <div className="welcome-section ion-padding">
            <h2>Welcome back, {user?.full_name}!</h2>
            <p className="welcome-subtitle">Track your food donations and make a difference</p>
          </div>

          {/* Stats Grid */}
          {dashboard && (
            <IonGrid className="stats-grid">
              <IonRow>
                <IonCol size="6" sizeMd="3">
                  <IonCard className="stat-card stat-card-primary" button onClick={() => history.push('/donor/donations')}>
                    <IonCardContent>
                      <IonIcon icon={restaurantOutline} className="stat-icon" />
                      <div className="stat-value">{dashboard.total_donations}</div>
                      <div className="stat-label">Total Donations</div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6" sizeMd="3">
                  <IonCard className="stat-card stat-card-success">
                    <IonCardContent>
                      <IonIcon icon={checkmarkCircleOutline} className="stat-icon" />
                      <div className="stat-value">{dashboard.completed_donations}</div>
                      <div className="stat-label">Completed</div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6" sizeMd="3">
                  <IonCard className="stat-card stat-card-warning">
                    <IonCardContent>
                      <IonIcon icon={timeOutline} className="stat-icon" />
                      <div className="stat-value">{dashboard.pending_donations}</div>
                      <div className="stat-label">Pending</div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6" sizeMd="3">
                  <IonCard className="stat-card stat-card-info">
                    <IonCardContent>
                      <IonIcon icon={trophyOutline} className="stat-icon" />
                      <div className="stat-value">{dashboard.total_meals_donated}</div>
                      <div className="stat-label">Meals Donated</div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>

              {/* Additional Stats Row */}
              <IonRow className="ion-margin-top">
                <IonCol size="12" sizeMd="6">
                  <IonCard className="info-card">
                    <IonCardContent>
                      <div className="info-row">
                        <IonIcon icon={closeCircleOutline} color="danger" />
                        <span className="info-label">Cancelled:</span>
                        <strong>{dashboard.cancelled_donations}</strong>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonCard className="info-card">
                    <IonCardContent>
                      <div className="info-row">
                        <IonIcon icon={statsChartOutline} color="primary" />
                        <span className="info-label">Average Rating:</span>
                        <strong>{dashboard.average_rating.toFixed(1)} ⭐</strong>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>
          )}

          {/* Quick Actions */}
          <div className="ion-padding-horizontal">
            <IonCard className="quick-actions-card">
              <IonCardHeader>
                <IonCardTitle>Quick Actions</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol size="6">
                      <IonButton
                        expand="block"
                        onClick={() => history.push('/donor/search-ngos')}
                      >
                        <IonIcon icon={searchOutline} slot="start" />
                        Find NGOs
                      </IonButton>
                    </IonCol>
                    <IonCol size="6">
                      <IonButton
                        expand="block"
                        color="secondary"
                        onClick={() => history.push('/donor/donations')}
                      >
                        <IonIcon icon={restaurantOutline} slot="start" />
                        My Donations
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>
          </div>

          {/* Recent Donations */}
          <div className="ion-padding-horizontal ion-padding-bottom">
            <IonCard>
              <IonCardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <IonCardTitle>Recent Donations</IonCardTitle>
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={() => history.push('/donor/donations')}
                  >
                    View All
                  </IonButton>
                </div>
              </IonCardHeader>
              <IonCardContent>
                {recentDonations.length === 0 ? (
                  <div className="empty-state">
                    <IonIcon icon={restaurantOutline} className="empty-icon" />
                    <p>No donations yet</p>
                    <IonButton onClick={() => history.push('/donor/search')}>
                      Start Donating
                    </IonButton>
                  </div>
                ) : (
                  <IonList>
                    {recentDonations.map((donation) => (
                      <IonItem
                        key={donation.id}
                        button
                        detail
                        onClick={() => handleDonationClick(donation)}
                      >
                        <div className="donation-item-content">
                          <div className="donation-main">
                            <IonLabel>
                              <h3>{donation.food_type}</h3>
                              <p>
                                {donation.quantity_plates} plates • {donation.meal_type}
                              </p>
                              <p className="donation-date">
                                {formatDisplayDate(donation.donation_date)} at{' '}
                                {formatDisplayTime(donation.pickup_time_start)}
                              </p>
                            </IonLabel>
                          </div>
                          <IonBadge color={getStatusColor(donation.status)}>
                            {getStatusText(donation.status)}
                          </IonBadge>
                        </div>
                      </IonItem>
                    ))}
                  </IonList>
                )}
              </IonCardContent>
            </IonCard>
          </div>

          {/* Error Message */}
          {error && (
            <div className="ion-padding">
              <IonText color="danger">
                <p>{error}</p>
              </IonText>
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/donor/search')}>
            <IonIcon icon={addCircleOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default DonorDashboardPage;
