import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonButtons,
  IonIcon,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  useIonToast,
  RefresherEventDetail,
} from '@ionic/react';
import {
  statsChartOutline,
  checkmarkCircleOutline,
  timeOutline,
  closeCircleOutline,
  restaurantOutline,
  locationOutline,
  addCircleOutline,
  settingsOutline,
  listOutline,
  logOutOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ngoService } from '../../services/ngoService';
import { donationService } from '../../services/donationService';
import type { NGODashboard, NGOProfile, Donation } from '../../types';
import DonationCard from '../../components/donation/DonationCard';
import NotificationBell from '../../components/NotificationBell';
import './NGODashboard.css';

const NGODashboard: React.FC = () => {
  const history = useHistory();
  const [present] = useIonToast();
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<NGODashboard | null>(null);
  const [profile, setProfile] = useState<NGOProfile | null>(null);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // Load dashboard stats and profile in parallel
      const [dashboardData, profileData] = await Promise.all([ngoService.getDashboard(), ngoService.getProfile()]);

      setDashboard(dashboardData);
      setProfile(profileData);

      // Load recent donations if available
      const donations = dashboardData.recent_donations || dashboardData.recent_requests || [];
      if (donations.length > 0) {
        setRecentDonations(donations);
      }
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      present({
        message: 'Failed to load dashboard data',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadDashboard();
    event.detail.complete();
  };

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  const getVerificationStatusBadge = () => {
    if (!profile) return null;

    const statusConfig = {
      verified: { color: 'success', text: 'Verified' },
      pending: { color: 'warning', text: 'Pending Verification' },
      rejected: { color: 'danger', text: 'Rejected' },
    };

    const config = statusConfig[profile.verification_status] || statusConfig.pending;

    return (
      <IonBadge color={config.color} className="verification-badge">
        {config.text}
      </IonBadge>
    );
  };

  const handleDonationClick = (donation: Donation) => {
    history.push(`/ngo/donation/${donation.id}`);
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>NGO Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading dashboard...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!dashboard || !profile) {
    return null;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>NGO Dashboard</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" style={{ '--padding-start': '8px', '--padding-end': '8px' }}>
              <NotificationBell />
            </IonButton>
            <IonButton fill="clear" onClick={() => history.push('/ngo/profile')}>
              <IonIcon icon={settingsOutline} color="primary" style={{ fontSize: '28px' }} />
            </IonButton>
            <IonButton fill="clear" onClick={handleLogout}>
              <IonIcon icon={logOutOutline} color="danger" style={{ fontSize: '28px' }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="ngo-dashboard-container">
          {/* Welcome Header */}
          <div className="welcome-header">
            <div className="welcome-content">
              <h1>Welcome, {profile.organization_name}</h1>
              {getVerificationStatusBadge()}
            </div>
            <p className="welcome-subtitle">Manage your donation requests and locations</p>
          </div>

          {/* Verification Alert */}
          {profile.verification_status === 'pending' && (
            <IonCard className="alert-card warning">
              <IonCardContent>
                <div className="alert-content">
                  <IonIcon icon={timeOutline} className="alert-icon" />
                  <div>
                    <h3>Verification Pending</h3>
                    <p>Your NGO profile is under review. You'll be notified once verified.</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {profile.verification_status === 'rejected' && (
            <IonCard className="alert-card danger">
              <IonCardContent>
                <div className="alert-content">
                  <IonIcon icon={closeCircleOutline} className="alert-icon" />
                  <div>
                    <h3>Verification Rejected</h3>
                    <p>{profile.rejection_reason || 'Please contact support for more information.'}</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Quick Stats Grid */}
          <IonGrid className="stats-grid">
            <IonRow>
              <IonCol size="6" sizeMd="3">
                <IonCard className="stat-card primary">
                  <IonCardContent>
                    <div className="stat-icon">
                      <IonIcon icon={statsChartOutline} />
                    </div>
                    <div className="stat-value">{dashboard.total_donations_received || dashboard.total_requests || 0}</div>
                    <div className="stat-label">Total Requests</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="6" sizeMd="3">
                <IonCard className="stat-card warning">
                  <IonCardContent>
                    <div className="stat-icon">
                      <IonIcon icon={timeOutline} />
                    </div>
                    <div className="stat-value">{dashboard.pending_donations || dashboard.pending_requests || 0}</div>
                    <div className="stat-label">Pending</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="6" sizeMd="3">
                <IonCard className="stat-card success">
                  <IonCardContent>
                    <div className="stat-icon">
                      <IonIcon icon={checkmarkCircleOutline} />
                    </div>
                    <div className="stat-value">{dashboard.completed_donations || dashboard.completed_requests || 0}</div>
                    <div className="stat-label">Completed</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="6" sizeMd="3">
                <IonCard className="stat-card info">
                  <IonCardContent>
                    <div className="stat-icon">
                      <IonIcon icon={restaurantOutline} />
                    </div>
                    <div className="stat-value">{dashboard.total_meals_received || dashboard.total_plates_received || 0}</div>
                    <div className="stat-label">Total Plates</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Rating Card */}
          {/* Quick Actions */}
          <div className="quick-actions">
            <h2 className="section-title">Quick Actions</h2>
            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <IonCard className="action-card" button onClick={() => history.push('/ngo/donations')}>
                    <IonCardContent>
                      <IonIcon icon={listOutline} className="action-icon" />
                      <div className="action-label">View All Requests</div>
                      {dashboard.pending_requests > 0 && (
                        <IonBadge color="warning" className="action-badge">
                          {dashboard.pending_requests}
                        </IonBadge>
                      )}
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6">
                  <IonCard className="action-card" button onClick={() => history.push('/ngo/locations')}>
                    <IonCardContent>
                      <IonIcon icon={locationOutline} className="action-icon" />
                      <div className="action-label">Manage Locations</div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6">
                  <IonCard className="action-card" button onClick={() => history.push('/ngo/capacity')}>
                    <IonCardContent>
                      <IonIcon icon={addCircleOutline} className="action-icon" />
                      <div className="action-label">Set Capacity</div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6">
                  <IonCard className="action-card" button onClick={() => history.push('/ngo/profile')}>
                    <IonCardContent>
                      <IonIcon icon={settingsOutline} className="action-icon" />
                      <div className="action-label">Settings</div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>
          </div>

          {/* Recent Donation Requests */}
          {recentDonations.length > 0 && (
            <div className="recent-section">
              <div className="section-header">
                <h2 className="section-title">Recent Requests</h2>
                <IonButton fill="clear" size="small" onClick={() => history.push('/ngo/donations')}>
                  View All
                </IonButton>
              </div>

              <div className="donations-list">
                {recentDonations.slice(0, 5).map((donation) => (
                  <DonationCard key={donation.id} donation={donation} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {recentDonations.length === 0 && (
            <IonCard className="empty-state-card">
              <IonCardContent>
                <div className="empty-state">
                  <IonIcon icon={listOutline} className="empty-icon" />
                  <h3>No Donation Requests Yet</h3>
                  <p>Donation requests will appear here once donors start submitting them.</p>
                  <IonButton onClick={() => history.push('/ngo/locations')}>
                    <IonIcon slot="start" icon={locationOutline} />
                    Add Location
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NGODashboard;
